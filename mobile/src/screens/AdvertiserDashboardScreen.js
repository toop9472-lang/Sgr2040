// Advertiser Dashboard - لوحة تحكم المعلن
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'https://mobile-verify-9.preview.emergentagent.com';

const AdvertiserDashboardScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async (advertiserEmail) => {
    if (!advertiserEmail) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/analytics/advertiser/${encodeURIComponent(advertiserEmail)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setIsLoggedIn(true);
      } else {
        setError('لم يتم العثور على إعلانات لهذا البريد');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return;
    }
    fetchDashboard(email.trim());
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(email);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'pending': return '#fbbf24';
      case 'expired': return '#ef4444';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'قيد المراجعة';
      case 'expired': return 'منتهي';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginIconContainer}>
            <Ionicons name="bar-chart" size={40} color="#60a5fa" />
          </View>
          <Text style={styles.loginTitle}>لوحة تحكم المعلن</Text>
          <Text style={styles.loginSubtitle}>
            أدخل بريدك الإلكتروني لعرض إعلاناتك وإحصائياتها
          </Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>عرض إعلاناتي</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAdBtn}
            onPress={() => navigation.navigate('Advertiser')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#60a5fa" />
            <Text style={styles.createAdBtnText}>إنشاء إعلان جديد</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading
  if (isLoading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  // Dashboard
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setIsLoggedIn(false);
                setData(null);
                setEmail('');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>مرحباً بك</Text>
              <Text style={styles.headerEmail}>{data?.advertiser_email}</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="person-circle" size={50} color="#60a5fa" />
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
            <Ionicons name="megaphone" size={24} color="#3b82f6" />
            <Text style={styles.summaryValue}>{data?.total_ads || 0}</Text>
            <Text style={styles.summaryLabel}>إجمالي الإعلانات</Text>
          </View>
          
          <View style={[styles.summaryCard, { borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
            <Ionicons name="eye" size={24} color="#22c55e" />
            <Text style={styles.summaryValue}>{data?.summary?.total_views || 0}</Text>
            <Text style={styles.summaryLabel}>إجمالي المشاهدات</Text>
          </View>
          
          <View style={[styles.summaryCard, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
            <Ionicons name="people" size={24} color="#a855f7" />
            <Text style={styles.summaryValue}>{data?.summary?.total_unique_viewers || 0}</Text>
            <Text style={styles.summaryLabel}>مشاهدين فريدين</Text>
          </View>
          
          <View style={[styles.summaryCard, { borderColor: 'rgba(251, 191, 36, 0.3)' }]}>
            <Ionicons name="checkmark-done" size={24} color="#fbbf24" />
            <Text style={styles.summaryValue}>{data?.summary?.avg_completion_rate || 0}%</Text>
            <Text style={styles.summaryLabel}>نسبة الإكمال</Text>
          </View>
        </View>

        {/* Ads List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إعلاناتي</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('Advertiser')}
            >
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addBtnText}>إعلان جديد</Text>
            </TouchableOpacity>
          </View>

          {data?.ads_analytics?.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#4b5563" />
              <Text style={styles.emptyText}>لا توجد إعلانات بعد</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Advertiser')}
              >
                <Text style={styles.emptyBtnText}>أنشئ إعلانك الأول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            data?.ads_analytics?.map((ad, index) => (
              <View key={ad.ad_id || index} style={styles.adCard}>
                <View style={styles.adHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ad.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(ad.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(ad.status) }]}>
                      {getStatusText(ad.status)}
                    </Text>
                  </View>
                  <Text style={styles.adTitle}>{ad.title}</Text>
                </View>

                <View style={styles.adStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={16} color="#60a5fa" />
                    <Text style={styles.statValue}>{ad.views}</Text>
                    <Text style={styles.statLabel}>مشاهدة</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#a855f7" />
                    <Text style={styles.statValue}>{ad.unique_viewers}</Text>
                    <Text style={styles.statLabel}>مشاهد</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={16} color="#fbbf24" />
                    <Text style={styles.statValue}>{ad.avg_watch_time}s</Text>
                    <Text style={styles.statLabel}>متوسط</Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#22c55e" />
                    <Text style={styles.statValue}>{ad.completion_rate}%</Text>
                    <Text style={styles.statLabel}>إكمال</Text>
                  </View>
                </View>

                {ad.created_at && (
                  <Text style={styles.adDate}>
                    تاريخ الإنشاء: {new Date(ad.created_at).toLocaleDateString('ar-SA')}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Total Spent */}
        {data?.summary?.total_spent > 0 && (
          <View style={styles.spentCard}>
            <Ionicons name="wallet" size={24} color="#60a5fa" />
            <View style={styles.spentInfo}>
              <Text style={styles.spentLabel}>إجمالي المبلغ المنفق</Text>
              <Text style={styles.spentValue}>{data.summary.total_spent} ريال</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 100,
  },

  // Login Styles
  loginContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loginIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    textAlign: 'right',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  loginBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
  },
  createAdBtnText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 16,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    marginLeft: 12,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  headerEmail: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  logoutBtn: {
    padding: 8,
  },

  // Summary
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Ad Card
  adCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  adTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'right',
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  adStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  adDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    textAlign: 'center',
  },

  // Spent Card
  spentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  spentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  spentLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  spentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
});

export default AdvertiserDashboardScreen;
