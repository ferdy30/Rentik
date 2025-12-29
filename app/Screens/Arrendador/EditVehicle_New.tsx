import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import EditInfoTab from '../../components/EditVehicle/EditInfoTab';
import EditPhotosTab from '../../components/EditVehicle/EditPhotosTab';
import EditPriceTab from '../../components/EditVehicle/EditPriceTab';
import EditRulesTab from '../../components/EditVehicle/EditRulesTab';
import { getVehicleReservations } from '../../services/reservations';
import { normalizeVehicleData, updateVehicle, updateVehiclePhotos } from '../../services/vehicles';
import type { Vehicle } from '../../types/vehicle';

type Tab = 'info' | 'photos' | 'price' | 'rules';

export default function EditVehicle() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { vehicle: rawVehicle } = route.params;

  // Normalizar datos al cargar
  const vehicle = React.useMemo(() => 
    normalizeVehicleData(rawVehicle.id, rawVehicle), 
    [rawVehicle]
  );

  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [hasActiveReservations, setHasActiveReservations] = useState(false);
  const [checkingReservations, setCheckingReservations] = useState(true);

  React.useEffect(() => {
    checkForActiveReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkForActiveReservations = async () => {
    try {
      const reservations = await getVehicleReservations(vehicle.id);
      const active = reservations.some(r => 
        r.status === 'confirmed' || r.status === 'pending'
      );
      setHasActiveReservations(active);
    } catch (error) {
      console.error('Error checking reservations:', error);
    } finally {
      setCheckingReservations(false);
    }
  };

  const handleSaveInfo = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      Alert.alert('Éxito', 'Información actualizada correctamente');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar');
    }
  };

  const handleSavePhotos = async (photos: string[], deletedPhotos: string[]) => {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      await updateVehiclePhotos(vehicle.id, photos, deletedPhotos, user.uid);
      Alert.alert('Éxito', 'Fotos actualizadas correctamente');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar fotos');
    }
  };

  const handleSavePrice = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      Alert.alert('Éxito', 'Precio y ubicación actualizados');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar');
    }
  };

  const handleSaveRules = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      Alert.alert('Éxito', 'Reglas actualizadas correctamente');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar');
    }
  };

  const tabs = [
    { id: 'info' as Tab, label: 'Información', icon: 'information-circle-outline' },
    { id: 'photos' as Tab, label: 'Fotos', icon: 'images-outline' },
    { id: 'price' as Tab, label: 'Precio', icon: 'cash-outline' },
    { id: 'rules' as Tab, label: 'Reglas', icon: 'shield-outline' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <EditInfoTab
            vehicle={vehicle}
            onSave={handleSaveInfo}
            hasActiveReservations={hasActiveReservations}
          />
        );
      case 'photos':
        return (
          <EditPhotosTab
            vehicle={vehicle}
            onSave={handleSavePhotos}
          />
        );
      case 'price':
        return (
          <EditPriceTab
            vehicle={vehicle}
            onSave={handleSavePrice}
          />
        );
      case 'rules':
        return (
          <EditRulesTab
            vehicle={vehicle}
            onSave={handleSaveRules}
          />
        );
      default:
        return null;
    }
  };

  if (checkingReservations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B729D" />
        <Text style={styles.loadingText}>Verificando reservas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Editar Vehículo</Text>
          <Text style={styles.headerSubtitle}>
            {vehicle.marca} {vehicle.modelo} {vehicle.anio}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Warning si hay reservas activas */}
      {hasActiveReservations && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Este vehículo tiene reservas activas. Algunos cambios pueden estar limitados.
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.id ? '#0B729D' : '#6B7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 12 : 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#0B729D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
