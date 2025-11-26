import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottomActionBarProps {
  price: number;
  onBookPress: () => void;
}

export default function BottomActionBar({ price, onBookPress }: BottomActionBarProps) {
  return (
    <View style={styles.bottomBar}>
      <View>
        <Text style={styles.pricePerDay}>${price}<Text style={styles.currency}>/día</Text></Text>
        <Text style={styles.totalPrice}>$ {price * 3} est. total (3 días)</Text>
      </View>
      <TouchableOpacity style={styles.bookButton} onPress={onBookPress}>
        <Text style={styles.bookButtonText}>Continuar</Text>
      </TouchableOpacity>
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
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  pricePerDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  currency: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  bookButton: {
    backgroundColor: '#0B729D',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
