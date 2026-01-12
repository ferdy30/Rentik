import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../FirebaseConfig';

interface PreviousDamage {
  id: string;
  location: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  photo?: string;
  notes: string;
  reportedAt: Date;
  checkInId: string;
}

interface PreviousDamagesDisplayProps {
  vehicleId: string;
  currentCheckInId?: string; // Para excluir el check-in actual
  onViewPhoto?: (photo: string) => void;
}

export default function PreviousDamagesDisplay({
  vehicleId,
  currentCheckInId,
  onViewPhoto,
}: PreviousDamagesDisplayProps) {
  const [damages, setDamages] = useState<PreviousDamage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPreviousDamages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const loadPreviousDamages = async () => {
    try {
      setLoading(true);
      
      // Buscar todos los check-ins completados de este vehículo
      const checkInsQuery = query(
        collection(db, 'checkIns'),
        where('vehicleId', '==', vehicleId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );

      const checkInsSnapshot = await getDocs(checkInsQuery);
      const allDamages: PreviousDamage[] = [];

      checkInsSnapshot.forEach((doc) => {
        const checkInData = doc.data();
        
        // Excluir el check-in actual
        if (currentCheckInId && doc.id === currentCheckInId) {
          return;
        }

        // Agregar los daños de este check-in
        if (checkInData.damages && Array.isArray(checkInData.damages)) {
          checkInData.damages.forEach((damage: any) => {
            allDamages.push({
              ...damage,
              reportedAt: checkInData.completedAt?.toDate() || new Date(),
              checkInId: doc.id,
            });
          });
        }
      });

      // Ordenar por fecha más reciente primero
      allDamages.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());

      setDamages(allDamages);
    } catch (error) {
      console.error('[PreviousDamagesDisplay] Error loading damages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#F59E0B';
      case 'moderate':
        return '#EF4444';
      case 'severe':
        return '#991B1B';
      default:
        return '#6B7280';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'Leve';
      case 'moderate':
        return 'Moderado';
      case 'severe':
        return 'Severo';
      default:
        return severity;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      scratch: 'Rayón',
      dent: 'Abolladura',
      stain: 'Mancha',
      crack: 'Grieta',
      other: 'Otro',
    };
    return types[type] || type;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0B729D" />
        <Text style={styles.loadingText}>Cargando daños previos...</Text>
      </View>
    );
  }

  if (damages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        <Text style={styles.emptyTitle}>Sin daños previos</Text>
        <Text style={styles.emptySubtitle}>
          Este vehículo no tiene daños reportados en check-ins anteriores
        </Text>
      </View>
    );
  }

  const displayedDamages = expanded ? damages : damages.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.headerTitle}>Daños Previos ({damages.length})</Text>
        </View>
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.damagesList} nestedScrollEnabled>
        {displayedDamages.map((damage, index) => (
          <View key={`${damage.checkInId}-${index}`} style={styles.damageCard}>
            <View style={styles.damageHeader}>
              <View style={styles.damageInfo}>
                <Text style={styles.damageLocation}>{damage.location}</Text>
                <View style={styles.damageTags}>
                  <View style={[styles.tag, { backgroundColor: getSeverityColor(damage.severity) }]}>
                    <Text style={styles.tagText}>{getSeverityLabel(damage.severity)}</Text>
                  </View>
                  <View style={styles.tagOutline}>
                    <Text style={styles.tagOutlineText}>{getTypeLabel(damage.type)}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.damageDate}>{formatDate(damage.reportedAt)}</Text>
            </View>

            {damage.notes && (
              <Text style={styles.damageNotes} numberOfLines={2}>
                {damage.notes}
              </Text>
            )}

            {damage.photo && (
              <TouchableOpacity
                onPress={() => onViewPhoto && onViewPhoto(damage.photo!)}
                style={styles.photoContainer}
              >
                <Image source={{ uri: damage.photo }} style={styles.photo} />
                <View style={styles.photoOverlay}>
                  <Ionicons name="eye" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {!expanded && damages.length > 3 && (
        <TouchableOpacity onPress={() => setExpanded(true)} style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>
            Ver todos los daños ({damages.length})
          </Text>
          <Ionicons name="chevron-down" size={16} color="#0B729D" />
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color="#0B729D" />
        <Text style={styles.infoText}>
          Verifica estos daños antes de reportar nuevos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  damagesList: {
    maxHeight: 400,
  },
  damageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  damageInfo: {
    flex: 1,
  },
  damageLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  damageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  tagOutline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tagOutlineText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  damageDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  damageNotes: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
    marginTop: 8,
  },
  photo: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B729D',
    marginRight: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
});
