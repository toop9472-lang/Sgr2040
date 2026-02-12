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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

// سيتم استبدالها بالباقات من السيرفر
const FALLBACK_PACKAGES = [
  { id: 'ad_1_month', description: 'شهر واحد', duration_months: 1, amount: 500, features: ['1000 مشاهدة مضمونة', 'تقرير أسبوعي'] },
  { id: 'ad_3_months', description: '3 أشهر', duration_months: 3, amount: 1350, features: ['5000 مشاهدة مضمونة', 'تقرير يومي', 'أولوية'], popular: true },
  { id: 'ad_6_months', description: '6 أشهر', duration_months: 6, amount: 2400, features: ['15000 مشاهدة مضمونة', 'تقرير مفصل', 'دعم مخصص'] },
];

const AdvertiserScreen = () => {
  const [step, setStep] = useState(1); // 1: package, 2: form, 3: success
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    title: '',
    description: '',
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
      const token = await storage.getToken();
      const response = await api.submitAdvertiserAd({
        advertiser_name: formData.name,
        advertiser_email: formData.email,
        advertiser_phone: formData.phone,
        website_url: formData.website,
        title: formData.title,
        description: formData.description,
        package_id: selectedPackage.id,
        duration_months: selectedPackage.duration,
      }, token);

      if (response.ok) {
        setStep(3);
      } else {
        Alert.alert('خطأ', 'فشل إرسال الإعلان');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedPackage(null);
    setFormData({ name: '', email: '', phone: '', website: '', title: '', description: '' });
  };

  // Success Screen
  if (step === 3) {
    return (
      <View style={styles.successPage}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        </View>
        <Text style={styles.successTitle}>تم إرسال إعلانك!</Text>
        <Text style={styles.successDesc}>سيتم مراجعة إعلانك وتفعيله خلال 24 ساعة. سنتواصل معك عبر البريد الإلكتروني.</Text>
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
              <Text style={styles.inputLabel}>اسمك / اسم الشركة *</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />

              <Text style={styles.inputLabel}>البريد الإلكتروني *</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                placeholder="+966 5XX XXX XXXX"
                placeholderTextColor="#9ca3af"
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>رابط الموقع</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#9ca3af"
                value={formData.website}
                onChangeText={(t) => setFormData({ ...formData, website: t })}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>عنوان الإعلان *</Text>
              <TextInput
                style={styles.input}
                placeholder="عنوان جذاب لإعلانك"
                placeholderTextColor="#9ca3af"
                value={formData.title}
                onChangeText={(t) => setFormData({ ...formData, title: t })}
              />

              <Text style={styles.inputLabel}>وصف الإعلان *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="اكتب وصفاً تفصيلياً"
                placeholderTextColor="#9ca3af"
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>‹ رجوع</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>إرسال الإعلان</Text>
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
  container: { flex: 1, backgroundColor: colors.dark.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },

  pageTitle: { fontSize: 28, fontWeight: 'bold', color: colors.dark.text, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: colors.dark.textSecondary, marginBottom: 24 },

  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotText: { color: '#FFF', fontWeight: 'bold' },
  stepLine: { width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { backgroundColor: colors.primary },

  sectionTitle: { color: colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  packageCard: { backgroundColor: colors.dark.card, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  packageCardSelected: { borderColor: colors.primary },
  packageCardPopular: { borderColor: colors.accent },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  packageName: { color: colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  packagePrice: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  packageFeatures: { gap: 4 },
  packageFeature: { color: colors.dark.textSecondary, fontSize: 14 },
  selectedCheck: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  selectedCheckText: { color: '#FFF', fontWeight: 'bold' },

  nextBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  formCard: { backgroundColor: colors.dark.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  inputLabel: { color: colors.dark.textSecondary, fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 16, marginBottom: 16, textAlign: 'right' },
  textArea: { height: 100, textAlignVertical: 'top' },

  buttonRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, alignItems: 'center' },
  backBtnText: { color: '#FFF', fontSize: 16 },
  submitBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  successPage: { flex: 1, backgroundColor: colors.dark.bg, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { fontSize: 80, marginBottom: 20 },
  successTitle: { color: colors.dark.text, fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  successDesc: { color: colors.dark.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  successBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  successBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AdvertiserScreen;
