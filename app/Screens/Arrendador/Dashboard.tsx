import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/Auth';
import { getOwnerReservations } from '../../services/reservations';
import { getAllVehicles } from '../../services/vehicles';

export default function DashboardScreen() {
  const { userData, user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    monthEarnings: 0,
    totalEarnings: 0,
    activeRentals: 0,
    pendingRequests: 0,
    totalVehicles: 0,
    rating: 4.8,
    monthlyData: [] as { month: string; amount: number; height: number }[]
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch reservations
      const reservations = await getOwnerReservations(user.uid);
      
      // Fetch vehicles
      const vehicles = await getAllVehicles();
      const myVehicles = vehicles.filter(v => v.arrendadorId === user.uid);

      // Filter valid reservations for income
      const validReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed');
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let totalEarnings = 0;
      let monthEarnings = 0;
      let activeRentals = 0;
      let pendingRequests = 0;

      reservations.forEach(r => {
        if (r.status === 'confirmed' || r.status === 'completed') {
          totalEarnings += r.totalPrice;
          const rDate = r.startDate.toDate();
          if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
            monthEarnings += r.totalPrice;
          }
        }
        if (r.status === 'confirmed') activeRentals++;
        if (r.status === 'pending') pendingRequests++;
      });

      // Calculate last 6 months data for chart
      const monthlyData = [];
      let maxAmount = 0;

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });
        const monthIdx = d.getMonth();
        const year = d.getFullYear();

        const monthAmount = validReservations
          .filter(r => {
            const rd = r.startDate.toDate();
            return rd.getMonth() === monthIdx && rd.getFullYear() === year;
          })
          .reduce((sum, r) => sum + r.totalPrice, 0);

        if (monthAmount > maxAmount) maxAmount = monthAmount;

        monthlyData.push({
          month: monthLabel,
          amount: monthAmount,
          height: 0
        });
      }

      // Normalize heights for chart
      monthlyData.forEach(d => {
        d.height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
      });

      // Build recent activity
      const activity = [];
      const sortedReservations = [...reservations]
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 5);

      sortedReservations.forEach(r => {
        const createdTime = r.createdAt?.toDate?.() || new Date();
        const timeAgo = getTimeAgo(createdTime);
        
        if (r.status === 'pending') {
          activity.push({
            id: r.id,
            type: 'booking',
            title: 'Nueva solicitud',
            subtitle: r.vehicleId || 'Vehículo',
            time: timeAgo,
            icon: 'calendar'
          });
        } else if (r.status === 'confirmed' || r.status === 'completed') {
          activity.push({
            id: r.id,
            type: 'earning',
            title: 'Reserva confirmada',
            subtitle: `+$${r.totalPrice.toFixed(2)}`,
            time: timeAgo,
            icon: 'cash'
          });
        }
      });

      setStats({
        monthEarnings,
        totalEarnings,
        activeRentals,
        pendingRequests,
        totalVehicles: myVehicles.length,
        rating: 4.8, // TODO: Calculate from reviews
        monthlyData
      });
      setRecentActivity(activity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0B729D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {userData?.nombre || 'Arrendador'}</Text>
          <Text style={styles.subGreeting}>Aquí está tu resumen de hoy</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.profileInitial}>{userData?.nombre?.charAt(0) || 'A'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Earnings Card - Principal */}
        <View style={styles.earningsCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.earningsLabel}>Ganancias este mes</Text>
            <Text style={styles.earningsAmount}>${stats.monthEarnings.toFixed(2)}</Text>
            <Text style={styles.earningsSubtext}>Total histórico: ${stats.totalEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsIcon}>
            <Ionicons name="trending-up" size={24} color="#0B729D" />
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Reservas')}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="key-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>{stats.activeRentals}</Text>
            <Text style={styles.statLabel}>Rentas Activas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Reservas')}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Solicitudes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Mis autos')}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="car-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.statValue}>{stats.totalVehicles}</Text>
            <Text style={styles.statLabel}>Mis Autos</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="star-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddVehicleStep1Basic')}>
            <View style={[styles.actionIcon, { backgroundColor: '#0B729D' }]}>
              <Ionicons name="add" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Agregar Auto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIcon, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="stats-chart" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Ver Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </View>
            <Text style={styles.actionText}>Seguro</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Earnings Chart */}
        <Text style={styles.sectionTitle}>Ingresos últimos 6 meses</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {stats.monthlyData.map((d, i) => (
              <View key={i} style={styles.barContainer}>
                <Text style={styles.barValue}>
                  ${d.amount > 999 ? (d.amount/1000).toFixed(1)+'k' : d.amount.toFixed(0)}
                </Text>
                <View style={[styles.bar, { height: Math.max(d.height, 4) }]} />
                <Text style={styles.barLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        {recentActivity.length > 0 ? (
          <View style={styles.activityList}>
            {recentActivity.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.activityItem}
                onPress={() => navigation.navigate('Reservas')}
              >
                <View style={styles.activityIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No hay actividad reciente</Text>
          </View>
        )}
        
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  earningsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  earningsSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  earningsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionsScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  actionBtn: {
    alignItems: 'center',
    marginRight: 20,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 10,
  },
  barContainer: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    backgroundColor: '#0B729D',
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  barValue: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
