import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VehicleDescriptionProps {
  description: string;
}

export default function VehicleDescription({ description }: VehicleDescriptionProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const displayText = description && description.trim().length > 0 ? description : 'Sin descripción proporcionada';

  return (
      <View>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text 
          style={styles.description}
          numberOfLines={showFullDescription ? undefined : 4}
        >
          {displayText}
        </Text>
        {displayText.length > 150 && displayText !== 'Sin descripción proporcionada' && (
          <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
            <Text style={styles.readMoreText}>
              {showFullDescription ? "Leer menos" : "Leer más"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  readMoreText: {
    color: '#0B729D',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 14,
  },
});
