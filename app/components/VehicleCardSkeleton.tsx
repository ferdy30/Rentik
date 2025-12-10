import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
}

const VehicleCardSkeleton: React.FC<Props> = ({ style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.card, style]}>
      {/* Image skeleton */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      
      {/* Content skeleton */}
      <View style={styles.content}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.ratingSkeleton, { opacity }]} />
        <Animated.View style={[styles.yearSkeleton, { opacity }]} />
        <View style={styles.footerSkeleton}>
          <Animated.View style={[styles.priceSkeleton, { opacity }]} />
          <Animated.View style={[styles.locationSkeleton, { opacity }]} />
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

