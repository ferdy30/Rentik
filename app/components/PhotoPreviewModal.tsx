import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PhotoPreviewModalProps {
  visible: boolean;
  photos: { uri: string; label: string }[];
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (index: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoPreviewModal({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  onDelete,
}: PhotoPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageScale, setImageScale] = useState(1);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setImageScale(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setImageScale(1);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(currentIndex);
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (photos.length <= 1) {
        onClose();
      }
    }
  };

  if (!visible || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentPhoto.label} ({currentIndex + 1}/{photos.length})
          </Text>
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Image Container */}
        <ScrollView
          contentContainerStyle={styles.imageContainer}
          minimumZoomScale={1}
          maximumZoomScale={3}
          onMomentumScrollEnd={(e) => {
            setImageScale(e.nativeEvent.zoomScale);
          }}
        >
          <Image
            source={{ uri: currentPhoto.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </ScrollView>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={32}
                color={currentIndex === 0 ? '#6B7280' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              disabled={currentIndex === photos.length - 1}
              style={[
                styles.navButton,
                currentIndex === photos.length - 1 && styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={32}
                color={currentIndex === photos.length - 1 ? '#6B7280' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <View style={styles.thumbnailsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCurrentIndex(index);
                    setImageScale(1);
                  }}
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.thumbnailActive,
                  ]}
                >
                  <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} />
                  {index === currentIndex && <View style={styles.thumbnailOverlay} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Zoom Indicator */}
        {imageScale > 1 && (
          <View style={styles.zoomIndicator}>
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={styles.zoomText}>{Math.round(imageScale * 100)}%</Text>
          </View>
        )}

        {/* Helper Text */}
        <View style={styles.helperContainer}>
          <Text style={styles.helperText}>
            Pellizca para hacer zoom • Desliza para navegar
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  deleteButton: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  navigationContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  thumbnailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#0B729D',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 114, 157, 0.3)',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  helperContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});
