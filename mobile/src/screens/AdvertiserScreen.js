// Advertiser Screen - Submit ads for advertisers
// Professional Design with Dynamic Packages from Server
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const API_URL = 'https://mobile-verify-9.preview.emergentagent.com';

// سيتم استبدالها بالباقات من السيرفر
const FALLBACK_PACKAGES = [
  { id: 'ad_1_month', description: 'شهر واحد', duration_months: 1, amount: 1000, features: ['1000 مشاهدة مضمونة', 'تقرير أسبوعي'] },
  { id: 'ad_3_months', description: '3 أشهر (خصم 10%)', duration_months: 3, amount: 2700, features: ['5000 مشاهدة مضمونة', 'تقرير يومي', 'أولوية'], popular: true },
  { id: 'ad_6_months', description: '6 أشهر (خصم 20%)', duration_months: 6, amount: 4800, features: ['15000 مشاهدة مضمونة', 'تقرير مفصل', 'دعم مخصص'] },
];

const AdvertiserScreen = () => {
  const [step, setStep] = useState(1); // 1: package, 2: form, 3: payment, 4: success
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [createdAd, setCreatedAd] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    title: '',
    description: '',
    video_url: '',
  });

  // جلب الباقات من السيرفر
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await api.getPackages();
      if (response.ok) {
        const data = await response.json();
        if (data.packages && data.packages.length > 0) {
          // إضافة الميزات للباقات إذا لم تكن موجودة
          const packagesWithFeatures = data.packages.map((pkg, index) => ({
            ...pkg,
            features: pkg.features || [
              `${pkg.duration_months * 1000} مشاهدة مضمونة`,
              index > 0 ? 'تقرير يومي' : 'تقرير أسبوعي',
              index > 1 ? 'دعم مخصص' : undefined,
            ].filter(Boolean),
            popular: index === 1,
          }));
          setPackages(packagesWithFeatures);
        }
      }
    } catch (error) {
      console.log('Using fallback packages');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.name || !formData.email) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('خطأ', 'يرجى اختيار باقة');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/advertiser/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_name: formData.name,
          advertiser_email: formData.email,
          advertiser_phone: formData.phone,
          website_url: formData.website,
          title: formData.title,
          description: formData.description,
          video_url: formData.video_url,
          duration_months: selectedPackage.duration_months,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedAd(data);
        setStep(3); // Go to payment step
      } else {
        Alert.alert('خطأ', 'فشل إنشاء الإعلان');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Stripe Payment
  const handleStripePayment = async () => {
    if (!createdAd?.ad?.id) {
      Alert.alert('خطأ', 'يرجى إنشاء الإعلان أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          ad_id: createdAd.ad.id,
          origin_url: API_URL,
          advertiser_email: formData.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Open Stripe checkout in browser
        await Linking.openURL(data.checkout_url);
        setStep(4); // Go to success
      } else {
        Alert.alert('خطأ', 'فشل إنشاء جلسة الدفع');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الدفع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedPackage(null);
    setCreatedAd(null);
    setFormData({ name: '', email: '', phone: '', website: '', title: '', description: '', video_url: '' });
  };

  // Success Screen
  if (step === 4) {
    return (
      <View style={styles.successPage}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>
        <Text style={styles.successTitle}>تم إرسال إعلانك!</Text>
        <Text style={styles.successDesc}>سيتم مراجعة إعلانك وتفعيله خلال 24 ساعة بعد تأكيد الدفع.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={resetForm}>
          <Text style={styles.successBtnText}>إنشاء إعلان جديد</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading Screen
  if (isLoadingPackages) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جاري تحميل الباقات...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="megaphone" size={28} color="#60a5fa" />
          </View>
          <Text style={styles.pageTitle}>أعلن معنا</Text>
          <Text style={styles.pageSubtitle}>وصل إعلانك لآلاف المستخدمين النشطين</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Ionicons name={step > 1 ? "checkmark" : "cart"} size={16} color={step >= 1 ? '#FFF' : '#666'} />
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Ionicons name={step > 2 ? "checkmark" : "document-text"} size={16} color={step >= 2 ? '#FFF' : '#666'} />
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
            <Ionicons name={step > 3 ? "checkmark" : "card"} size={16} color={step >= 3 ? '#FFF' : '#666'} />
          </View>
        </View>

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>اختر الباقة المناسبة</Text>
            {packages.map((pkg, index) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selectedPackage?.id === pkg.id && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage(pkg)}
                activeOpacity={0.7}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={10} color="#000" />
                    <Text style={styles.popularText}>الأكثر شعبية</Text>
                  </View>
                )}
                
                {/* Package Icon */}
                <View style={styles.packageIcon}>
                  <Ionicons 
                    name={index === 0 ? "rocket-outline" : index === 1 ? "flash-outline" : "diamond-outline"} 
                    size={24} 
                    color="#60a5fa" 
                  />
                </View>
                
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.description}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.packagePrice}>{pkg.amount}</Text>
                    <Text style={styles.priceCurrency}>﷼</Text>
                  </View>
                </View>
                
                <View style={styles.packageFeatures}>
                  {pkg.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      <Text style={styles.packageFeature}>{f}</Text>
                    </View>
                  ))}
                </View>
                
                {selectedPackage?.id === pkg.id && (
                  <View style={styles.selectedCheck}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.nextBtn, !selectedPackage && styles.nextBtnDisabled]}
              onPress={() => selectedPackage && setStep(2)}
              disabled={!selectedPackage}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>التالي</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>بيانات الإعلان</Text>
            <View style={styles.formCard}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="person-outline" size={14} color="#9ca3af" /> اسمك / اسم الشركة *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل اسمك"
                  placeholderTextColor="#6b7280"
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="mail-outline" size={14} color="#9ca3af" /> البريد الإلكتروني *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#6b7280"
                  value={formData.email}
                  onChangeText={(t) => setFormData({ ...formData, email: t })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="call-outline" size={14} color="#9ca3af" /> رقم الهاتف
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="+966 5XX XXX XXXX"
                  placeholderTextColor="#6b7280"
                  value={formData.phone}
                  onChangeText={(t) => setFormData({ ...formData, phone: t })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="globe-outline" size={14} color="#9ca3af" /> رابط الموقع
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor="#6b7280"
                  value={formData.website}
                  onChangeText={(t) => setFormData({ ...formData, website: t })}
                  autoCapitalize="none"
                />
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="text-outline" size={14} color="#9ca3af" /> عنوان الإعلان *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="عنوان جذاب لإعلانك"
                  placeholderTextColor="#6b7280"
                  value={formData.title}
                  onChangeText={(t) => setFormData({ ...formData, title: t })}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="document-text-outline" size={14} color="#9ca3af" /> وصف الإعلان *
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="اكتب وصفاً تفصيلياً"
                  placeholderTextColor="#6b7280"
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Selected Package Summary */}
            {selectedPackage && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>الباقة المختارة</Text>
                  <Text style={styles.summaryValue}>{selectedPackage.description}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>المبلغ الإجمالي</Text>
                  <Text style={styles.summaryPrice}>{selectedPackage.amount} ﷼</Text>
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color="#FFF" />
                <Text style={styles.backBtnText}>رجوع</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>متابعة للدفع</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && createdAd && (
          <>
            <Text style={styles.sectionTitle}>اختر طريقة الدفع</Text>
            
            {/* Payment Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>الباقة</Text>
                <Text style={styles.paymentSummaryValue}>{selectedPackage?.description}</Text>
              </View>
              <View style={styles.paymentSummaryRow}>
                <Text style={styles.paymentSummaryLabel}>المبلغ</Text>
                <Text style={styles.paymentSummaryPrice}>{selectedPackage?.amount} ﷼</Text>
              </View>
            </View>

            {/* Stripe Payment */}
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={handleStripePayment}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <View style={styles.paymentOptionIcon}>
                <Ionicons name="card" size={28} color="#6366f1" />
              </View>
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentOptionTitle}>الدفع ببطاقة الائتمان</Text>
                <Text style={styles.paymentOptionDesc}>Visa, Mastercard, Apple Pay</Text>
              </View>
              <View style={styles.paymentOptionBadge}>
                <Text style={styles.paymentOptionBadgeText}>آمن</Text>
              </View>
            </TouchableOpacity>

            {/* Bank Transfer Info */}
            <View style={styles.bankInfoCard}>
              <View style={styles.bankInfoHeader}>
                <Ionicons name="business" size={20} color="#60a5fa" />
                <Text style={styles.bankInfoTitle}>أو التحويل البنكي</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>البنك:</Text>
                <Text style={styles.bankInfoValue}>الراجحي</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>رقم الحساب:</Text>
                <Text style={styles.bankInfoValue}>SA1234567890</Text>
              </View>
              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>اسم المستفيد:</Text>
                <Text style={styles.bankInfoValue}>شركة صقر</Text>
              </View>
              <Text style={styles.bankInfoNote}>
                بعد التحويل، أرسل إيصال التحويل على البريد: support@saqr.app
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={18} color="#FFF" />
                <Text style={styles.backBtnText}>رجوع</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stripeBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleStripePayment}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="card" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>ادفع الآن</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },

  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#0a0a0f', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: 'rgba(255,255,255,0.6)', 
    marginTop: 16, 
    fontSize: 16 
  },

  header: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pageTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#FFF', 
    marginBottom: 4 
  },
  pageSubtitle: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.5)', 
    textAlign: 'center' 
  },

  stepIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  stepDot: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stepDotActive: { 
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stepLine: { 
    width: 60, 
    height: 2, 
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  stepLineActive: { 
    backgroundColor: '#3b82f6' 
  },

  sectionTitle: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
  },

  packageCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 12, 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  packageCardSelected: { 
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  popularBadge: { 
    position: 'absolute', 
    top: -12, 
    right: 16, 
    backgroundColor: '#fbbf24', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularText: { 
    color: '#000', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  packageIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  packageHeader: { 
    alignItems: 'center', 
    marginBottom: 16 
  },
  packageName: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  packagePrice: { 
    color: '#60a5fa', 
    fontSize: 32, 
    fontWeight: 'bold' 
  },
  priceCurrency: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  packageFeatures: { 
    gap: 8 
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageFeature: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 13 
  },
  selectedCheck: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  nextBtn: { 
    backgroundColor: '#3b82f6', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDisabled: { 
    opacity: 0.5 
  },
  nextBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  formCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 13, 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    padding: 14, 
    color: '#FFF', 
    fontSize: 15, 
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top',
    paddingTop: 14,
  },

  summaryCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryPrice: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: 'bold',
  },

  buttonRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  backBtn: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 14, 
    padding: 14, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backBtnText: { 
    color: '#FFF', 
    fontSize: 15,
    fontWeight: '500',
  },
  submitBtn: { 
    flex: 2, 
    backgroundColor: '#3b82f6', 
    borderRadius: 14, 
    padding: 14, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { 
    opacity: 0.6 
  },
  submitBtnText: { 
    color: '#FFF', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },

  successPage: { 
    flex: 1, 
    backgroundColor: '#0a0a0f', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40 
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: { 
    color: '#FFF', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  successDesc: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 22,
  },
  successBtn: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 14 
  },
  successBtnText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  // Payment Step Styles
  paymentSummary: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentSummaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  paymentSummaryValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentSummaryPrice: {
    color: '#60a5fa',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentOption: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  paymentOptionBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentOptionBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  bankInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bankInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bankInfoTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankInfoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  bankInfoValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  bankInfoNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stripeBtn: {
    flex: 2,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default AdvertiserScreen;
