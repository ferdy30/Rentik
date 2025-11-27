import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/Auth';

export default function DashboardScreen() {
  const { userData } = useAuth();
  const navigation = useNavigation<any>();

  // Datos simulados para el dashboard
  const stats = {
    earnings: 1250.00,
    activeRentals: 2,
    pendingRequests: 1,
    totalVehicles: 3,
    rating: 4.8
  };

  const recentActivity = [
    { id: '1', type: 'booking', title: 'Nueva reserva', subtitle: 'Toyota Corolla 2020', time: 'Hace 2h', icon: 'calendar' },
    { id: '2', type: 'earning', title: 'Pago recibido', subtitle: '+$150.00', time: 'Hace 5h', icon: 'cash' },
    { id: '3', type: 'review', title: 'Nueva calificación', subtitle: '5 estrellas - Juan P.', time: 'Ayer', icon: 'star' },
  ];

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsContent}>
            <View>
              <Text style={styles.earningsLabel}>Ganancias este mes</Text>
              <Text style={styles.earningsAmount}>${stats.earnings.toFixed(2)}</Text>
            </View>
            <View style={styles.earningsIcon}>
              <Ionicons name="trending-up" size={24} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Monthly Goal Progress */}
          <View style={styles.goalContainer}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>Meta mensual: $2,000</Text>
              <Text style={styles.goalPercent}>62%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '62%' }]} />
            </View>
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

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.activityList}>
          {recentActivity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons name={item.icon as any} size={20} color="#6B7280" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
        
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
    backgroundColor: '#0B729D',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  earningsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  goalPercent: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 3,
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
});
