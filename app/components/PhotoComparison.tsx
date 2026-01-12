import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PhotoComparisonProps {
  beforePhoto: { uri: string; label: string; timestamp?: Date };
  afterPhoto: { uri: string; label: string; timestamp?: Date };
  location: string;
  onViewBefore?: () => void;
  onViewAfter?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPARISON_WIDTH = SCREEN_WIDTH - 40;

export default function PhotoComparison({
  beforePhoto,
  afterPhoto,
  location,
  onViewBefore,
  onViewAfter,
}: PhotoComparisonProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.locationTitle}>{location}</Text>

      {/* Side-by-side comparison */}
      <View style={styles.comparisonContainer}>
        {/* Before Photo */}
        <TouchableOpacity
          style={styles.photoSection}
          onPress={onViewBefore}
          activeOpacity={0.8}
        >
          <Image source={{ uri: beforePhoto.uri }} style={styles.photo} />
          <View style={styles.photoLabel}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.labelText}>ANTES</Text>
          </View>
          {beforePhoto.timestamp && (
            <Text style={styles.timestamp}>{formatDate(beforePhoto.timestamp)}</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <Ionicons name="arrow-forward" size={20} color="#0B729D" />
        </View>

        {/* After Photo */}
        <TouchableOpacity
          style={styles.photoSection}
          onPress={onViewAfter}
          activeOpacity={0.8}
        >
          <Image source={{ uri: afterPhoto.uri }} style={styles.photo} />
          <View style={[styles.photoLabel, styles.photoLabelAfter]}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.labelText}>AHORA</Text>
          </View>
          {afterPhoto.timestamp && (
            <Text style={styles.timestamp}>{formatDate(afterPhoto.timestamp)}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Analysis */}
      <View style={styles.analysisContainer}>
        <Ionicons name="analytics" size={16} color="#0B729D" />
        <Text style={styles.analysisText}>
          Toca las fotos para verlas en detalle y compararlas
        </Text>
      </View>
    </View>
  );
}

export function PhotoSliderComparison({
  beforePhoto,
  afterPhoto,
  location,
}: PhotoComparisonProps) {
  const [sliderPosition] = useState(50);

  return (
    <View style={styles.container}>
      <Text style={styles.locationTitle}>{location}</Text>

      {/* Slider comparison */}
      <View style={[styles.sliderContainer, { width: COMPARISON_WIDTH }]}>
        {/* Before image (full width) */}
        <Image
          source={{ uri: beforePhoto.uri }}
          style={styles.sliderImage}
          resizeMode="cover"
        />

        {/* After image (clipped by slider) */}
        <View
          style={[
            styles.afterImageContainer,
            { width: `${sliderPosition}%` },
          ]}
        >
          <Image
            source={{ uri: afterPhoto.uri }}
            style={[styles.sliderImage, { width: COMPARISON_WIDTH }]}
            resizeMode="cover"
          />
        </View>

        {/* Slider handle */}
        <View
          style={[
            styles.sliderHandle,
            { left: `${sliderPosition}%` },
          ]}
        >
          <View style={styles.handleLine} />
          <View style={styles.handleCircle}>
            <Ionicons name="swap-horizontal" size={20} color="#fff" />
          </View>
          <View style={styles.handleLine} />
        </View>

        {/* Labels */}
        <View style={styles.sliderLabels}>
          <View style={[styles.sliderLabel, styles.sliderLabelBefore]}>
            <Text style={styles.sliderLabelText}>ANTES</Text>
          </View>
          <View style={[styles.sliderLabel, styles.sliderLabelAfter]}>
            <Text style={styles.sliderLabelText}>AHORA</Text>
          </View>
        </View>
      </View>

      <View style={styles.sliderInstructions}>
        <Ionicons name="hand-left-outline" size={16} color="#6B7280" />
        <Text style={styles.instructionsText}>
          Desliza para comparar fotos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoSection: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  photoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoLabelAfter: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    width: 32,
    alignItems: 'center',
  },
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  analysisText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  // Slider comparison styles
  sliderContainer: {
    height: 250,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sliderImage: {
    height: 250,
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  sliderHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0B729D',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },
  handleLine: {
    width: 4,
    flex: 1,
    backgroundColor: '#0B729D',
  },
  handleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B729D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  sliderLabels: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  sliderLabelBefore: {
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
  },
  sliderLabelAfter: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  sliderLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  sliderInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});
