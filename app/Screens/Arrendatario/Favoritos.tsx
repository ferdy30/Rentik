import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import EmptyState from '../../components/EmptyState';
import VehicleCard from '../../components/VehicleCard';
import { useFavorites } from '../../context/FavoritesContext';

type RootStackParamList = {
  Details: { vehicle: any };
  Buscar: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritosScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { favorites, loading, favoritesCount } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // El context ya maneja la suscripción en tiempo real
    // Esto es solo para feedback visual
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleVehiclePress = useCallback((favorite: any) => {
    // Reconstruir objeto vehículo para navegación
    const vehicle = {
      id: favorite.vehicleId,
      ...favorite.vehicleSnapshot,
    };
    navigation.navigate('Details', { vehicle });
  }, [navigation]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerSubtitle}>Tus vehículos</Text>
        <Text style={styles.title}>Favoritos</Text>
      </View>
      {favoritesCount > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{favoritesCount}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        icon="heart-outline"
        title="No tienes favoritos"
        message="Explora vehículos y guarda tus favoritos para encontrarlos fácilmente después."
        actionText="Explorar vehículos"
        onAction={() => navigation.navigate('Buscar')}
      />
    </View>
  );

  const renderFavoriteItem = useCallback(({ item }: { item: any }) => {
    if (!item.vehicleSnapshot) {
      return null;
    }

    const vehicle = {
      id: item.vehicleId,
      marca: item.vehicleSnapshot.marca,
      modelo: item.vehicleSnapshot.modelo,
      anio: item.vehicleSnapshot.anio,
      precio: item.vehicleSnapshot.precio,
      imagen: item.vehicleSnapshot.imagen,
      ubicacion: item.vehicleSnapshot.ubicacion,
      rating: item.vehicleSnapshot.rating,
      disponible: true, // Asumir disponible por defecto
    };

    return (
      <View style={styles.cardWrapper}>
        <VehicleCard
          vehicle={vehicle}
          onPress={() => handleVehiclePress(item)}
        />
      </View>
    );
  }, [handleVehiclePress]);

  if (loading && favorites.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B729D" />
        <Text style={styles.loadingText}>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0B729D']}
            tintColor="#0B729D"
          />
        }
      />
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
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0B729D',
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B729D',
  },
  list: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
});
