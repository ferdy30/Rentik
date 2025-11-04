import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Paso 2 de 3</Text>
            <Ionicons name="card-outline" size={48} color="#fff" style={{ marginVertical: 8 }} />
            <Text style={styles.title}>Verifica tu Licencia</Text>
            <Text style={styles.subtitle}>Necesitamos ambos lados de tu licencia</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Instrucciones */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>📋 Instrucciones</Text>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Coloca tu licencia sobre una superficie plana</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Asegúrate de que haya buena iluminación</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Evita reflejos y que se vea completa</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.instructionText}>Verifica que el texto sea legible</Text>
                </View>
              </View>
            </View>

            {/* Frente de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>📸 Frente de la Licencia</Text>
              {photoFront ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoFront }} style={styles.photoPreview} />
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                    <Text style={styles.successText}>Foto capturada</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => showImageOptions('front')}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.changePhotoText}>Cambiar foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => showImageOptions('front')}
                  disabled={isCapturing}
                >
                  <Ionicons name="camera-outline" size={48} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Tomar foto del frente</Text>
                  <Text style={styles.addPhotoSubtext}>o seleccionar de galería</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reverso de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>📸 Reverso de la Licencia</Text>
              {photoBack ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoBack }} style={styles.photoPreview} />
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
                    <Text style={styles.successText}>Foto capturada</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => showImageOptions('back')}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.changePhotoText}>Cambiar foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, !photoFront && styles.addPhotoButtonDisabled]}
                  onPress={() => showImageOptions('back')}
                  disabled={isCapturing || !photoFront}
                >
                  <Ionicons
                    name="camera-outline"
                    size={48}
                    color={!photoFront ? '#D1D5DB' : colors.primary}
                  />
                  <Text
                    style={[styles.addPhotoText, !photoFront && styles.addPhotoTextDisabled]}
                  >
                    Tomar foto del reverso
                  </Text>
                  <Text
                    style={[styles.addPhotoSubtext, !photoFront && styles.addPhotoTextDisabled]}
                  >
                    {!photoFront ? 'Primero captura el frente' : 'o seleccionar de galería'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mensaje informativo */}
            {photoFront && photoBack && (
              <View style={styles.nextStepInfo}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.status.success} />
                <Text style={[styles.nextStepText, { color: colors.status.success }]}>
                  ¡Perfecto! Ambas fotos capturadas correctamente
                </Text>
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  instructionsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#032B3C',
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 12,
  },
  addPhotoButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 12,
  },
  addPhotoSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addPhotoButtonDisabled: {
    opacity: 0.5,
    borderColor: '#D1D5DB',
  },
  addPhotoTextDisabled: {
    color: '#D1D5DB',
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 20,
    marginTop: 12,
  },
  successText: {
    color: colors.status.success,
    fontSize: 14,
    fontWeight: '600',
  },
  nextStepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(11, 114, 157, 0.1)',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  nextStepText: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
});
