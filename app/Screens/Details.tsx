import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import type { RootStackParamList } from '../navigation';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Details() {
  const navigation = useNavigation();
  const route = useRoute<DetailsRouteProp>();
  const { vehicle } = route.params;
  const [imageIndex, setImageIndex] = useState(0);
  const [hostName, setHostName] = useState('Arrendador Verificado');
  const [hostJoined, setHostJoined] = useState('Se unió en 2023');

  useEffect(() => {
    const fetchHost = async () => {
      if (vehicle.propietarioId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', vehicle.propietarioId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.nombre) {
              setHostName(`${data.nombre} ${data.apellido || ''}`.trim());
            }
            // Optional: set joined date if available
          }
        } catch (e) {
          console.error('Error fetching host:', e);
        }
      }
    };
    fetchHost();
  }, [vehicle.propietarioId]);

  const images = vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes : [vehicle.imagen];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setImageIndex(roundIndex);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este ${vehicle.marca} ${vehicle.modelo} en Rentik! $${vehicle.precio}/día`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((img: string, index: number) => (
              <Image 
                key={index}
                source={{ uri: img }} 
                style={styles.image}
              />
            ))}
          </ScrollView>
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {images.map((_: any, idx: number) => (
              <View
                key={idx}
                style={[styles.dot, idx === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>{vehicle.marca}</Text>
              <Text style={styles.model}>{vehicle.modelo} {vehicle.anio}</Text>
            </View>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingScore}>{vehicle.rating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= Math.round(vehicle.rating) ? "star" : "star-outline"} 
                    size={10} 
                    color="#FBBF24" 
                  />
                ))}
              </View>
              <Text style={styles.tripsCount}>({vehicle.reviewCount} viajes)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Specs Grid */}
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Ionicons name="speedometer-outline" size={24} color="#4B5563" />
              <Text style={styles.specLabel}>Transmisión</Text>
              <Text style={styles.specValue}>{vehicle.transmision}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="water-outline" size={24} color="#4B5563" />
              <Text style={styles.specLabel}>Combustible</Text>
              <Text style={styles.specValue}>{vehicle.combustible}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="people-outline" size={24} color="#4B5563" />
              <Text style={styles.specLabel}>Pasajeros</Text>
              <Text style={styles.specValue}>{vehicle.pasajeros}</Text>
            </View>
            <View style={styles.specItem}>
              <Ionicons name="car-sport-outline" size={24} color="#4B5563" />
              <Text style={styles.specLabel}>Puertas</Text>
              <Text style={styles.specValue}>{vehicle.puertas}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Trip Dates & Location (Turo Style) */}
          <View style={styles.tripSection}>
            <Text style={styles.sectionTitle}>Tu viaje</Text>
            
            <View style={styles.tripRow}>
              <View style={styles.tripInfoBlock}>
                <Text style={styles.tripLabel}>Fechas</Text>
                <Text style={styles.tripValue}>Nov 20 - Nov 23</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tripRow}>
              <View style={styles.tripInfoBlock}>
                <Text style={styles.tripLabel}>Ubicación</Text>
                <Text style={styles.tripValue}>{vehicle.ubicacion}</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {vehicle.descripcion || "Este vehículo no tiene descripción detallada, pero está listo para tu próxima aventura. ¡Resérvalo hoy mismo!"}
          </Text>

          <View style={styles.divider} />

          {/* Features */}
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.featuresList}>
            {(vehicle.caracteristicas && vehicle.caracteristicas.length > 0 ? vehicle.caracteristicas : ['Bluetooth', 'A/C', 'USB', 'Cámara reversa']).map((feat: string, index: number) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0B729D" />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Host Info */}
          <Text style={styles.sectionTitle}>Anfitrión</Text>
          <View style={styles.hostCard}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostInitials}>{hostName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.hostName}>{hostName}</Text>
              <Text style={styles.hostJoined}>{hostJoined}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.pricePerDay}>${vehicle.precio}<Text style={styles.currency}>/día</Text></Text>
          <Text style={styles.totalPrice}>$ {vehicle.precio * 3} est. total (3 días)</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  content: {
    padding: 24,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  model: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  tripSection: {
    gap: 16,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfoBlock: {
    gap: 4,
  },
  tripLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tripValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B729D',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B729D',
    textDecorationLine: 'underline',
  },
  ratingBox: {
    alignItems: 'flex-end',
  },
  ratingScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 2,
  },
  tripsCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  specItem: {
    width: '45%',
    flexDirection: 'column',
    gap: 4,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  specValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
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
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  hostJoined: {
    fontSize: 14,
    color: '#6B7280',
  },
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
