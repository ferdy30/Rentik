import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VehicleCarouselProps {
  images: string[];
  onBackPress: () => void;
  onSharePress: () => void;
  onImagePress?: (index: number) => void;
}

export default function VehicleCarousel({ images, onBackPress, onSharePress, onImagePress }: VehicleCarouselProps) {
  const [imageIndex, setImageIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setImageIndex(roundIndex);
  };

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((img: string, index: number) => (
          <TouchableOpacity 
            key={index} 
            activeOpacity={0.9} 
            onPress={() => onImagePress && onImagePress(index)}
          >
            <Image 
              source={{ uri: img }} 
              style={styles.image}
              contentFit="cover"
              transition={500}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={onBackPress}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
        <Ionicons name="share-outline" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Dots Indicator with Counter */}
      <View style={styles.dotsContainer}>
        <Ionicons name="image-outline" size={14} color="#fff" />
        <Text style={styles.imageCounter}>{imageIndex + 1}/{images.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 380,
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    width: SCREEN_WIDTH,
    height: 380,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageCounter: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
});
