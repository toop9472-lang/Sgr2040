/**
 * Withdrawal History Screen - View past withdrawals
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { withdrawalAPI } from '../services/api';

const STATUS_CONFIG = {
  pending: { label: 'قيد المراجعة', color: '#F59E0B', icon: '⏳' },
  approved: { label: 'تمت الموافقة', color: '#10B981', icon: '✅' },
  rejected: { label: 'مرفوض', color: '#EF4444', icon: '❌' },
  completed: { label: 'مكتمل', color: '#3B82F6', icon: '💸' },
};

const WithdrawalHistoryScreen = ({ navigation }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const data = await withdrawalAPI.getWithdrawals();
      setWithdrawals(data.withdrawals || data || []);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadWithdrawals();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={styles.statusIcon}>{status.icon}</Text>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ</Text>
            <Text style={styles.amount}>
              {item.method === 'paypal' ? `$${item.amount}` : `${item.amount} ر.س`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>النقاط</Text>
            <Text style={styles.value}>{item.points} نقطة</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>الطريقة</Text>
            <Text style={styles.value}>{item.method_name || item.method}</Text>
          </View>
        </View>

        {item.status === 'rejected' && item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionText}>سبب الرفض: {item.rejection_reason}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>لا توجد طلبات سحب</Text>
      <Text style={styles.emptyText}>سيظهر هنا سجل طلبات السحب الخاصة بك</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>سجل السحوبات</Text>
      </View>

      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={withdrawals.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    color: '#4F46E5',
    fontSize: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cardBody: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#6B7280',
    fontSize: 14,
  },
  value: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  rejectionText: {
    color: '#DC2626',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WithdrawalHistoryScreen;
