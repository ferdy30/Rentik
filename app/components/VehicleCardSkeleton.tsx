import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
}

const VehicleCardSkeleton: React.FC<Props> = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Image skeleton */}
      <View style={styles.imageSkeleton} />
      
      {/* Content skeleton */}
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.ratingSkeleton} />
        <View style={styles.yearSkeleton} />
        <View style={styles.footerSkeleton}>
          <View style={styles.priceSkeleton} />
          <View style={styles.locationSkeleton} />
        </View>
      </View>
    </View>
  );
};

export default VehicleCardSkeleton;

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  imageSkeleton: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 12,
  },
  titleSkeleton: {
    width: '80%',
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingSkeleton: {
    width: '40%',
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  yearSkeleton: {
    width: '30%',
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 12,
  },
  footerSkeleton: {
    gap: 6,
  },
  priceSkeleton: {
    width: '60%',
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  locationSkeleton: {
    width: '70%',
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
});

