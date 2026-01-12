import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Vehicle } from '../../types/vehicle';

interface EditPhotosTabProps {
  vehicle: Vehicle;
  onSave: (photos: string[], deletedPhotos: string[]) => Promise<void>;
}

const MAX_PHOTOS = 15;
const REQUIRED_PHOTOS = 5;

export default function EditPhotosTab({ vehicle, onSave }: EditPhotosTabProps) {
  const [photos, setPhotos] = useState<string[]>(vehicle.imagenes || [vehicle.imagen] || []);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  const pickImage = async (fromCamera: boolean = false) => {
    try {
      if (photos.length >= MAX_PHOTOS) {
        Alert.alert('Límite Alcanzado', `Puedes subir máximo ${MAX_PHOTOS} fotos`);
        return;
      }

      let result;
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso Requerido', 'Necesitamos acceso a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso Requerido', 'Necesitamos acceso a tu galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
        });
      }

      if (!result.canceled) {
        const newPhotos = await Promise.all(
          result.assets.map(asset => compressImage(asset.uri))
        );
        setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const photoToDelete = photos[index];
            // Si la foto ya existe en Firebase (empieza con https://), la marcamos para eliminar
            if (photoToDelete.startsWith('https://')) {
              setDeletedPhotos(prev => [...prev, photoToDelete]);
            }
            setPhotos(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...photos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;
    
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (photos.length < REQUIRED_PHOTOS) {
      Alert.alert(
        'Fotos Insuficientes',
        `Necesitas al menos ${REQUIRED_PHOTOS} fotos para el vehículo.`
      );
      return;
    }

    setSaving(true);
    try {
      await onSave(photos, deletedPhotos);
      setDeletedPhotos([]); // Limpiar después de guardar exitosamente
      Alert.alert('Éxito', 'Fotos actualizadas correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron actualizar las fotos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#0B729D" />
          <Text style={styles.infoText}>
            Mínimo {REQUIRED_PHOTOS} fotos, máximo {MAX_PHOTOS}. La primera foto será la portada.
          </Text>
        </View>

        {/* Photo Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {photos.length} / {MAX_PHOTOS} fotos
          </Text>
          {photos.length >= REQUIRED_PHOTOS && (
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.validText}>Válido</Text>
            </View>
          )}
        </View>

        {/* Add Photo Buttons */}
        <View style={styles.addButtonsRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => pickImage(false)}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Ionicons name="images-outline" size={24} color="#0B729D" />
            <Text style={styles.addButtonText}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => pickImage(true)}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Ionicons name="camera-outline" size={24} color="#0B729D" />
            <Text style={styles.addButtonText}>Cámara</Text>
          </TouchableOpacity>
        </View>

        {/* Photos Grid */}
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoCard}>
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.coverBadgeText}>Portada</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
              </TouchableOpacity>

              <View style={styles.photoActions}>
                {index > 0 && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => movePhoto(index, 'up')}
                  >
                    <Ionicons name="arrow-up" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
                
                {index < photos.length - 1 && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => movePhoto(index, 'down')}
                  >
                    <Ionicons name="arrow-down" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={styles.addMoreCard}
            onPress={() => pickImage(false)}
          >
            <Ionicons name="add-circle-outline" size={48} color="#9CA3AF" />
            <Text style={styles.addMoreText}>Agregar más fotos</Text>
            <Text style={styles.addMoreSubtext}>
              {MAX_PHOTOS - photos.length} disponibles
            </Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || photos.length < REQUIRED_PHOTOS) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || photos.length < REQUIRED_PHOTOS}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Fotos</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full Screen Photo Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedPhoto && (
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.modalImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  validText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B729D',
  },
  photosGrid: {
    gap: 16,
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  coverBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  addMoreCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  addMoreSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0B729D',
    marginTop: 16,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
