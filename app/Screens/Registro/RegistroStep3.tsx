import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
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

      // 2. Subir fotos de licencia primero
      const licenseFrontURL = await uploadLicensePhoto(
        userData.licensePhotos.front,
        userId,
        'front'
      );
      const licenseBackURL = await uploadLicensePhoto(userData.licensePhotos.back, userId, 'back');

      // 2.1 Subir un manifest.json con claves ordenadas a Storage
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

      // 3. Crear documento del usuario UNA SOLA VEZ con profileComplete: true
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
        terminosAceptados: {
          aceptado: true,
          fecha: new Date().toISOString(),
          version: '1.0',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header con progreso */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={[styles.progressLine, styles.progressLineDone]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
            </View>
            <Text style={styles.stepText}>Paso 3 de 3</Text>
            <Ionicons name="people-outline" size={48} color={colors.primary} style={{ marginVertical: 8 }} />
            <Text style={styles.title}>Elige tu Rol</Text>
            <Text style={styles.subtitle}>¿Cómo quieres usar Rentik?</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Opción Viajero */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'arrendatario' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('arrendatario')}
              disabled={loading}
            >
              <View style={styles.roleContent}>
                 <View style={[styles.iconContainer, selectedRole === 'arrendatario' && styles.iconContainerSelected]}>
                    <Ionicons name="map" size={40} color={selectedRole === 'arrendatario' ? '#fff' : colors.primary} />
                 </View>
                 <View style={styles.textContainer}>
                    <Text style={styles.roleTitle}>Viajero</Text>
                    <Text style={styles.roleSubtitle}>Explora, reserva y viaja seguro con nuestra cobertura total incluida.</Text>
                 </View>
                 <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedRole === 'arrendatario' && styles.radioOuterSelected]}>
                        {selectedRole === 'arrendatario' && <View style={styles.radioInner} />}
                    </View>
                 </View>
              </View>
              {/* Visual cues instead of text heavy description */}
              <View style={styles.visualFeatures}>
                  <View style={styles.visualTag}>
                      <Ionicons name="car-outline" size={16} color={colors.primary} />
                      <Text style={styles.visualTagText}>Autos únicos</Text>
                  </View>
                  <View style={styles.visualTag}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                      <Text style={styles.visualTagText}>Seguro incluido</Text>
                  </View>
              </View>
            </TouchableOpacity>

            {/* Opción Host */}
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'arrendador' && styles.roleCardSelected]}
              onPress={() => setSelectedRole('arrendador')}
              disabled={loading}
            >
              <View style={styles.roleContent}>
                 <View style={[styles.iconContainer, selectedRole === 'arrendador' && styles.iconContainerSelected]}>
                    <Ionicons name="car-sport" size={40} color={selectedRole === 'arrendador' ? '#fff' : colors.primary} />
                 </View>
                 <View style={styles.textContainer}>
                    <Text style={styles.roleTitle}>Host</Text>
                    <Text style={styles.roleSubtitle}>Genera ingresos extra rentando tu vehículo a conductores verificados.</Text>
                 </View>
                 <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedRole === 'arrendador' && styles.radioOuterSelected]}>
                        {selectedRole === 'arrendador' && <View style={styles.radioInner} />}
                    </View>
                 </View>
              </View>
               <View style={styles.visualFeatures}>
                  <View style={styles.visualTag}>
                      <Ionicons name="cash-outline" size={16} color={colors.primary} />
                      <Text style={styles.visualTagText}>Gana dinero</Text>
                  </View>
                  <View style={styles.visualTag}>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.visualTagText}>Tu horario</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  
  // Header & Progress
  header: { alignItems: 'center', marginBottom: 32 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 8, zIndex: 10 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: colors.primary, transform: [{ scale: 1.2 }] },
  progressDotDone: { backgroundColor: colors.primary },
  progressLine: { width: 30, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  progressLineDone: { backgroundColor: colors.primary },
  
  stepText: { color: colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  formContainer: { gap: 20 },

  // Role Card Styles - Redesigned
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  visualFeatures: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  visualTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  visualTagText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
