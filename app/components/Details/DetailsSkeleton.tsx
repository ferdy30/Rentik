import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetailsSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
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
    <View style={styles.container}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />

      <View style={styles.content}>
        {/* Header Skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />
        </View>

        {/* Availability Card Skeleton */}
        <Animated.View style={[styles.cardSkeleton, { opacity }]} />

        {/* Specs Skeleton */}
        <View style={[styles.section, styles.specsRow]}>
          <Animated.View style={[styles.specSkeleton, { opacity }]} />
          <Animated.View style={[styles.specSkeleton, { opacity }]} />
          <Animated.View style={[styles.specSkeleton, { opacity }]} />
          <Animated.View style={[styles.specSkeleton, { opacity }]} />
        </View>

        {/* Description Skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitleSkeleton, { opacity }]} />
          <Animated.View style={[styles.lineSkeleton, { opacity, width: '100%' }]} />
          <Animated.View style={[styles.lineSkeleton, { opacity, width: '95%' }]} />
          <Animated.View style={[styles.lineSkeleton, { opacity, width: '80%' }]} />
        </View>

        {/* Features Skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitleSkeleton, { opacity }]} />
          <View style={styles.featuresGrid}>
            <Animated.View style={[styles.featureSkeleton, { opacity }]} />
            <Animated.View style={[styles.featureSkeleton, { opacity }]} />
            <Animated.View style={[styles.featureSkeleton, { opacity }]} />
            <Animated.View style={[styles.featureSkeleton, { opacity }]} />
          </View>
        </View>

        {/* Host Skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitleSkeleton, { opacity }]} />
          <View style={styles.hostRow}>
            <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
            <View style={{ flex: 1 }}>
              <Animated.View style={[styles.hostNameSkeleton, { opacity }]} />
              <Animated.View style={[styles.hostInfoSkeleton, { opacity }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageSkeleton: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 24,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  section: {
    marginBottom: 24,
  },
  titleSkeleton: {
    height: 28,
    width: '70%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  subtitleSkeleton: {
    height: 18,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  cardSkeleton: {
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 24,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  specSkeleton: {
    flex: 1,
    height: 70,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  sectionTitleSkeleton: {
    height: 24,
    width: '50%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
  },
  lineSkeleton: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureSkeleton: {
    width: '47%',
    height: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
  },
  hostNameSkeleton: {
    height: 18,
    width: '60%',
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  hostInfoSkeleton: {
    height: 14,
    width: '40%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});
