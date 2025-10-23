import * as ImagePicker from 'expo-image-picker';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/Auth';
import { db, storage } from '../../FirebaseConfig';

import type { User as FirebaseUser } from 'firebase/auth';

export default function LicenseUpload({ navigation }: any) {
  const { user } = useAuth();
  const currentUser = user as FirebaseUser | null;
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const upload = async () => {
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
      
      const resp = await fetch(photoUri);
      const blob = await resp.blob();
      console.log('✅ Blob creado, tamaño:', blob.size, 'bytes');
      
      const storageRef = ref(storage, `licenses/${currentUser.uid}`);
      console.log('📁 Ruta de Storage:', storageRef.fullPath);
      
      await uploadBytes(storageRef, blob);
      console.log('✅ Archivo subido exitosamente a Storage');
      
      const url = await getDownloadURL(storageRef);
      console.log('✅ URL obtenida:', url);

      await setDoc(
        doc(db, 'users', currentUser.uid),
        { licensePhotoURL: url, licenseVerified: false, updatedAt: serverTimestamp() },
        { merge: true }
      );
      console.log('✅ Documento actualizado en Firestore');

      Alert.alert('Listo', 'Tu licencia fue subida correctamente.');
      navigation.replace('PerfilVehiculo');
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Verifica tu licencia</Text>
        <Text style={styles.subtitle}>Cómo debe ser la foto</Text>
        <Text style={styles.description}>
          Sigue estos pasos para que tu foto sea aprobada a la primera:
        </Text>
        <View style={styles.steps}>
          <Text style={styles.step}>1. Coloca tu licencia sobre una superficie plana y bien iluminada.</Text>
          <Text style={styles.step}>2. Evita reflejos y sombras; alinea para que se vea completa y sin recortes.</Text>
          <Text style={styles.step}>3. Asegúrate que nombre, número y fecha de expiración sean legibles.</Text>
          <Text style={styles.step}>4. Revisa la vista previa; si está borrosa o torcida, vuelve a tomarla.</Text>
        </View>

        <TouchableOpacity style={styles.pickButton} onPress={takePhoto}>
          <Text style={styles.pickButtonText}>{photoUri ? 'Volver a tomar' : 'Tomar foto con cámara'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pickButton, { backgroundColor: '#F3F4F6' }]} onPress={pickImage}>
          <Text style={[styles.pickButtonText, { color: '#333' }]}>
            {photoUri ? 'Elegir otra desde galería' : 'Seleccionar desde galería'}
          </Text>
        </TouchableOpacity>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}

        {loading ? (
          <ActivityIndicator color="#FF5A5F" />
        ) : (
          <TouchableOpacity style={styles.uploadButton} onPress={upload}>
            <Text style={styles.uploadButtonText}>Subir licencia y continuar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    lineHeight: 20,
  },
  steps: {
    width: '100%',
    marginBottom: 16,
    gap: 6,
  },
  step: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  pickButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  preview: {
    width: 200,
    height: 130,
    borderRadius: 10,
    marginBottom: 16,
  },
  uploadButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FF5A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
