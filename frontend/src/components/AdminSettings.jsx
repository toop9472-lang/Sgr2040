import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from '../hooks/use-toast';
import { Key, CreditCard, Shield, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      const [paymentRes, oauthRes] = await Promise.all([
        axios.get(`${API}/settings/payment-gateways`, { headers }),
        axios.get(`${API}/settings/oauth`, { headers })
      ]);

      setPaymentSettings(paymentRes.data);
      setOauthSettings(oauthRes.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل تحميل الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setIsSaving(true);
      const headers = getAuthHeaders();

      await axios.put(`${API}/settings/payment-gateways`, paymentSettings, { headers });

      toast({
        title: '✅ تم الحفظ',
        description: 'تم حفظ إعدادات بوابات الدفع بنجاح'
      });
      
      // Reload to get masked keys
      loadSettings();
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل حفظ الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveOAuthSettings = async () => {
    try {
      setIsSaving(true);
      const headers = getAuthHeaders();

      await axios.put(`${API}/settings/oauth`, oauthSettings, { headers });

      toast({
        title: '✅ تم الحفظ',
        description: 'تم حفظ إعدادات تسجيل الدخول بنجاح'
      });
    } catch (error) {
      console.error('Failed to save OAuth settings:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل حفظ الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShowKey = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePaymentChange = (field, value) => {
    setPaymentSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleOAuthChange = (field, value) => {
    setOauthSettings(prev => ({ ...prev, [field]: value }));
  };

  const PaymentGatewayCard = ({ id, name, icon, enabled, apiKeyField, apiKeyValue, secondaryField, secondaryValue }) => (
    <div className={`p-4 rounded-lg border-2 transition-all ${enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? 'bg-green-600' : 'bg-gray-400'}`}>
            {icon}
          </div>
          <span className="font-semibold text-gray-800">{name}</span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => handlePaymentChange(`${id}_enabled`, checked)}
        />
      </div>
      
      {enabled && (
        <div className="space-y-3 mt-4">
          <div>
            <Label htmlFor={apiKeyField} className="text-xs text-gray-600">
              مفتاح API
            </Label>
            <div className="relative">
              <Input
                id={apiKeyField}
                type={showKeys[apiKeyField] ? 'text' : 'password'}
                value={apiKeyValue}
                onChange={(e) => handlePaymentChange(apiKeyField, e.target.value)}
                placeholder="أدخل مفتاح API"
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(apiKeyField)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys[apiKeyField] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          {secondaryField && (
            <div>
              <Label htmlFor={secondaryField} className="text-xs text-gray-600">
                {secondaryField.includes('secret') ? 'المفتاح السري' : 'معرف العميل'}
              </Label>
              <div className="relative">
                <Input
                  id={secondaryField}
                  type={showKeys[secondaryField] ? 'text' : 'password'}
                  value={secondaryValue}
                  onChange={(e) => handlePaymentChange(secondaryField, e.target.value)}
                  placeholder="أدخل المفتاح"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(secondaryField)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[secondaryField] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Gateways Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            بوابات الدفع
          </CardTitle>
          <CardDescription>
            إدارة مفاتيح API لبوابات الدفع المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe */}
            <PaymentGatewayCard
              id="stripe"
              name="Stripe (عالمي)"
              icon={<CreditCard className="text-white" size={20} />}
              enabled={paymentSettings.stripe_enabled}
              apiKeyField="stripe_api_key"
              apiKeyValue={paymentSettings.stripe_api_key}
            />

            {/* Tap */}
            <PaymentGatewayCard
              id="tap"
              name="Tap (محلي)"
              icon={<span className="text-white font-bold text-xs">TAP</span>}
              enabled={paymentSettings.tap_enabled}
              apiKeyField="tap_api_key"
              apiKeyValue={paymentSettings.tap_api_key}
            />

            {/* Tabby */}
            <PaymentGatewayCard
              id="tabby"
              name="Tabby"
              icon={<span className="text-white font-bold text-xs">TB</span>}
              enabled={paymentSettings.tabby_enabled}
              apiKeyField="tabby_api_key"
              apiKeyValue={paymentSettings.tabby_api_key}
            />

            {/* Tamara */}
            <PaymentGatewayCard
              id="tamara"
              name="Tamara"
              icon={<span className="text-white font-bold text-xs">TM</span>}
              enabled={paymentSettings.tamara_enabled}
              apiKeyField="tamara_api_key"
              apiKeyValue={paymentSettings.tamara_api_key}
            />

            {/* STC Pay */}
            <PaymentGatewayCard
              id="stcpay"
              name="STC Pay"
              icon={<span className="text-white font-bold text-xs">STC</span>}
              enabled={paymentSettings.stcpay_enabled}
              apiKeyField="stcpay_api_key"
              apiKeyValue={paymentSettings.stcpay_api_key}
            />

            {/* PayPal */}
            <div className={`p-4 rounded-lg border-2 transition-all ${paymentSettings.paypal_enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentSettings.paypal_enabled ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    <span className="text-white font-bold text-xs">PP</span>
                  </div>
                  <span className="font-semibold text-gray-800">PayPal</span>
                </div>
                <Switch
                  checked={paymentSettings.paypal_enabled}
                  onCheckedChange={(checked) => handlePaymentChange('paypal_enabled', checked)}
                />
              </div>
              
              {paymentSettings.paypal_enabled && (
                <div className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="paypal_client_id" className="text-xs text-gray-600">
                      معرف العميل (Client ID)
                    </Label>
                    <div className="relative">
                      <Input
                        id="paypal_client_id"
                        type={showKeys['paypal_client_id'] ? 'text' : 'password'}
                        value={paymentSettings.paypal_client_id}
                        onChange={(e) => handlePaymentChange('paypal_client_id', e.target.value)}
                        placeholder="أدخل معرف العميل"
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('paypal_client_id')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys['paypal_client_id'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paypal_secret" className="text-xs text-gray-600">
                      المفتاح السري (Secret)
                    </Label>
                    <div className="relative">
                      <Input
                        id="paypal_secret"
                        type={showKeys['paypal_secret'] ? 'text' : 'password'}
                        value={paymentSettings.paypal_secret}
                        onChange={(e) => handlePaymentChange('paypal_secret', e.target.value)}
                        placeholder="أدخل المفتاح السري"
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('paypal_secret')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys['paypal_secret'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={savePaymentSettings}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ إعدادات الدفع
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OAuth Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            تسجيل الدخول الاجتماعي
          </CardTitle>
          <CardDescription>
            تفعيل أو تعطيل طرق تسجيل الدخول المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google */}
            <div className={`p-4 rounded-lg border-2 transition-all ${oauthSettings.google_enabled ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${oauthSettings.google_enabled ? 'bg-red-500' : 'bg-gray-400'}`}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Google</span>
                    <p className="text-xs text-gray-500">تسجيل الدخول بواسطة Google</p>
                  </div>
                </div>
                <Switch
                  checked={oauthSettings.google_enabled}
                  onCheckedChange={(checked) => handleOAuthChange('google_enabled', checked)}
                />
              </div>
            </div>

            {/* Apple */}
            <div className={`p-4 rounded-lg border-2 transition-all ${oauthSettings.apple_enabled ? 'border-gray-800 bg-gray-100' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${oauthSettings.apple_enabled ? 'bg-black' : 'bg-gray-400'}`}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Apple</span>
                    <p className="text-xs text-gray-500">تسجيل الدخول بواسطة Apple</p>
                  </div>
                </div>
                <Switch
                  checked={oauthSettings.apple_enabled}
                  onCheckedChange={(checked) => handleOAuthChange('apple_enabled', checked)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={saveOAuthSettings}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ إعدادات تسجيل الدخول
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">ملاحظة مهمة:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>المفاتيح المحفوظة تظهر مخفية (****) لأسباب أمنية</li>
                <li>لتحديث مفتاح، أدخل المفتاح الجديد كاملاً ثم اضغط حفظ</li>
                <li>تأكد من صحة المفاتيح قبل تفعيل بوابة الدفع</li>
                <li>بوابات الدفع المعطلة لن تظهر للمعلنين</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
