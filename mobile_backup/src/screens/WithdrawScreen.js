/**
 * Withdraw Screen - Request withdrawal
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { withdrawalAPI } from '../services/api';

const WithdrawScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [details, setDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  const maxPoints = user?.points || 0;
  const maxAmount = maxPoints / 500;

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const data = await withdrawalAPI.getMethods();
      setMethods(data.methods || []);
    } catch (error) {
      console.error('Failed to load methods:', error);
      // Fallback methods
      setMethods([
        { id: 'paypal', name: 'PayPal', icon: '💳', fields: ['email'] },
        { id: 'stcpay', name: 'STC Pay', icon: '📱', fields: ['phone'] },
        { id: 'bank', name: 'تحويل بنكي', icon: '🏦', fields: ['bank_name', 'account_number', 'iban'] },
      ]);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      Alert.alert('خطأ', 'اختر طريقة السحب');
      return;
    }

    if (maxPoints < 500) {
      Alert.alert('خطأ', 'تحتاج 500 نقطة على الأقل');
      return;
    }

    // Validate required fields
    const method = methods.find(m => m.id === selectedMethod);
    if (method?.fields) {
      for (const field of method.fields) {
        if (!details[field]) {
          Alert.alert('خطأ', 'أكمل جميع الحقول المطلوبة');
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      await withdrawalAPI.createWithdrawal({
        points: maxPoints,
        amount: maxAmount,
        method: selectedMethod,
        method_name: methods.find(m => m.id === selectedMethod)?.name,
        details,
      });

      await refreshUser();

      Alert.alert(
        '✅ تم إرسال الطلب',
        'سيتم مراجعة طلبك والتواصل معك قريباً',
        [{ text: 'حسناً', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message = error.response?.data?.detail || 'فشل إرسال الطلب';
      Alert.alert('خطأ', message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldInput = (field) => {
    const labels = {
      email: 'البريد الإلكتروني',
      phone: 'رقم الجوال',
      bank_name: 'اسم البنك',
      account_number: 'رقم الحساب',
      iban: 'رقم IBAN',
    };

    return (
      <View key={field} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{labels[field] || field}</Text>
        <TextInput
          style={styles.input}
          value={details[field] || ''}
          onChangeText={(text) => setDetails({ ...details, [field]: text })}
          placeholder={labels[field]}
          placeholderTextColor="#9CA3AF"
          keyboardType={field === 'email' ? 'email-address' : field === 'phone' ? 'phone-pad' : 'default'}
        />
      </View>
    );
  };

  if (isLoadingMethods) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>سحب الرصيد</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>النقاط المتاحة</Text>
          <Text style={styles.summaryValue}>{maxPoints}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>القيمة بالدولار</Text>
          <Text style={styles.summaryValueGreen}>${maxAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.exchangeRate}>
          <Text style={styles.exchangeRateText}>500 نقطة = $1</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>اختر طريقة السحب</Text>
        
        {methods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected,
            ]}
            onPress={() => {
              setSelectedMethod(method.id);
              setDetails({});
            }}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={styles.methodName}>{method.name}</Text>
            {selectedMethod === method.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Method Details Form */}
      {selectedMethod && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الحساب</Text>
          {methods.find(m => m.id === selectedMethod)?.fields?.map(renderFieldInput)}
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            إرسال طلب السحب (${maxAmount.toFixed(2)})
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          ⚠️ يتم مراجعة طلبات السحب خلال 24-48 ساعة
        </Text>
      </View>
    </ScrollView>
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 16,
  },
  summaryValue: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryValueGreen: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  exchangeRate: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  exchangeRateText: {
    color: '#6B7280',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  methodCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  methodIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  checkmark: {
    color: '#4F46E5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notice: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  noticeText: {
    color: '#92400E',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default WithdrawScreen;
