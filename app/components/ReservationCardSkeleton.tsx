import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function ReservationCardSkeleton() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[styles.thumb, { opacity: fadeAnim }]} />
        <View style={styles.headerInfo}>
          <Animated.View style={[styles.titleBar, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dateBar, { opacity: fadeAnim }]} />
        </View>
        <Animated.View style={[styles.statusCircle, { opacity: fadeAnim }]} />
      </View>

      {/* Quick Info Bar */}
      <Animated.View style={[styles.quickInfoBar, { opacity: fadeAnim }]} />

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Animated.View style={[styles.actionBtn, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.actionBtn, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.actionBtn, { opacity: fadeAnim }]} />
      </View>

      {/* Primary Action */}
      <Animated.View style={[styles.primaryAction, { opacity: fadeAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 8,
  },
  titleBar: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '70%',
  },
  dateBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '50%',
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  quickInfoBar: {
    height: 44,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
  },
  primaryAction: {
    height: 44,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
  },
});
