import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottomActionBarProps {
  price: number;
  onBookPress: () => void;
}

export default function BottomActionBar({ price, onBookPress }: BottomActionBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.bottomBar}>
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.pricePerDay}>${price}</Text>
          <Text style={styles.currency}>/día</Text>
        </View>
        <Pressable 
          style={styles.tooltipTrigger}
          onPress={() => setShowTooltip(!showTooltip)}
        >
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.priceInfo}>Ver desglose de precio</Text>
        </Pressable>
        
        {showTooltip && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.tooltipText}>Seguro básico incluido</Text>
            </View>
            <View style={styles.tooltipRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.tooltipText}>Kilometraje ilimitado</Text>
            </View>
            <View style={styles.tooltipRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.tooltipText}>Asistencia 24/7</Text>
            </View>
          </View>
        )}
      </View>
      
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity 
          style={styles.bookButton} 
          onPress={onBookPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Text style={styles.bookButtonText}>Reservar ahora</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  priceContainer: {
    flex: 1,
    marginRight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  pricePerDay: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0B729D',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 2,
  },
  tooltipTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 240,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#0B729D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
