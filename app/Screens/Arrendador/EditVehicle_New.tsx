import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import EditInfoTab from '../../components/EditVehicle/EditInfoTab';
import EditPhotosTab from '../../components/EditVehicle/EditPhotosTab';
import EditPriceTab from '../../components/EditVehicle/EditPriceTab';
import EditRulesTab from '../../components/EditVehicle/EditRulesTab';
import { useAuth } from '../../context/Auth';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTab, setSuccessTab] = useState<Tab>('info');
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

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

  const showSuccess = (message: string, tab: Tab) => {
    setSuccessMessage(message);
    setSuccessTab(tab);
    setShowSuccessModal(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const hideSuccessModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessModal(false);
    });
  };

  const getNextSteps = (tab: Tab) => {
    switch (tab) {
      case 'info':
        return [
          'Actualiza las fotos de tu vehículo para atraer más clientes',
          'Revisa el precio y la ubicación en la siguiente pestaña',
        ];
      case 'photos':
        return [
          'Establece un precio competitivo para tu vehículo',
          'Configura las reglas y políticas de renta',
        ];
      case 'price':
        return [
          'Define las reglas de uso del vehículo',
          'Tu vehículo estará listo para recibir reservas',
        ];
      case 'rules':
        return [
          'Tu vehículo está completamente configurado',
          'Los clientes ya pueden hacer reservas',
        ];
      default:
        return [];
    }
  };

  const handleSaveInfo = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      showSuccess('Información actualizada correctamente', 'info');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar');
    }
  };

  const handleSavePhotos = async (photos: string[], deletedPhotos: string[]) => {
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      await updateVehiclePhotos(vehicle.id, photos, deletedPhotos, user.uid);
      showSuccess('Fotos actualizadas correctamente', 'photos');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar fotos');
    }
  };

  const handleSavePrice = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      showSuccess('Precio y ubicación actualizados', 'price');
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar');
    }
  };

  const handleSaveRules = async (data: Partial<Vehicle>) => {
    try {
      await updateVehicle(vehicle.id, data);
      showSuccess('Reglas actualizadas correctamente', 'rules');
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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={hideSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <View style={styles.successIconRing} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>¡Cambios Guardados!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>

            {/* Next Steps */}
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>Siguientes pasos:</Text>
              {getNextSteps(successTab).map((step, index) => (
                <View key={index} style={styles.nextStepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.nextStepText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={hideSuccessModal}
              >
                <Text style={styles.continueButtonText}>Continuar Editando</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => {
                  hideSuccessModal();
                  navigation.goBack();
                }}
              >
                <Text style={styles.doneButtonText}>Finalizar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  successIconRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    top: -10,
    left: -10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  nextStepsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B729D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B729D',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  doneButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
