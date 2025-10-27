import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/Auth';
import { db, storage } from '../../FirebaseConfig';

import type { User as FirebaseUser } from 'firebase/auth';

export default function LicenseUpload({ navigation }: any) {
  const { user } = useAuth();
  const currentUser = user as FirebaseUser | null;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para seleccionar una imagen de la galería
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para continuar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.9,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Función para tomar una foto con la cámara
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos acceso a la cámara para continuar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.9,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Función para subir la foto a Firebase Storage y guardar la URL en Firestore
  const upload = async () => {
    // Validaciones antes de subir
    if (!currentUser?.uid) {
      Alert.alert('Sesión requerida', 'Vuelve a iniciar sesión para continuar.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Falta la foto', 'Selecciona una foto de tu licencia antes de continuar.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📤 Iniciando subida para usuario:', currentUser.uid);
      
      // Convertir la imagen a blob para subirla
      const resp = await fetch(photoUri);
      const blob = await resp.blob();
      console.log('✅ Blob creado, tamaño:', blob.size, 'bytes');
      
      // Subir a Storage en licenses/{uid}
      const storageRef = ref(storage, `licenses/${currentUser.uid}`);
      console.log('📁 Ruta de Storage:', storageRef.fullPath);
      
      await uploadBytes(storageRef, blob);
      console.log('✅ Archivo subido exitosamente a Storage');
      
      // Obtener la URL pública
      const url = await getDownloadURL(storageRef);
      console.log('✅ URL obtenida:', url);

      // Guardar la URL en Firestore para el usuario
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { licensePhotoURL: url, licenseVerified: false, updatedAt: serverTimestamp() },
        { merge: true }
      );
      console.log('✅ Documento actualizado en Firestore');

      Alert.alert('Listo', 'Tu licencia fue subida correctamente.');
      navigation.navigate('PerfilVehiculo');
    } catch (e: any) {
      console.error('❌ Error completo:', e);
      console.error('❌ Código:', e.code);
      console.error('❌ Mensaje:', e.message);
      Alert.alert('Error', `No se pudo completar: ${e.message || 'Intenta de nuevo'}`);
    } finally {
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
        {/* ScrollView porque hay bastante contenido */}
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado con título */}
          <View style={styles.header}>
            <Ionicons name="card-outline" size={48} color="#0B729D" />
            <Text style={styles.title}>Verifica tu licencia</Text>
            <Text style={styles.subtitle}>Necesitamos verificar tu licencia de conducir</Text>
          </View>

          {/* Instrucciones de cómo tomar la foto */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Cómo debe ser la foto</Text>
            <Text style={styles.description}>
              Sigue estos pasos para que tu foto sea aprobada a la primera:
            </Text>
            <View style={styles.steps}>
              <View style={styles.stepRow}>
                <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                <Text style={styles.step}>Coloca tu licencia sobre una superficie plana y bien iluminada</Text>
              </View>
              <View style={styles.stepRow}>
                <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                <Text style={styles.step}>Evita reflejos y sombras; debe verse completa y sin recortes</Text>
              </View>
              <View style={styles.stepRow}>
                <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                <Text style={styles.step}>Asegúrate que nombre, número y fecha sean legibles</Text>
              </View>
              <View style={styles.stepRow}>
                <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                <Text style={styles.step}>Revisa la vista previa; si está borrosa, vuelve a tomarla</Text>
              </View>
            </View>
          </View>

          {/* Botones para tomar o seleccionar foto */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.pickButton, styles.cameraButton]} 
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={[styles.pickButtonText, { color: '#fff' }]}>
                {photoUri ? 'Volver a tomar' : 'Tomar foto con cámara'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.pickButton, styles.galleryButton]} 
              onPress={pickImage}
            >
              <Ionicons name="images" size={24} color="#6B7280" />
              <Text style={[styles.pickButtonText, { color: '#6B7280' }]}>
                {photoUri ? 'Elegir otra desde galería' : 'Seleccionar desde galería'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vista previa de la foto seleccionada */}
          {photoUri ? (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Vista previa:</Text>
              <Image source={{ uri: photoUri }} style={styles.preview} />
            </View>
          ) : null}

          {/* Botón de subir o loading */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#0B729D" />
              <Text style={styles.loadingText}>Subiendo tu licencia...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.uploadButton, !photoUri && styles.uploadButtonDisabled]} 
              onPress={upload}
              disabled={!photoUri}
            >
              <Text style={styles.uploadButtonText}>Subir licencia y continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0B729D',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0B729D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  steps: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  step: {
    flex: 1,
    fontSize: 14,
    color: '#032B3C',
    lineHeight: 20,
  },
  buttonsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#0B729D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: '#0B729D',
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  pickButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0B729D',
    gap: 10,
    shadowColor: '#0B729D',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
