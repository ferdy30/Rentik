import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function TripCardSkeleton() {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Animated.View style={[styles.imageSkeleton, { opacity }]} />
        <View style={styles.cardInfo}>
          <Animated.View style={[styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.textSkeleton, { opacity, width: '60%' }]} />
          <Animated.View style={[styles.textSkeleton, { opacity, width: '80%' }]} />
          <Animated.View style={[styles.textSkeleton, { opacity, width: '40%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  titleSkeleton: {
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  textSkeleton: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
});
