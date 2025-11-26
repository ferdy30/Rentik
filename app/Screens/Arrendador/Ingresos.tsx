import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useAuth } from '../../../context/Auth';
import { getOwnerReservations } from '../../services/reservations';

export default function IngresosScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthEarnings: 0,
    totalReservations: 0,
    monthlyData: [] as { month: string; amount: number; height: number }[]
  });

  const fetchStats = async () => {
    if (!user) return;
    try {
      const reservations = await getOwnerReservations(user.uid);
      
      // Filter only completed or confirmed reservations for income
      const validReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed');
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let total = 0;
      let monthTotal = 0;

      validReservations.forEach(r => {
        total += r.totalPrice;
        const rDate = r.startDate.toDate();
        if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
          monthTotal += r.totalPrice;
        }
      });

      // Calculate last 6 months data
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
          height: 0 // Will calculate after
        });
      }

      // Normalize heights for chart (max height 100px)
      monthlyData.forEach(d => {
        d.height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
      });

      setStats({
        totalEarnings: total,
        monthEarnings: monthTotal,
        totalReservations: reservations.length,
        monthlyData
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ingresos</Text>
      </View>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={styles.summaryCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="cash-outline" size={20} color="#0B729D" />
            </View>
            <Text style={styles.summaryLabel}>Este mes</Text>
            <Text style={styles.summaryValue}>${stats.monthEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="calendar-outline" size={20} color="#1E40AF" />
            </View>
            <Text style={styles.summaryLabel}>Reservas Totales</Text>
            <Text style={styles.summaryValue}>{stats.totalReservations}</Text>
          </View>
        </View>

        {/* Total Earnings */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Ingresos Totales Históricos</Text>
          <Text style={styles.totalValue}>${stats.totalEarnings.toFixed(2)}</Text>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Últimos 6 meses</Text>
          <View style={styles.chartContainer}>
            {stats.monthlyData.map((d, i) => (
              <View key={i} style={styles.barContainer}>
                <Text style={styles.barValue}>${d.amount > 999 ? (d.amount/1000).toFixed(1)+'k' : d.amount}</Text>
                <View style={[styles.bar, { height: Math.max(d.height, 4) }]} />
                <Text style={styles.barLabel}>{d.month}</Text>
              </View>
            ))}
          </View>
        </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#032B3C',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#032B3C',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: '#0B729D',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    color: '#032B3C',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
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
});
