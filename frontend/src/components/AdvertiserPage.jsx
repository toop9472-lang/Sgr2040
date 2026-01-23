import React, { useState } from 'react';
import { ArrowRight, Upload, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvertiserPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: form, 2: payment, 3: success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adData, setAdData] = useState({
    advertiser_name: '',
    advertiser_email: '',
    advertiser_phone: '',
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 60,
    duration_months: 1
  });
  const [createdAd, setCreatedAd] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [pricing, setPricing] = useState({
    price_per_month: 500,
    currency: 'SAR',
    features: [
      'عرض إعلانك لجميع المستخدمين',
      'إحصائيات مشاهدة مفصلة',
      'مدة شهر كامل',
      'دعم فني كامل'
    ],
    payment_methods: [
      { id: 'bank', name: 'تحويل بنكي', icon: '🏦' },
      { id: 'stcpay', name: 'STC Pay', icon: '📱' },
      { id: 'cash', name: 'نقدي', icon: '💵' }
    ]
  });

  // Load pricing on mount
  React.useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await axios.get(`${API}/advertiser/pricing`);
        setPricing(response.data);
      } catch (error) {
        console.error('Failed to load pricing:', error);
        // Keep default pricing data
      }
    };
    loadPricing();
  }, []);

  const handleInputChange = (e) => {
    setAdData({
      ...adData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API}/advertiser/ads`, adData);
      setCreatedAd(response.data);
      setStep(2);
      
      toast({
        title: '✅ تم إنشاء الإعلان',
        description: response.data.message,
      });
    } catch (error) {
      console.error('Failed to create ad:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل إنشاء الإعلان. يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/advertiser/ads/${createdAd.ad.id}/payment`, {
        payment_method: paymentMethod,
        payment_proof: paymentProof
      });
      
      setStep(3);
      
      toast({
        title: '✅ تم إرسال إثبات الدفع',
        description: 'سيتم مراجعة إعلانك والموافقة عليه قريباً',
      });
    } catch (error) {
      console.error('Failed to submit payment:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل إرسال إثبات الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-16 rounded-b-3xl shadow-lg">
        <button
          onClick={() => onNavigate('home')}
          className="text-white mb-4 flex items-center gap-2 hover:underline"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <h1 className="text-white text-2xl font-bold">أضف إعلانك</h1>
        <p className="text-white/80 mt-2">وصّل إعلانك لآلاف المستخدمين</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Pricing Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={32} />
                <div className="text-4xl font-bold text-green-600">
                  {pricing.price_per_month}
                </div>
                <span className="text-xl text-gray-600">ريال</span>
              </div>
              <p className="text-sm text-gray-600">لمدة شهر كامل</p>
            </div>
            
            <div className="mt-4 space-y-2">
              {pricing.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="text-green-600 flex-shrink-0" size={16} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Ad Form */}
        {step === 1 && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>تفاصيل الإعلان</CardTitle>
              <CardDescription>أدخل معلومات إعلانك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAd} className="space-y-4">
                <div>
                  <Label htmlFor="advertiser_name">اسم المعلن *</Label>
                  <Input
                    id="advertiser_name"
                    name="advertiser_name"
                    value={adData.advertiser_name}
                    onChange={handleInputChange}
                    required
                    placeholder="اسم شركتك أو علامتك التجارية"
                  />
                </div>

                <div>
                  <Label htmlFor="advertiser_email">البريد الإلكتروني *</Label>
                  <Input
                    id="advertiser_email"
                    name="advertiser_email"
                    type="email"
                    value={adData.advertiser_email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="advertiser_phone">رقم الجوال</Label>
                  <Input
                    id="advertiser_phone"
                    name="advertiser_phone"
                    type="tel"
                    value={adData.advertiser_phone}
                    onChange={handleInputChange}
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="title">عنوان الإعلان *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={adData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="عنوان جذاب لإعلانك"
                  />
                </div>

                <div>
                  <Label htmlFor="description">وصف الإعلان *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={adData.description}
                    onChange={handleInputChange}
                    required
                    placeholder="اكتب وصفاً مختصراً لإعلانك"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="video_url">رابط الفيديو *</Label>
                  <Input
                    id="video_url"
                    name="video_url"
                    type="url"
                    value={adData.video_url}
                    onChange={handleInputChange}
                    required
                    placeholder="https://example.com/video.mp4"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    رابط مباشر للفيديو (MP4 أو رابط YouTube)
                  </p>
                </div>

                <div>
                  <Label htmlFor="thumbnail_url">رابط الصورة المصغرة</Label>
                  <Input
                    id="thumbnail_url"
                    name="thumbnail_url"
                    type="url"
                    value={adData.thumbnail_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="duration_months">المدة بالأشهر</Label>
                  <select
                    id="duration_months"
                    name="duration_months"
                    value={adData.duration_months}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="1">شهر واحد - {pricing.price_per_month} ريال</option>
                    <option value="3">3 أشهر - {pricing.price_per_month * 3} ريال</option>
                    <option value="6">6 أشهر - {pricing.price_per_month * 6} ريال</option>
                    <option value="12">سنة كاملة - {pricing.price_per_month * 12} ريال</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>المبلغ الإجمالي:</strong> {pricing.price_per_month * adData.duration_months} ريال
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'متابعة للدفع'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment */}
        {step === 2 && createdAd && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>الدفع</CardTitle>
              <CardDescription>
                المبلغ المطلوب: <strong>{createdAd.payment.amount} ريال</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <Label>طريقة الدفع</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3 mt-2">
                      {pricing.payment_methods.map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-reverse space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            paymentMethod === method.id
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label
                            htmlFor={method.id}
                            className="flex-1 cursor-pointer flex items-center gap-3"
                          >
                            <span className="text-2xl">{method.icon}</span>
                            <span className="font-semibold">{method.name}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="payment_proof">رقم التحويل أو إثبات الدفع</Label>
                  <Input
                    id="payment_proof"
                    value={paymentProof}
                    onChange={(e) => setPaymentProof(e.target.value)}
                    required
                    placeholder="أدخل رقم التحويل أو رابط إثبات الدفع"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيتم مراجعة الدفع والموافقة على الإعلان خلال 24 ساعة
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-1">معلومات التحويل البنكي:</p>
                    <p>البنك: الراجحي</p>
                    <p>رقم الحساب: SA1234567890</p>
                    <p>اسم المستفيد: شركة صقر للإعلانات</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !paymentMethod}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال إثبات الدفع'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h2>
              <p className="text-gray-600 mb-6">
                تم إرسال طلب إعلانك وإثبات الدفع بنجاح. سيتم مراجعته والموافقة عليه خلال 24 ساعة.
              </p>
              <div className="space-y-2 text-sm text-gray-700 text-right bg-white rounded-lg p-4 mb-6">
                <p><strong>رقم الطلب:</strong> {createdAd?.ad.id}</p>
                <p><strong>العنوان:</strong> {adData.title}</p>
                <p><strong>المبلغ:</strong> {createdAd?.payment.amount} ريال</p>
                <p><strong>الحالة:</strong> قيد المراجعة</p>
              </div>
              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
              >
                العودة للرئيسية
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvertiserPage;