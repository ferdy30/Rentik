import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constants/colors';

// Paso 2: Licencia de Conducir (FRENTE Y REVERSO)
export default function RegistroStep2({ route, navigation }: any) {
  const userData = route.params; // Datos del paso 1
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoBack, setPhotoBack] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const requestPermissions = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a la cámara para continuar.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para continuar.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async (source: 'camera' | 'library', side: 'front' | 'back') => {
    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return;

    setIsCapturing(true);
    const options = {
      allowsEditing: true,
      aspect: [3, 2] as [number, number],
      quality: 0.9,
    };

    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync({
              ...options,
              mediaTypes: ['images'],
            });

      if (!result.canceled) {
        const originalUri = result.assets[0].uri;
        try {
          const compressed = await manipulateAsync(
            originalUri,
            [{ resize: { width: 1280 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
          );
          if (side === 'front') {
            setPhotoFront(compressed.uri);
          } else {
            setPhotoBack(compressed.uri);
          }
        } catch {
          // Si falla la compresión, usa la imagen original
          if (side === 'front') {
            setPhotoFront(originalUri);
          } else {
            setPhotoBack(originalUri);
          }
        }
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleContinue = () => {
    if (!photoFront) {
      Alert.alert('Falta la foto', 'Por favor toma una foto del frente de tu licencia.');
      return;
    }
    if (!photoBack) {
      Alert.alert('Falta la foto', 'Por favor toma una foto del reverso de tu licencia.');
      return;
    }

    // Pasar a dirección (nuevo paso) con ambas fotos
    navigation.navigate('RegistroAddress', {
      ...userData,
      licensePhotos: {
        front: photoFront,
        back: photoBack,
      },
    });
  };

  const showImageOptions = (side: 'front' | 'back') => {
    const sideText = side === 'front' ? 'frente' : 'reverso';
    Alert.alert(`Licencia - ${sideText}`, '¿Cómo deseas agregar la foto?', [
      { text: 'Cámara', onPress: () => pickImage('camera', side) },
      { text: 'Galería', onPress: () => pickImage('library', side) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
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
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Paso 2 de 3</Text>
            <Ionicons name="card-outline" size={48} color={colors.primary} style={{ marginVertical: 8 }} />
            <Text style={styles.title}>Verifica tu Licencia</Text>
            <Text style={styles.subtitle}>Necesitamos ambos lados de tu licencia</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Instrucciones */}
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <Text style={styles.instructionsTitle}>📋 Instrucciones para la foto</Text>
              </View>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <Ionicons name="sunny-outline" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Buena iluminación, sin flash</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="scan-outline" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Enfoca bien el texto</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="crop-outline" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Que se vea toda la tarjeta</Text>
                </View>
              </View>
            </View>

            {/* Frente de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Frente de la Licencia</Text>
              {photoFront ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoFront }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.successText}>Listo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions('front')}
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => showImageOptions('front')}
                  disabled={isCapturing}
                >
                  <View style={styles.addPhotoIconContainer}>
                    <Ionicons name="camera" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.addPhotoText}>Tomar foto del frente</Text>
                  <Text style={styles.addPhotoSubtext}>Toca para capturar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reverso de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Reverso de la Licencia</Text>
              {photoBack ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoBack }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.successText}>Listo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions('back')}
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, !photoFront && styles.addPhotoButtonDisabled]}
                  onPress={() => showImageOptions('back')}
                  disabled={isCapturing || !photoFront}
                >
                  <View style={[styles.addPhotoIconContainer, !photoFront && styles.iconDisabled]}>
                    <Ionicons 
                      name="camera" 
                      size={32} 
                      color={!photoFront ? '#9CA3AF' : colors.primary} 
                    />
                  </View>
                  <Text
                    style={[styles.addPhotoText, !photoFront && styles.addPhotoTextDisabled]}
                  >
                    Tomar foto del reverso
                  </Text>
                  <Text
                    style={[styles.addPhotoSubtext, !photoFront && styles.addPhotoTextDisabled]}
                  >
                    {!photoFront ? 'Primero captura el frente' : 'Toca para capturar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mensaje informativo */}
            {photoFront && photoBack && (
              <View style={styles.nextStepInfo}>
                <Ionicons name="shield-checkmark" size={24} color={colors.status.success} />
                <View style={{flex: 1}}>
                  <Text style={[styles.nextStepText, { color: '#065F46', fontWeight: '600' }]}>
                    ¡Documentos listos!
                  </Text>
                  <Text style={[styles.nextStepText, { color: '#065F46', fontSize: 13 }]}>
                    Podemos proceder a verificar tu identidad.
                  </Text>
                </View>
              </View>
            )}

            {/* Botón continuar */}
            <TouchableOpacity
              style={[styles.button, (!photoFront || !photoBack) && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!photoFront || !photoBack}
            >
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
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

  formContainer: {
    width: '100%',
  },
  instructionsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
  },
  instructionsHeader: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsList: {
    padding: 16,
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  addPhotoButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconDisabled: {
    backgroundColor: '#F3F4F6',
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  addPhotoSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  addPhotoButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  addPhotoTextDisabled: {
    color: '#9CA3AF',
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoPreview: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  retakeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nextStepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nextStepText: {
    color: '#065F46',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
