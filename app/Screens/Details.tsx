import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, Share, StatusBar, StyleSheet, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import BottomActionBar from '../components/Details/BottomActionBar';
import HostInfo from '../components/Details/HostInfo';
import VehicleCarousel from '../components/Details/VehicleCarousel';
import VehicleDescription from '../components/Details/VehicleDescription';
import VehicleFeatures from '../components/Details/VehicleFeatures';
import VehicleHeader from '../components/Details/VehicleHeader';
import VehicleSpecs from '../components/Details/VehicleSpecs';
import type { RootStackParamList } from '../navigation';

type DetailsRouteProp = RouteProp<RootStackParamList, 'Details'>;

export default function Details() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<DetailsRouteProp>();
  const { vehicle } = route.params;
  const [hostName, setHostName] = useState('Arrendador Verificado');
  const [hostJoined, setHostJoined] = useState('Se unió en 2023');

  useEffect(() => {
    const fetchHost = async () => {
      const ownerId = vehicle.arrendadorId || vehicle.propietarioId;
      if (ownerId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', ownerId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.nombre) {
              setHostName(`${data.nombre} ${data.apellido || ''}`.trim());
            }
          }
        } catch (e) {
          console.error('Error fetching host:', e);
        }
      }
    };
    fetchHost();
  }, [vehicle.arrendadorId, vehicle.propietarioId]);

  const images = vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes : [vehicle.imagen];

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
        <VehicleCarousel
          images={images}
          onBackPress={() => navigation.goBack()}
          onSharePress={handleShare}
        />

        <View style={styles.content}>
          <VehicleHeader
            marca={vehicle.marca}
            modelo={vehicle.modelo}
            anio={vehicle.anio}
            rating={vehicle.rating}
            reviewCount={vehicle.reviewCount}
          />

          <View style={styles.divider} />

          <VehicleSpecs
            transmision={vehicle.transmision}
            combustible={vehicle.combustible}
            pasajeros={vehicle.pasajeros}
            puertas={vehicle.puertas} 
          />

          <View style={styles.divider} />

          <VehicleDescription description={vehicle.descripcion} />

          <View style={styles.divider} />

          <VehicleFeatures features={vehicle.caracteristicas} />

          <View style={styles.divider} />

          <HostInfo name={hostName} joinedDate={hostJoined} />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomActionBar
        price={vehicle.precio}
        onBookPress={() => navigation.navigate('BookingStep1Dates', { vehicle })}
      />
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
  content: {
    padding: 24,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
});
