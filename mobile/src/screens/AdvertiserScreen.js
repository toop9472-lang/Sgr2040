// Advertiser Screen - Submit ads for advertisers
import React, { useState } from 'react';
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
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const AD_PACKAGES = [
  { id: 'ad_1_month', name: 'شهر واحد', duration: 1, price: 99, features: ['1000 مشاهدة مضمونة', 'تقرير أسبوعي'] },
  { id: 'ad_3_months', name: '3 أشهر', duration: 3, price: 249, features: ['5000 مشاهدة مضمونة', 'تقرير يومي', 'أولوية'], popular: true },
  { id: 'ad_6_months', name: '6 أشهر', duration: 6, price: 449, features: ['15000 مشاهدة مضمونة', 'تقرير مفصل', 'دعم مخصص'] },
];

const AdvertiserScreen = () => {
  const [step, setStep] = useState(1); // 1: package, 2: form, 3: success
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    title: '',
    description: '',
  });

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
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>تم إرسال إعلانك!</Text>
        <Text style={styles.successDesc}>سيتم مراجعة إعلانك وتفعيله خلال 24 ساعة. سنتواصل معك عبر البريد الإلكتروني.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={resetForm}>
          <Text style={styles.successBtnText}>إنشاء إعلان جديد</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>أعلن معنا 📢</Text>
        <Text style={styles.pageSubtitle}>وصل إعلانك لآلاف المستخدمين النشطين</Text>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
        </View>

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>اختر الباقة المناسبة</Text>
            {AD_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selectedPackage?.id === pkg.id && styles.packageCardSelected,
                  pkg.popular && styles.packageCardPopular,
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>الأكثر شعبية</Text>
                  </View>
                )}
                <View style={styles.packageHeader}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packagePrice}>{pkg.price} SAR</Text>
                </View>
                <View style={styles.packageFeatures}>
                  {pkg.features.map((f, i) => (
                    <Text key={i} style={styles.packageFeature}>✓ {f}</Text>
                  ))}
                </View>
                {selectedPackage?.id === pkg.id && (
                  <View style={styles.selectedCheck}>
                    <Text style={styles.selectedCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextBtn, !selectedPackage && styles.nextBtnDisabled]}
              onPress={() => selectedPackage && setStep(2)}
              disabled={!selectedPackage}
            >
              <Text style={styles.nextBtnText}>التالي</Text>
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
