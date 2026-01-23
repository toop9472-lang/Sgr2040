import React, { useState } from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from '../hooks/use-toast';
import { withdrawMethods } from '../mockData';

const WithdrawPage = ({ user, onNavigate, onWithdrawRequest }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDollars = Math.floor(user.points / 500);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
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
      setIsSubmitting(false);
      return;
    }

    // Submit withdrawal request
    const request = {
      id: 'req_' + Date.now(),
      userId: user.id,
      amount: amount,
      points: amount * 500,
      method: selectedMethod,
      methodName: method.name,
      details: formData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onWithdrawRequest(request);

    toast({
      title: '✅ تم إرسال الطلب',
      description: 'سيتم مراجعة طلبك والرد عليك قريباً',
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onNavigate('profile');
    }, 1500);
  };

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
        <h1 className="text-white text-2xl font-bold">استبدال النقاط</h1>
        <p className="text-white/80 mt-2">اختر طريقة السحب وأدخل بياناتك</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Available Balance */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">الرصيد المتاح</p>
              <div className="text-4xl font-bold text-green-600 mb-1">
                ${availableDollars}
              </div>
              <p className="text-sm text-gray-600">
                ({user.points} نقطة)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Amount Selection */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg">المبلغ للسحب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount">المبلغ (بالدولار)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={availableDollars}
                  value={amount}
                  onChange={(e) => setAmount(Math.min(availableDollars, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="text-lg font-semibold"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>{amount * 500}</strong> نقطة = <strong>${amount}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Methods */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg">طريقة السحب</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-3">
                {withdrawMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex items-center space-x-reverse space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedMethod === method.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className="flex-1 cursor-pointer flex items-center gap-3"
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-xs text-gray-600">الحد الأدنى: ${method.minAmount}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Method Details Form */}
        {selectedMethod && (
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-lg">بيانات الحساب</CardTitle>
              <CardDescription>
                أدخل بياناتك بدقة لضمان وصول المبلغ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {withdrawMethods
                  .find(m => m.id === selectedMethod)
                  .fields.map((field) => (
                    <div key={field.name}>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-red-500 mr-1">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        className="mt-1"
                        placeholder={field.label}
                      />
                    </div>
                  ))}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-yellow-900">
                    سيتم مراجعة طلبك خلال 24-48 ساعة. لن يتم خصم النقاط إلا بعد موافقة الإدارة.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedMethod}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check size={20} />
                      إرسال طلب السحب
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;