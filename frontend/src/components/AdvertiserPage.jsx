import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, AlertCircle, CreditCard, Building2, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdvertiserPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: form, 2: payment method, 3: processing, 4: success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adData, setAdData] = useState({
    advertiser_name: '',
    advertiser_email: '',
    advertiser_phone: '',
    website_url: '',
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
  const [packages, setPackages] = useState([]);
  const [tapAvailable, setTapAvailable] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('ad_1_month');

  // Load pricing packages and check Tap availability on mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/payments/packages`);
        const data = await response.json();
        setPackages(data.packages);
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    
    const checkTapStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tap/status`);
        const data = await response.json();
        setTapAvailable(data.configured);
      } catch (error) {
        console.error('Failed to check Tap status:', error);
      }
    };
    
    loadPackages();
    checkTapStatus();
  }, []);

  // Check for payment return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const chargeId = urlParams.get('charge_id');
    const provider = urlParams.get('provider');
    
    if (sessionId) {
      // Stripe payment
      pollPaymentStatus(sessionId);
    } else if (chargeId && provider === 'tap') {
      // Tap payment
      pollTapPaymentStatus(chargeId);
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast({
        title: '⚠️ انتهت المهلة',
        description: 'يرجى التحقق من بريدك الإلكتروني للتأكيد',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStep(4);
        setCreatedAd({ ad: { id: data.ad_id } });
        toast({
          title: '✅ تم الدفع بنجاح!',
          description: 'سيتم مراجعة إعلانك وتفعيله قريباً',
        });
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (data.status === 'expired') {
        toast({
          title: '❌ انتهت صلاحية جلسة الدفع',
          description: 'يرجى المحاولة مرة أخرى',
          variant: 'destructive'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Continue polling
      setStep(3);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  // Poll Tap payment status
  const pollTapPaymentStatus = async (chargeId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast({
        title: '⚠️ انتهت المهلة',
        description: 'يرجى التحقق من بريدك الإلكتروني للتأكيد',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tap/status/${chargeId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStep(4);
        setCreatedAd({ ad: { id: data.ad_id } });
        toast({
          title: '✅ تم الدفع بنجاح!',
          description: 'سيتم مراجعة إعلانك وتفعيله قريباً',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (data.payment_status === 'failed') {
        toast({
          title: '❌ فشل الدفع',
          description: 'يرجى المحاولة مرة أخرى',
          variant: 'destructive'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setStep(3);
      setTimeout(() => pollTapPaymentStatus(chargeId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking Tap payment status:', error);
    }
  };

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
      const response = await fetch(`${API_URL}/api/advertiser/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData)
      });

      if (!response.ok) {
        throw new Error('Failed to create ad');
      }

      const data = await response.json();
      setCreatedAd(data);
      setStep(2);
      
      toast({
        title: '✅ تم إنشاء الإعلان',
        description: 'الآن اختر طريقة الدفع',
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

  const handleStripePayment = async () => {
    if (!createdAd?.ad?.id) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى إنشاء الإعلان أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          ad_id: createdAd.ad.id,
          origin_url: window.location.origin,
          advertiser_email: adData.advertiser_email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: '❌ خطأ في الدفع',
        description: 'فشل إنشاء جلسة الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTapPayment = async () => {
    if (!createdAd?.ad?.id) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى إنشاء الإعلان أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/tap/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          ad_id: createdAd.ad.id,
          origin_url: window.location.origin,
          advertiser_email: adData.advertiser_email,
          advertiser_name: adData.advertiser_name,
          advertiser_phone: adData.advertiser_phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create Tap checkout');
      }

      const data = await response.json();
      
      // Redirect to Tap Checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Tap payment error:', error);
      toast({
        title: '❌ خطأ في الدفع',
        description: error.message || 'فشل إنشاء جلسة الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch(`${API_URL}/api/advertiser/ads/${createdAd.ad.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          payment_proof: paymentProof
        })
      });
      
      setStep(4);
      
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

  const getCurrentPackage = () => {
    return packages.find(p => p.id === selectedPackage) || packages[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-16 rounded-b-3xl shadow-lg">
        <button
          onClick={() => onNavigate('home')}
          className="text-white mb-4 flex items-center gap-2 hover:underline"
          data-testid="back-btn"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <h1 className="text-white text-2xl font-bold">أضف إعلانك</h1>
        <p className="text-white/80 mt-2">وصّل إعلانك لآلاف المستخدمين</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Pricing Packages */}
        {packages.length > 0 && step === 1 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">اختر باقتك</h3>
              <div className="grid grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      setAdData({ ...adData, duration_months: pkg.duration_months });
                    }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-green-600 bg-green-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{pkg.amount}</p>
                      <p className="text-sm text-gray-600">ريال</p>
                      <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    data-testid="advertiser-name-input"
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
                    data-testid="advertiser-email-input"
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
                    data-testid="advertiser-phone-input"
                  />
                </div>

                <div>
                  <Label htmlFor="website_url">رابط موقعك (اختياري)</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    type="url"
                    value={adData.website_url}
                    onChange={handleInputChange}
                    placeholder="https://www.yourwebsite.com"
                    data-testid="website-url-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيظهر زر "زيارة" للمستخدمين عند مشاهدة إعلانك
                  </p>
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
                    data-testid="ad-title-input"
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
                    data-testid="ad-description-input"
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
                    data-testid="video-url-input"
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
                    data-testid="thumbnail-url-input"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>المبلغ الإجمالي:</strong> {getCurrentPackage()?.amount || 500} ريال
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                  data-testid="submit-ad-btn"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'متابعة للدفع'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 2 && createdAd && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>اختر طريقة الدفع</CardTitle>
              <CardDescription>
                المبلغ المطلوب: <strong>{getCurrentPackage()?.amount || createdAd.payment.amount} ريال</strong>
                {getCurrentPackage()?.duration_months > 1 && (
                  <span className="text-green-600 text-sm mr-2">
                    (خصم {getCurrentPackage()?.duration_months === 3 ? '10%' : 
                           getCurrentPackage()?.duration_months === 6 ? '20%' : 
                           getCurrentPackage()?.duration_months === 12 ? '30%' : ''})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stripe Payment Option */}
              <div 
                className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 cursor-pointer hover:border-indigo-400 transition-all"
                onClick={handleStripePayment}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                    <CreditCard className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">الدفع ببطاقة الائتمان (عالمي)</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard, Apple Pay, Google Pay</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">فوري</span>
                </div>
                <Button
                  onClick={handleStripePayment}
                  disabled={isSubmitting}
                  className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="stripe-pay-btn"
                >
                  {isSubmitting ? 'جاري التحويل...' : 'ادفع الآن عبر Stripe'}
                </Button>
              </div>

              {/* Tap Payment Option - Saudi Local */}
              {tapAvailable && (
                <div 
                  className="p-4 rounded-lg border-2 border-green-200 bg-green-50 cursor-pointer hover:border-green-400 transition-all"
                  onClick={handleTapPayment}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <Smartphone className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">الدفع المحلي (السعودية)</h4>
                      <p className="text-sm text-gray-600">mada, Apple Pay, STC Pay</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">محلي</span>
                  </div>
                  <Button
                    onClick={handleTapPayment}
                    disabled={isSubmitting}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="tap-pay-btn"
                  >
                    {isSubmitting ? 'جاري التحويل...' : 'ادفع الآن عبر Tap'}
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">أو</span>
                </div>
              </div>

              {/* Manual Payment Options */}
              <form onSubmit={handleManualPayment} className="space-y-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="text-gray-600" size={24} />
                    <h4 className="font-bold text-gray-800">التحويل البنكي أو STC Pay</h4>
                  </div>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {[
                        { id: 'bank', name: 'تحويل بنكي', icon: '🏦' },
                        { id: 'stcpay', name: 'STC Pay', icon: '📱' }
                      ].map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-reverse space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
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
                            <span className="text-xl">{method.icon}</span>
                            <span className="font-medium">{method.name}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {paymentMethod && (
                    <>
                      <div className="mt-4">
                        <Label htmlFor="payment_proof">رقم التحويل أو إثبات الدفع</Label>
                        <Input
                          id="payment_proof"
                          value={paymentProof}
                          onChange={(e) => setPaymentProof(e.target.value)}
                          required
                          placeholder="أدخل رقم التحويل أو رابط إثبات الدفع"
                          data-testid="payment-proof-input"
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 flex items-start gap-3">
                        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-yellow-900">
                          <p className="font-semibold mb-1">معلومات التحويل:</p>
                          <p>البنك: الراجحي</p>
                          <p>رقم الحساب: SA1234567890</p>
                          <p>اسم المستفيد: شركة صقر</p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !paymentProof}
                        className="w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white"
                        data-testid="manual-pay-btn"
                      >
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال إثبات الدفع'}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
                <CreditCard className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">جاري معالجة الدفع...</h2>
              <p className="text-gray-600">يرجى الانتظار</p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">تم بنجاح!</h2>
              <p className="text-gray-600 mb-6">
                تم إرسال طلب إعلانك بنجاح. سيتم مراجعته والموافقة عليه خلال 24 ساعة.
              </p>
              <div className="space-y-2 text-sm text-gray-700 text-right bg-white rounded-lg p-4 mb-6">
                <p><strong>رقم الطلب:</strong> {createdAd?.ad?.id}</p>
                <p><strong>العنوان:</strong> {adData.title}</p>
                <p><strong>المبلغ:</strong> {createdAd?.payment?.amount || getCurrentPackage()?.amount} ريال</p>
                <p><strong>الحالة:</strong> قيد المراجعة</p>
              </div>
              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                data-testid="go-home-btn"
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
