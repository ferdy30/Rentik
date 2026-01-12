import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Firebaseauth as auth, db, storage } from '../../FirebaseConfig';
import { StepIndicator } from '../../components/StepIndicator';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroStep3'>;
type RoleType = 'arrendatario' | 'arrendador' | null;

export default function RegistroStep3({ route, navigation }: Props) {
  const userData = route.params;
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const uploadLicensePhoto = async (uri: string, userId: string, side: 'front' | 'back') => {
    try {
      const compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      const filename = `licenses/${userId}/license_${side}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading license photo:', error);
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

      // 2. Subir fotos de licencia
      const licenseFrontURL = await uploadLicensePhoto(
        userData.licensePhotos.front,
        userId,
        'front'
      );
      const licenseBackURL = await uploadLicensePhoto(userData.licensePhotos.back, userId, 'back');

      // 3. Crear documento del usuario
      await setDoc(doc(db, 'users', userId), {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: `${userData.countryCode}${userData.telefono}`,
        fechaNacimiento: userData.fechaNacimiento,
        role: selectedRole,
        licenseData: userData.licenseData || {},
        licensePhotos: {
          front: licenseFrontURL,
          back: licenseBackURL,
        },
        profileComplete: true,
        vehicleProfileComplete: false,
        terminosAceptados: {
          aceptado: true,
          fecha: new Date().toISOString(),
          version: '1.0',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setLoading(false);
      // AuthContext will handle navigation
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#032B3C" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Elige tu Rol</Text>
            <Text style={styles.headerSubtitle}>Paso 3 de 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator currentStep={3} totalSteps={3} labels={['Datos', 'Licencia', 'Rol']} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Cómo quieres usar Rentik?</Text>
            <Text style={styles.subtitle}>
              Selecciona el rol principal para tu cuenta. Podrás cambiarlo después.
            </Text>
            <View style={styles.timeIndicator}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.timeText}>~2 minutos para completar tu perfil</Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Opción Viajero */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'arrendatario' && styles.roleCardSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRole('arrendatario');
              }}
              disabled={loading}
              activeOpacity={0.9}
            >
              {/* Badge "Más Popular" */}
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.badgeText}>Más Popular</Text>
              </View>
              
              {/* Radio Button en esquina superior derecha */}
              <View style={styles.radioContainerTop}>
                <View style={[styles.radioOuter, selectedRole === 'arrendatario' && styles.radioOuterSelected]}>
                    {selectedRole === 'arrendatario' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <ImageBackground
                source={require('../../../assets/images/viajeroP.png')}
                style={styles.roleImageBackground}
                imageStyle={{ borderRadius: 20 }}
              >
                {/* Overlay gradiente */}
                <View style={styles.imageGradientOverlay} />
                
                {/* Contenido en la parte inferior */}
                <View style={styles.roleContentOverlay}>
                  <Text style={styles.roleTitleOverlay}>Quiero Rentar</Text>
                  <Text style={styles.roleSubtitleOverlay}>
                      Encuentra el auto perfecto para tu viaje. Sin papeleos y seguro incluido.
                  </Text>
                  
                  <View style={styles.featureListOverlay}>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>Cobertura $50k</Text>
                    </View>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="flash-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>Instantáneo</Text>
                    </View>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="car-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>500+ autos</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Opción Host */}
            <TouchableOpacity
              style={[styles.roleCard, selectedRole === 'arrendador' && styles.roleCardSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRole('arrendador');
              }}
              disabled={loading}
              activeOpacity={0.9}
            >
              {/* Badge Verificación */}
              <View style={styles.verificationBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.badgeTextGreen}>Verificación Requerida</Text>
              </View>
              
              {/* Radio Button en esquina superior derecha */}
              <View style={styles.radioContainerTop}>
                <View style={[styles.radioOuter, selectedRole === 'arrendador' && styles.radioOuterSelected]}>
                    {selectedRole === 'arrendador' && <View style={styles.radioInner} />}
                </View>
              </View>
              
              <ImageBackground
                source={require('../../../assets/images/hostP.png')}
                style={styles.roleImageBackground}
                imageStyle={{ borderRadius: 20 }}
              >
                {/* Overlay gradiente */}
                <View style={styles.imageGradientOverlay} />
                
                {/* Contenido en la parte inferior */}
                <View style={styles.roleContentOverlay}>
                  <Text style={styles.roleTitleOverlay}>Quiero ser Host</Text>
                  <Text style={styles.roleSubtitleOverlay}>
                      Convierte tu auto en un activo. Gana dinero con conductores verificados.
                  </Text>
                  
                  <View style={styles.featureListOverlay}>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="cash-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>Pagos semanales</Text>
                    </View>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="people-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>15k+ hosts</Text>
                    </View>
                    <View style={styles.featureItemOverlay}>
                        <Ionicons name="trending-up-outline" size={14} color="#fff" />
                        <Text style={styles.featureTextOverlay}>$800/mes</Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            {/* Términos y Condiciones */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink}>Términos y Condiciones</Text> y la <Text style={styles.termsLink}>Política de Privacidad</Text> de Rentik.
              </Text>
            </TouchableOpacity>

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              style={[styles.button, (!selectedRole || !acceptedTerms) && styles.buttonDisabled]}
              onPress={handleCreateAccount}
              disabled={loading || !selectedRole || !acceptedTerms}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                    <Text style={styles.buttonText}>Crear Cuenta</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#032B3C' },
  headerSubtitle: { fontSize: 12, color: '#6B7280' },

  titleContainer: { padding: 24, paddingBottom: 0 },
  title: { fontSize: 28, fontWeight: '800', color: '#032B3C', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  formContainer: { padding: 24 },

  roleCard: {
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verificationBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  badgeTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  
  roleImageBackground: {
    width: '100%',
    height: 340,
    justifyContent: 'flex-end',
  },
  
  imageGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  
  roleContentOverlay: {
    padding: 24,
    paddingBottom: 28,
  },
  
  roleTitleOverlay: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  roleSubtitleOverlay: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  featureListOverlay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  featureItemOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  featureTextOverlay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  
  radioContainerTop: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 5,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: 'white',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
