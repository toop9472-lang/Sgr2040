/**
 * Advertiser Screen - Post ads for a fee
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { advertiserAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PACKAGES = [
  { id: 'basic', name: 'الباقة الأساسية', price: 500, duration: '1 شهر', views: '5,000', color: '#3B82F6' },
  { id: 'premium', name: 'الباقة المميزة', price: 1200, duration: '2 شهر', views: '15,000', color: '#8B5CF6', popular: true },
  { id: 'pro', name: 'الباقة الاحترافية', price: 2500, duration: '3 شهر', views: '50,000', color: '#F59E0B' },
  { id: 'enterprise', name: 'الباقة المؤسسية', price: 4200, duration: '6 شهر', views: 'غير محدود', color: '#EF4444' },
];

const AdvertiserScreen = ({ navigation }) => {
  const { user, isGuest } = useAuth();
  const [step, setStep] = useState(1); // 1: package, 2: details, 3: payment
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adDetails, setAdDetails] = useState({
    title: '',
    description: '',
    video_url: '',
    website_url: '',
    advertiser_name: user?.name || '',
    advertiser_email: user?.email || '',
  });

  const handleSelectPackage = (pkg) => {
    if (isGuest) {
      Alert.alert('🔒 تسجيل الدخول مطلوب', 'سجّل الدخول للمتابعة كمعلن');
      return;
    }
    setSelectedPackage(pkg);
    setStep(2);
  };

  const handleSubmitDetails = () => {
    if (!adDetails.title || !adDetails.video_url) {
      Alert.alert('خطأ', 'يرجى ملء الحقول المطلوبة (العنوان ورابط الفيديو)');
      return;
    }

    // Validate URL
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(adDetails.video_url)) {
      Alert.alert('خطأ', 'رابط الفيديو غير صالح');
      return;
    }

    setStep(3);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create ad first
      const adResponse = await advertiserAPI.createAd({
        ...adDetails,
        package_id: selectedPackage.id,
        package_name: selectedPackage.name,
        price: selectedPackage.price,
      });

      // Create Stripe checkout session
      const checkoutResponse = await paymentAPI.createCheckout({
        ad_id: adResponse.ad_id,
        package_id: selectedPackage.id,
        amount: selectedPackage.price,
        currency: 'SAR',
      });

      if (checkoutResponse.checkout_url) {
        // Open Stripe checkout in browser
        await Linking.openURL(checkoutResponse.checkout_url);
        
        Alert.alert(
          '✅ تم إنشاء الطلب',
          'سيتم تفعيل إعلانك بعد إتمام الدفع ومراجعة المحتوى',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'حدث خطأ أثناء إنشاء الطلب';
      Alert.alert('خطأ', message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Select Package
  if (step === 1) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🎯 للمعلنين</Text>
          <Text style={styles.headerSubtitle}>وصّل إعلانك لآلاف المشاهدين</Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>اختر الباقة المناسبة</Text>
          
          {PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                pkg.popular && styles.packageCardPopular,
              ]}
              onPress={() => handleSelectPackage(pkg)}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>الأكثر طلباً</Text>
                </View>
              )}
              <View style={[styles.packageIcon, { backgroundColor: pkg.color }]}>
                <Text style={styles.packageIconText}>📢</Text>
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packageDuration}>{pkg.duration} • {pkg.views} مشاهدة</Text>
              </View>
              <View style={styles.packagePrice}>
                <Text style={styles.priceAmount}>{pkg.price}</Text>
                <Text style={styles.priceCurrency}>ر.س</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>جميع الباقات تشمل:</Text>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>زر "زيارة الموقع" لموقعك</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>إحصائيات تفصيلية للمشاهدات</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>دعم فني على مدار الساعة</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>فاتورة ضريبية معتمدة</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Step 2: Ad Details
  if (step === 2) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header2}>
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={styles.backButton}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>تفاصيل الإعلان</Text>
          <View style={styles.selectedPackageBadge}>
            <Text style={styles.selectedPackageText}>{selectedPackage.name}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>عنوان الإعلان *</Text>
            <TextInput
              style={styles.input}
              value={adDetails.title}
              onChangeText={(text) => setAdDetails({ ...adDetails, title: text })}
              placeholder="مثال: عروض رمضان الحصرية"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>وصف الإعلان</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={adDetails.description}
              onChangeText={(text) => setAdDetails({ ...adDetails, description: text })}
              placeholder="وصف مختصر للإعلان..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رابط الفيديو *</Text>
            <TextInput
              style={styles.input}
              value={adDetails.video_url}
              onChangeText={(text) => setAdDetails({ ...adDetails, video_url: text })}
              placeholder="https://..."
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.inputHint}>رابط مباشر للفيديو (MP4)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رابط الموقع</Text>
            <TextInput
              style={styles.input}
              value={adDetails.website_url}
              onChangeText={(text) => setAdDetails({ ...adDetails, website_url: text })}
              placeholder="https://yourwebsite.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم المعلن</Text>
            <TextInput
              style={styles.input}
              value={adDetails.advertiser_name}
              onChangeText={(text) => setAdDetails({ ...adDetails, advertiser_name: text })}
              placeholder="اسم الشركة أو المتجر"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني *</Text>
            <TextInput
              style={styles.input}
              value={adDetails.advertiser_email}
              onChangeText={(text) => setAdDetails({ ...adDetails, advertiser_email: text })}
              placeholder="email@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleSubmitDetails}>
            <Text style={styles.continueButtonText}>متابعة للدفع</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 3: Payment
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header2}>
        <TouchableOpacity onPress={() => setStep(2)}>
          <Text style={styles.backButton}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>تأكيد الدفع</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>ملخص الطلب</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>الباقة</Text>
          <Text style={styles.summaryValue}>{selectedPackage.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>المدة</Text>
          <Text style={styles.summaryValue}>{selectedPackage.duration}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>المشاهدات</Text>
          <Text style={styles.summaryValue}>{selectedPackage.views}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>عنوان الإعلان</Text>
          <Text style={styles.summaryValue}>{adDetails.title}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>الإجمالي (شامل الضريبة)</Text>
          <Text style={styles.totalValue}>{selectedPackage.price} ر.س</Text>
        </View>
      </View>

      <View style={styles.paymentMethods}>
        <Text style={styles.paymentTitle}>طرق الدفع المتاحة</Text>
        <View style={styles.paymentIcons}>
          <View style={styles.paymentIcon}>
            <Text style={styles.paymentIconText}>💳</Text>
            <Text style={styles.paymentIconLabel}>Visa/MC</Text>
          </View>
          <View style={styles.paymentIcon}>
            <Text style={styles.paymentIconText}>🍎</Text>
            <Text style={styles.paymentIconLabel}>Apple Pay</Text>
          </View>
          <View style={styles.paymentIcon}>
            <Text style={styles.paymentIconText}>📱</Text>
            <Text style={styles.paymentIconLabel}>mada</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payButton, isLoading && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>
            الدفع الآن - {selectedPackage.price} ر.س
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        بالضغط على "الدفع الآن" أنت توافق على الشروط والأحكام وسياسة الإعلانات
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  header2: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    color: '#4F46E5',
    fontSize: 16,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedPackageBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  selectedPackageText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  packageCardPopular: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  packageIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  packageIconText: {
    fontSize: 24,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
  },
  packageDuration: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  packagePrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceCurrency: {
    fontSize: 12,
    color: '#6B7280',
  },
  features: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  featureText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
    textAlign: 'right',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  summaryValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  totalLabel: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#4F46E5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentMethods: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentIcon: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: 80,
  },
  paymentIconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  paymentIconLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  payButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
});

export default AdvertiserScreen;
