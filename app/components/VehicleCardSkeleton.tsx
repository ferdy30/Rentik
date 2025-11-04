import React from 'react';
import { StyleSheet, View } from 'react-native';

const VehicleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Image skeleton */}
      <View style={styles.imageSkeleton} />
      
      {/* Content skeleton */}
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.yearSkeleton} />
        <View style={styles.featuresRow}>
          <View style={styles.featureSkeleton} />
          <View style={styles.featureSkeleton} />
          <View style={styles.featureSkeleton} />
        </View>
        <View style={styles.locationSkeleton} />
        <View style={styles.priceRow}>
          <View style={styles.priceSkeleton} />
          <View style={styles.buttonSkeleton} />
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
    borderRadius: 16,
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
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  yearSkeleton: {
    width: '40%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 10,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  featureSkeleton: {
    width: 40,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  locationSkeleton: {
    width: '60%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSkeleton: {
    width: 60,
    height: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  buttonSkeleton: {
    width: 50,
    height: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
});
