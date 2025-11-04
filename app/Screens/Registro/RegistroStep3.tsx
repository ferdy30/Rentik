import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Firebaseauth as auth, db, storage } from '../../../FirebaseConfig';
import { colors } from '../../constants/colors';

type RoleType = 'arrendatario' | 'arrendador' | null;

// Paso 3: Selección de Rol
export default function RegistroStep3({ route, navigation }: any) {
  const userData = route.params;
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [loading, setLoading] = useState(false);

  // Ordenar claves de un objeto (recursivo) para JSON determinístico
  const sortObjectDeep = (value: any): any => {
    if (Array.isArray(value)) return value.map(sortObjectDeep);
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = sortObjectDeep((value as any)[key]);
          return acc;
        }, {} as any);
    }
    return value;
  };
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const uploadLicensePhoto = async (uri: string, userId: string, side: 'front' | 'back') => {
    try {
      // Comprimir antes de subir para mejorar rendimiento
      const compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      const filename = `licenses/${userId}/license_${side}.jpg`;
      const storageRef = ref(storage, filename);
      const size = (blob as any)?.size ?? undefined;
      console.log('[UPLOAD] start', { userId, side, size, path: storageRef.fullPath });
      // Retry simple con backoff, ayuda contra race conditions de auth o fallas transitorias
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn('[UPLOAD] attempt failed', { side, attempt, code: err?.code, message: err?.message });
          if (attempt < 3) await sleep(400 * attempt);
        }
      }
      if (lastError) throw lastError;
      const downloadURL = await getDownloadURL(storageRef);
      console.log('[UPLOAD] success', { side, url: downloadURL });
      return downloadURL;
    } catch (error) {
      const e: any = error;
      console.error('Error uploading license photo:', {
        code: e?.code,
        message: e?.message,
        serverResponse: e?.customData?.serverResponse,
      });
      throw error;
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedRole) {
      Alert.alert('Selecciona un rol', 'Por favor elige si deseas arrendar o rentar vehículos.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        'Términos y Condiciones',
        'Debes aceptar los términos y condiciones para continuar.'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Crear cuenta de Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const userId = userCredential.user.uid;

  // Asegurar que el token esté disponible para Storage (evita race conditions con reglas)
  await userCredential.user.getIdToken(true);
      // Verificación rápida de sesión activa
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        console.log('[AUTH] Esperando sesión activa para Storage...');
      }

      // 2. Crear documento del usuario de forma temprana para que el rol esté disponible al contexto
      try {
        await setDoc(doc(db, 'users', userId), {
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          telefono: `${userData.countryCode}${userData.telefono}`,
          fechaNacimiento: userData.fechaNacimiento,
          role: selectedRole,
          profileComplete: false,
          vehicleProfileComplete: false,
          terminosAceptados: {
            aceptado: true,
            fecha: new Date().toISOString(),
            version: '1.0',
          },
          address: userData.address || null,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn('[USER_DOC] early create failed, will try again later', e);
      }

      // 3. Subir fotos de licencia
      const licenseFrontURL = await uploadLicensePhoto(
        userData.licensePhotos.front,
        userId,
        'front'
      );
      const licenseBackURL = await uploadLicensePhoto(userData.licensePhotos.back, userId, 'back');

      // 3.1 Subir un manifest.json con claves ordenadas a Storage
      try {
        const manifest = sortObjectDeep({
          version: '1.0',
          userId,
          licensePhotos: {
            back: licenseBackURL,
            front: licenseFrontURL,
          },
          createdAt: new Date().toISOString(),
        });
        const manifestRef = ref(storage, `licenses/${userId}/manifest.json`);
        const json = JSON.stringify(manifest, null, 2);
        // React Native: usar Blob + uploadBytes para evitar errores de ArrayBuffer
        const jsonBlob = new Blob([json], { type: 'application/json' });
        await uploadBytes(manifestRef, jsonBlob, { contentType: 'application/json' });
        console.log('[MANIFEST] manifest.json uploaded');
      } catch (e) {
        console.warn('[MANIFEST] failed to upload manifest.json', e);
      }

      // 4. Completar y actualizar datos del usuario en Firestore
      await setDoc(doc(db, 'users', userId), {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: `${userData.countryCode}${userData.telefono}`,
        fechaNacimiento: userData.fechaNacimiento,
        role: selectedRole,
        licensePhotoURL: licenseFrontURL,
        licensePhotos: {
          front: licenseFrontURL,
          back: licenseBackURL,
        },
        address: userData.address || null,
        profileComplete: true, // Perfil completo después del registro
        vehicleProfileComplete: false, // Arrendadores pueden agregar vehículos desde el Home
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setLoading(false);

      // 4. Navegación post-registro
      // NO navegamos manualmente - el AuthContext detecta el cambio y reconstruye el stack automáticamente
      // El usuario será redirigido según su rol:
      // - Arrendador → PaymentSetup (si no tiene Stripe configurado)
      // - Arrendatario → HomeArrendatario
      // Ver AppNavigation para la lógica de guards
      console.log('[REGISTRO] Registro completado, esperando reconstrucción del stack...');
    } catch (error: any) {
      console.error('Error creating account:', error);
      Alert.alert(
        'Error',
        error.code === 'auth/email-already-in-use'
          ? 'Este correo ya está registrado.'
          : 'Ocurrió un error al crear tu cuenta. Inténtalo de nuevo.'
      );
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.background.gradientStart, colors.background.gradientEnd]}
        locations={[0.05, 0.82]}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header con progreso */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressDot} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={styles.progressDot} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
            </View>
            <Text style={styles.stepText}>Paso 3 de 3</Text>
            <Ionicons name="people-outline" size={48} color="#fff" style={{ marginVertical: 8 }} />
            <Text style={styles.title}>Elige tu Rol</Text>
            <Text style={styles.subtitle}>¿Cómo quieres usar Rentik?</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Opción Arrendatario */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'arrendatario' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('arrendatario')}
              disabled={loading}
            >
              <View style={styles.roleHeader}>
                <View
                  style={[
                    styles.roleIcon,
                    selectedRole === 'arrendatario' && styles.roleIconSelected,
                  ]}
                >
                  <Ionicons
                    name="key"
                    size={32}
                    color={selectedRole === 'arrendatario' ? '#fff' : colors.primary}
                  />
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedRole === 'arrendatario' && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedRole === 'arrendatario' && <View style={styles.radioInner} />}
                  </View>
                </View>
              </View>
              <Text style={styles.roleTitle}>Arrendatario</Text>
              <Text style={styles.roleSubtitle}>Rento vehículos</Text>
              <Text style={styles.roleDescription}>
                Puedo buscar y rentar vehículos disponibles de otros usuarios. Perfecto si necesitas
                un auto por días, semanas o meses.
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Buscar vehículos cercanos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Reservar de forma segura</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Calificar y comentar</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Opción Arrendador */}
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'arrendador' && styles.roleCardSelected]}
              onPress={() => setSelectedRole('arrendador')}
              disabled={loading}
            >
              <View style={styles.roleHeader}>
                <View
                  style={[
                    styles.roleIcon,
                    selectedRole === 'arrendador' && styles.roleIconSelected,
                  ]}
                >
                  <Ionicons
                    name="car"
                    size={32}
                    color={selectedRole === 'arrendador' ? '#fff' : colors.primary}
                  />
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedRole === 'arrendador' && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedRole === 'arrendador' && <View style={styles.radioInner} />}
                  </View>
                </View>
              </View>
              <Text style={styles.roleTitle}>Arrendador</Text>
              <Text style={styles.roleSubtitle}>Rento mis vehículos</Text>
              <Text style={styles.roleDescription}>
                Puedo publicar mis vehículos y generar ingresos rentándolos a otros usuarios.
                Controla disponibilidad, precios y aprueba reservas.
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Publicar tus vehículos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Generar ingresos pasivos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>Gestionar tus rentas</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Términos y Condiciones */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.termsLink}>Términos y Condiciones</Text>
                {' '}y la{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </TouchableOpacity>

            {/* Botón continuar */}
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Creando tu cuenta...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  (!selectedRole || !acceptedTerms) && styles.buttonDisabled,
                ]}
                onPress={handleCreateAccount}
                disabled={!selectedRole || !acceptedTerms}
              >
                <Text style={styles.buttonText}>Crear Cuenta</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  progressLineDone: {
    backgroundColor: colors.accent,
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  formContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    borderColor: colors.primary,
    shadowOpacity: 0.3,
    elevation: 8,
    backgroundColor: '#F0F9FF',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: {
    backgroundColor: colors.primary,
  },
  radioContainer: {
    padding: 4,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#032B3C',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 12,
  },
  roleDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#032B3C',
    flex: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loaderContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
