import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default withdraw methods (fallback if API fails)
const defaultWithdrawMethods = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    minAmount: 1,
    fields: [
      { name: 'email', label: 'البريد الإلكتروني لـ PayPal', type: 'email', required: true }
    ]
  },
  {
    id: 'stcpay',
    name: 'STC Pay',
    icon: '📱',
    minAmount: 1,
    fields: [
      { name: 'phone', label: 'رقم الجوال', type: 'tel', required: true }
    ]
  },
  {
    id: 'bank',
    name: 'تحويل بنكي',
    icon: '🏦',
    minAmount: 1,
    fields: [
      { name: 'bankName', label: 'اسم البنك', type: 'text', required: true },
      { name: 'accountName', label: 'اسم صاحب الحساب', type: 'text', required: true },
      { name: 'iban', label: 'رقم الآيبان', type: 'text', required: true }
    ]
  }
];

const WithdrawPage = ({ user, onNavigate, onWithdrawRequest }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawMethods, setWithdrawMethods] = useState(defaultWithdrawMethods);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const availableDollars = Math.floor((user?.points || 0) / 500);
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Load withdrawal methods from settings
      try {
        const methodsRes = await axios.get(`${API}/withdrawal-methods`, { headers });
        if (methodsRes.data.methods && methodsRes.data.methods.length > 0) {
          setWithdrawMethods(methodsRes.data.methods);
        }
      } catch (e) {
        console.log('Using default withdrawal methods');
      }
      
      // Load withdrawal history
      try {
        const historyRes = await axios.get(`${API}/withdrawals`, { headers });
        setWithdrawHistory(historyRes.data || []);
      } catch (e) {
        console.log('No withdrawal history');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || user.isGuest) {
      toast({
        title: '⚠️ تنبيه',
        description: 'يجب تسجيل الدخول لطلب سحب',
        variant: 'destructive'
      });
      return;
    }

    if (availableDollars < 1) {
      toast({
        title: '⚠️ رصيد غير كافي',
        description: 'تحتاج 500 نقطة على الأقل (= $1) للسحب',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedMethod) {
      toast({
        title: '⚠️ اختر طريقة السحب',
        description: 'الرجاء اختيار طريقة السحب',
        variant: 'destructive'
      });
      return;
    }

    const method = withdrawMethods.find(m => m.id === selectedMethod);
    const missingFields = method.fields.filter(field => 
      field.required && !formData[field.name]
    );

    if (missingFields.length > 0) {
      toast({
        title: '⚠️ خطأ',
        description: 'الرجاء إكمال جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    if (amount > availableDollars) {
      toast({
        title: '⚠️ مبلغ غير صالح',
        description: `الحد الأقصى للسحب هو $${availableDollars}`,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const headers = getAuthHeaders();
      
      const requestData = {
        amount: amount,
        method: selectedMethod,
        method_name: method.name,
        details: formData
      };

      const response = await axios.post(`${API}/withdrawals`, requestData, { headers });

      if (response.data.success) {
        toast({
          title: '✅ تم إرسال الطلب',
          description: 'سيتم مراجعة طلبك والرد عليك قريباً',
        });

        // Update local user state
        if (onWithdrawRequest) {
          onWithdrawRequest(response.data.withdrawal);
        }

        // Reset form
        setFormData({});
        setSelectedMethod(null);
        setAmount(1);

        // Reload data
        await loadData();

        setTimeout(() => {
          onNavigate('profile');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'فشل إرسال الطلب');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: '❌ خطأ',
        description: error.response?.data?.detail || error.message || 'فشل إرسال طلب السحب',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">تمت الموافقة</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">مرفوض</span>;
      case 'pending':
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">قيد المراجعة</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-16 rounded-b-3xl shadow-lg">
        <button
          onClick={() => onNavigate('profile')}
          className="text-white mb-4 flex items-center gap-2 hover:underline"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <h1 className="text-white text-2xl font-bold">سحب الأرباح</h1>
        <p className="text-white/80 mt-2">اختر طريقة السحب وأدخل بياناتك</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Available Balance */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">الرصيد المتاح للسحب</p>
              <div className="text-4xl font-bold text-green-600 mb-1">
                ${availableDollars}
              </div>
              <p className="text-sm text-gray-600">
                ({user?.points || 0} نقطة)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                500 نقطة = 1 دولار
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Minimum Balance Check */}
        {availableDollars < 1 && (
          <Card className="shadow-md border-0 border-r-4 border-r-orange-500 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-orange-500" size={24} />
                <div>
                  <p className="font-semibold text-orange-800">رصيد غير كافي</p>
                  <p className="text-sm text-orange-600">
                    تحتاج {500 - (user?.points || 0)} نقطة إضافية للسحب (الحد الأدنى $1)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {availableDollars >= 1 && (
          <>
            {/* Amount Selection */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg">المبلغ للسحب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAmount(Math.max(1, amount - 1))}
                      disabled={amount <= 1}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Math.min(availableDollars, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="text-center text-2xl font-bold"
                        min={1}
                        max={availableDollars}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        = {amount * 500} نقطة
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAmount(Math.min(availableDollars, amount + 1))}
                      disabled={amount >= availableDollars}
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant={amount === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(1)}
                    >
                      $1
                    </Button>
                    {availableDollars >= 5 && (
                      <Button
                        type="button"
                        variant={amount === 5 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAmount(5)}
                      >
                        $5
                      </Button>
                    )}
                    {availableDollars >= 10 && (
                      <Button
                        type="button"
                        variant={amount === 10 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAmount(10)}
                      >
                        $10
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={amount === availableDollars ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(availableDollars)}
                    >
                      الكل (${availableDollars})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg">طريقة السحب</CardTitle>
                <CardDescription>اختر طريقة استلام المبلغ</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedMethod || ''}
                  onValueChange={setSelectedMethod}
                  className="space-y-3"
                >
                  {withdrawMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedMethod === method.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <span className="text-2xl">{method.icon}</span>
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <span className="font-semibold">{method.name}</span>
                        <span className="text-xs text-gray-500 block">
                          الحد الأدنى: ${method.minAmount || 1}
                        </span>
                      </Label>
                      {selectedMethod === method.id && (
                        <Check className="text-indigo-600" size={20} />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Details Form */}
            {selectedMethod && (
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg">بيانات الحساب</CardTitle>
                  <CardDescription>أدخل بيانات حسابك لاستلام المبلغ</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {withdrawMethods
                      .find(m => m.id === selectedMethod)
                      ?.fields.map((field) => (
                        <div key={field.name}>
                          <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                          </Label>
                          <Input
                            id={field.name}
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              [field.name]: e.target.value
                            })}
                            placeholder={field.label}
                            required={field.required}
                            className="mt-1"
                            dir={field.type === 'email' || field.type === 'tel' ? 'ltr' : 'rtl'}
                          />
                        </div>
                      ))}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          تأكيد طلب السحب (${amount})
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Withdrawal History */}
        {withdrawHistory.length > 0 && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg">سجل السحوبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawHistory.slice(0, 5).map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">${withdrawal.amount}</p>
                      <p className="text-xs text-gray-500">{withdrawal.method_name}</p>
                    </div>
                    <div className="text-left">
                      {getStatusBadge(withdrawal.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(withdrawal.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="shadow-md border-0 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-blue-800">
              <p>• الحد الأدنى للسحب: $1 (500 نقطة)</p>
              <p>• يتم مراجعة الطلبات خلال 24-48 ساعة</p>
              <p>• تأكد من صحة بيانات الحساب</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WithdrawPage;
