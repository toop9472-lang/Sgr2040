import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '../hooks/use-toast';
import { 
  Key, CreditCard, Shield, Eye, EyeOff, Save, RefreshCw, 
  AlertTriangle, Settings, Wrench, Globe, Phone, Mail,
  Users, DollarSign, TrendingUp, Activity, Power, Ban,
  MessageSquare, Link, Clock, Wallet
} from 'lucide-react';
import axios from 'axios';
import AdminWallet from './AdminWallet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Payment Gateway Settings
  const [paymentSettings, setPaymentSettings] = useState({
    stripe_enabled: true,
    stripe_api_key: '',
    tap_enabled: false,
    tap_api_key: '',
    tabby_enabled: false,
    tabby_api_key: '',
    tamara_enabled: false,
    tamara_api_key: '',
    stcpay_enabled: false,
    stcpay_api_key: '',
    paypal_enabled: false,
    paypal_client_id: '',
    paypal_secret: ''
  });
  
  // OAuth Settings
  const [oauthSettings, setOauthSettings] = useState({
    google_enabled: true,
    apple_enabled: false
  });
  
  // App Settings
  const [appSettings, setAppSettings] = useState({
    maintenance_mode: false,
    maintenance_message: 'التطبيق تحت الصيانة، سنعود قريباً',
    maintenance_message_en: 'App is under maintenance, we\'ll be back soon',
    allow_new_registrations: true,
    allow_withdrawals: true,
    allow_ad_submissions: true,
    min_withdrawal_points: 500,
    points_per_minute: 1,
    ad_price_per_month: 500,
    max_ads_per_10min: 5,
    min_watch_seconds: 30,
    contact_email: '',
    contact_phone: '',
    support_whatsapp: '',
    terms_url: '',
    privacy_url: ''
  });
  
  // Emergency Settings
  const [emergencySettings, setEmergencySettings] = useState({
    pause_all_payments: false,
    pause_all_withdrawals: false,
    block_all_logins: false,
    emergency_message: '',
    show_emergency_banner: false
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      const [paymentRes, oauthRes, appRes, emergencyRes, statsRes] = await Promise.all([
        axios.get(`${API}/settings/payment-gateways`, { headers }),
        axios.get(`${API}/settings/oauth`, { headers }),
        axios.get(`${API}/settings/app`, { headers }).catch(() => ({ data: appSettings })),
        axios.get(`${API}/settings/emergency`, { headers }).catch(() => ({ data: emergencySettings })),
        axios.get(`${API}/settings/dashboard/stats`, { headers }).catch(() => ({ data: null }))
      ]);

      setPaymentSettings(paymentRes.data);
      setOauthSettings(oauthRes.data);
      setAppSettings({ ...appSettings, ...appRes.data });
      setEmergencySettings({ ...emergencySettings, ...emergencyRes.data });
      setDashboardStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (type, data, endpoint) => {
    try {
      setIsSaving(true);
      const headers = getAuthHeaders();
      await axios.put(`${API}/settings/${endpoint}`, data, { headers });
      toast({ title: '✅ تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
      loadAllSettings();
    } catch (error) {
      toast({ title: '❌ خطأ', description: 'فشل حفظ الإعدادات', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMaintenance = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`${API}/settings/maintenance/toggle`, {}, { headers });
      setAppSettings(prev => ({ ...prev, maintenance_mode: res.data.maintenance_mode }));
      toast({
        title: res.data.maintenance_mode ? '🔧 تم تفعيل وضع الصيانة' : '✅ تم إلغاء وضع الصيانة',
        description: res.data.message
      });
    } catch (error) {
      toast({ title: '❌ خطأ', variant: 'destructive' });
    }
  };

  const toggleShowKey = (key) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 h-auto p-2 bg-gray-100 rounded-lg mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" /> لوحة البيانات
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1 text-xs">
            <Wrench className="w-3 h-3" /> الصيانة
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1 text-xs">
            <CreditCard className="w-3 h-3" /> بوابات الدفع
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-1 text-xs">
            <Shield className="w-3 h-3" /> تسجيل الدخول
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-1 text-xs">
            <Settings className="w-3 h-3" /> إعدادات التطبيق
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3" /> الطوارئ
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-4">
                <Users className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{dashboardStats?.users?.total || 0}</p>
                <p className="text-xs opacity-80">إجمالي المستخدمين</p>
                <p className="text-xs mt-1">+{dashboardStats?.users?.new_today || 0} اليوم</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-4">
                <DollarSign className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{dashboardStats?.financials?.total_revenue || 0}</p>
                <p className="text-xs opacity-80">الإيرادات (ر.س)</p>
                <p className="text-xs mt-1">صافي: {dashboardStats?.financials?.net_profit || 0}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-4">
                <Activity className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{dashboardStats?.ads?.active || 0}</p>
                <p className="text-xs opacity-80">إعلانات نشطة</p>
                <p className="text-xs mt-1">{dashboardStats?.ads?.pending || 0} معلقة</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="pt-4">
                <Clock className="w-6 h-6 mb-2 opacity-80" />
                <p className="text-2xl font-bold">{dashboardStats?.withdrawals?.pending || 0}</p>
                <p className="text-xs opacity-80">طلبات سحب معلقة</p>
                <p className="text-xs mt-1">{dashboardStats?.withdrawals?.approved || 0} مكتملة</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>ملخص سريع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">إجمالي النقاط الموزعة</p>
                  <p className="text-xl font-bold text-indigo-600">{dashboardStats?.financials?.total_points_distributed || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">المدفوعات للمستخدمين</p>
                  <p className="text-xl font-bold text-red-600">${dashboardStats?.financials?.total_payouts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card className={appSettings.maintenance_mode ? 'border-2 border-orange-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                وضع الصيانة
              </CardTitle>
              <CardDescription>
                عند تفعيل وضع الصيانة، سيرى المستخدمون رسالة الصيانة ولن يتمكنوا من استخدام التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-6 rounded-lg text-center ${appSettings.maintenance_mode ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${appSettings.maintenance_mode ? 'bg-orange-500' : 'bg-gray-400'}`}>
                  <Power className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {appSettings.maintenance_mode ? '🔧 وضع الصيانة مفعّل' : '✅ التطبيق يعمل بشكل طبيعي'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {appSettings.maintenance_mode ? 'المستخدمون لا يمكنهم الوصول للتطبيق حالياً' : 'جميع الخدمات تعمل بشكل طبيعي'}
                </p>
                <Button
                  onClick={toggleMaintenance}
                  className={appSettings.maintenance_mode ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
                  size="lg"
                >
                  {appSettings.maintenance_mode ? '✅ إلغاء وضع الصيانة' : '🔧 تفعيل وضع الصيانة'}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label>رسالة الصيانة (عربي)</Label>
                  <Input
                    value={appSettings.maintenance_message}
                    onChange={(e) => setAppSettings(prev => ({ ...prev, maintenance_message: e.target.value }))}
                    placeholder="التطبيق تحت الصيانة..."
                  />
                </div>
                <div>
                  <Label>Maintenance Message (English)</Label>
                  <Input
                    value={appSettings.maintenance_message_en}
                    onChange={(e) => setAppSettings(prev => ({ ...prev, maintenance_message_en: e.target.value }))}
                    placeholder="App is under maintenance..."
                    dir="ltr"
                  />
                </div>
                <Button onClick={() => saveSettings('app', appSettings, 'app')} disabled={isSaving}>
                  <Save className="w-4 h-4 ml-2" /> حفظ رسالة الصيانة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Gateways Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> بوابات الدفع
              </CardTitle>
              <CardDescription>إدارة مفاتيح API لبوابات الدفع المختلفة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'stripe', name: 'Stripe (عالمي)', color: 'indigo' },
                  { id: 'tap', name: 'Tap (محلي)', color: 'green' },
                  { id: 'tabby', name: 'Tabby', color: 'blue' },
                  { id: 'tamara', name: 'Tamara', color: 'purple' },
                  { id: 'stcpay', name: 'STC Pay', color: 'violet' }
                ].map(gateway => (
                  <div key={gateway.id} className={`p-4 rounded-lg border-2 ${paymentSettings[`${gateway.id}_enabled`] ? `border-${gateway.color}-200 bg-${gateway.color}-50` : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">{gateway.name}</span>
                      <Switch
                        checked={paymentSettings[`${gateway.id}_enabled`]}
                        onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, [`${gateway.id}_enabled`]: checked }))}
                      />
                    </div>
                    {paymentSettings[`${gateway.id}_enabled`] && (
                      <div className="relative">
                        <Input
                          type={showKeys[gateway.id] ? 'text' : 'password'}
                          value={paymentSettings[`${gateway.id}_api_key`]}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, [`${gateway.id}_api_key`]: e.target.value }))}
                          placeholder="مفتاح API"
                          className="pl-10"
                        />
                        <button onClick={() => toggleShowKey(gateway.id)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showKeys[gateway.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* PayPal Special */}
                <div className={`p-4 rounded-lg border-2 ${paymentSettings.paypal_enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">PayPal</span>
                    <Switch
                      checked={paymentSettings.paypal_enabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, paypal_enabled: checked }))}
                    />
                  </div>
                  {paymentSettings.paypal_enabled && (
                    <div className="space-y-2">
                      <Input
                        type={showKeys['paypal_id'] ? 'text' : 'password'}
                        value={paymentSettings.paypal_client_id}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, paypal_client_id: e.target.value }))}
                        placeholder="Client ID"
                      />
                      <Input
                        type={showKeys['paypal_secret'] ? 'text' : 'password'}
                        value={paymentSettings.paypal_secret}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, paypal_secret: e.target.value }))}
                        placeholder="Secret"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <Button onClick={() => saveSettings('payments', paymentSettings, 'payment-gateways')} disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 ml-2" /> حفظ إعدادات الدفع
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> تسجيل الدخول الاجتماعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border-2 ${oauthSettings.google_enabled ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${oauthSettings.google_enabled ? 'bg-red-500' : 'bg-gray-400'}`}>
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Google</p>
                        <p className="text-xs text-gray-500">تسجيل الدخول بواسطة Google</p>
                      </div>
                    </div>
                    <Switch
                      checked={oauthSettings.google_enabled}
                      onCheckedChange={(checked) => setOauthSettings(prev => ({ ...prev, google_enabled: checked }))}
                    />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border-2 ${oauthSettings.apple_enabled ? 'border-gray-800 bg-gray-100' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${oauthSettings.apple_enabled ? 'bg-black' : 'bg-gray-400'}`}>
                        <span className="text-white text-lg"></span>
                      </div>
                      <div>
                        <p className="font-semibold">Apple</p>
                        <p className="text-xs text-gray-500">تسجيل الدخول بواسطة Apple</p>
                      </div>
                    </div>
                    <Switch
                      checked={oauthSettings.apple_enabled}
                      onCheckedChange={(checked) => setOauthSettings(prev => ({ ...prev, apple_enabled: checked }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={() => saveSettings('oauth', oauthSettings, 'oauth')} disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 ml-2" /> حفظ إعدادات تسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings Tab */}
        <TabsContent value="app">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التحكم في الميزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>السماح بالتسجيل الجديد</span>
                    <Switch
                      checked={appSettings.allow_new_registrations}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, allow_new_registrations: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>السماح بالسحوبات</span>
                    <Switch
                      checked={appSettings.allow_withdrawals}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, allow_withdrawals: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>السماح بإضافة إعلانات</span>
                    <Switch
                      checked={appSettings.allow_ad_submissions}
                      onCheckedChange={(checked) => setAppSettings(prev => ({ ...prev, allow_ad_submissions: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النقاط والأسعار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>الحد الأدنى للسحب (نقطة)</Label>
                    <Input
                      type="number"
                      value={appSettings.min_withdrawal_points}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, min_withdrawal_points: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>نقاط لكل دقيقة</Label>
                    <Input
                      type="number"
                      value={appSettings.points_per_minute}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, points_per_minute: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>سعر الإعلان الشهري (ر.س)</Label>
                    <Input
                      type="number"
                      value={appSettings.ad_price_per_month}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, ad_price_per_month: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>أقصى إعلانات/10 دقائق</Label>
                    <Input
                      type="number"
                      value={appSettings.max_ads_per_10min}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, max_ads_per_10min: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> البريد الإلكتروني</Label>
                    <Input
                      value={appSettings.contact_email}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="support@saqr.app"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> رقم الهاتف</Label>
                    <Input
                      value={appSettings.contact_phone}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+966..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</Label>
                    <Input
                      value={appSettings.support_whatsapp}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, support_whatsapp: e.target.value }))}
                      placeholder="+966..."
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="flex items-center gap-1"><Link className="w-3 h-3" /> رابط الشروط والأحكام</Label>
                    <Input
                      value={appSettings.terms_url}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, terms_url: e.target.value }))}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Link className="w-3 h-3" /> رابط سياسة الخصوصية</Label>
                    <Input
                      value={appSettings.privacy_url}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, privacy_url: e.target.value }))}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button onClick={() => saveSettings('app', appSettings, 'app')} disabled={isSaving} className="w-full">
              <Save className="w-4 h-4 ml-2" /> حفظ إعدادات التطبيق
            </Button>
          </div>
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency">
          <Card className="border-2 border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" /> خيارات الطوارئ
              </CardTitle>
              <CardDescription className="text-red-600">
                استخدم هذه الخيارات فقط في حالات الطوارئ - ستؤثر على جميع المستخدمين فوراً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border-2 ${emergencySettings.pause_all_payments ? 'border-red-500 bg-red-100' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span className="font-medium">إيقاف جميع المدفوعات</span>
                    </div>
                    <Switch
                      checked={emergencySettings.pause_all_payments}
                      onCheckedChange={(checked) => setEmergencySettings(prev => ({ ...prev, pause_all_payments: checked }))}
                    />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border-2 ${emergencySettings.pause_all_withdrawals ? 'border-red-500 bg-red-100' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span className="font-medium">إيقاف جميع السحوبات</span>
                    </div>
                    <Switch
                      checked={emergencySettings.pause_all_withdrawals}
                      onCheckedChange={(checked) => setEmergencySettings(prev => ({ ...prev, pause_all_withdrawals: checked }))}
                    />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border-2 ${emergencySettings.block_all_logins ? 'border-red-500 bg-red-100' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span className="font-medium">منع تسجيل الدخول</span>
                    </div>
                    <Switch
                      checked={emergencySettings.block_all_logins}
                      onCheckedChange={(checked) => setEmergencySettings(prev => ({ ...prev, block_all_logins: checked }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${emergencySettings.show_emergency_banner ? 'border-orange-500 bg-orange-100' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">عرض رسالة طوارئ للمستخدمين</span>
                  </div>
                  <Switch
                    checked={emergencySettings.show_emergency_banner}
                    onCheckedChange={(checked) => setEmergencySettings(prev => ({ ...prev, show_emergency_banner: checked }))}
                  />
                </div>
                {emergencySettings.show_emergency_banner && (
                  <Input
                    value={emergencySettings.emergency_message}
                    onChange={(e) => setEmergencySettings(prev => ({ ...prev, emergency_message: e.target.value }))}
                    placeholder="اكتب رسالة الطوارئ هنا..."
                    className="mt-2"
                  />
                )}
              </div>
              
              <Button 
                onClick={() => saveSettings('emergency', emergencySettings, 'emergency')} 
                disabled={isSaving} 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Save className="w-4 h-4 ml-2" /> حفظ إعدادات الطوارئ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
