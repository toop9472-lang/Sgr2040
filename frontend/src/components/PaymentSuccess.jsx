import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentData, setPaymentData] = useState(null);

  const pollPaymentStatus = useCallback(async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('failed');
      toast({
        title: '⚠️ انتهت المهلة',
        description: 'يرجى التواصل مع الدعم',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStatus('success');
        setPaymentData(data);
        toast({
          title: '✅ تم الدفع بنجاح!',
          description: 'سيتم مراجعة إعلانك وتفعيله قريباً',
        });
        return;
      } else if (data.status === 'expired' || data.payment_status === 'failed') {
        setStatus('failed');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (attempts >= 3) {
        setStatus('failed');
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      }
    }
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('failed');
    }
  }, [searchParams, pollPaymentStatus]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-spin" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">جاري التحقق من الدفع...</h2>
            <p className="text-gray-600">يرجى الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">فشل الدفع</h2>
            <p className="text-gray-600 mb-6">
              لم نتمكن من التحقق من الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
            >
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم الدفع بنجاح! 🎉</h2>
          <p className="text-gray-600 mb-6">
            شكراً لك! سيتم مراجعة إعلانك والموافقة عليه خلال 24 ساعة.
          </p>
          
          {paymentData && (
            <div className="space-y-2 text-sm text-gray-700 text-right bg-gray-50 rounded-lg p-4 mb-6">
              <p><strong>رقم الطلب:</strong> {paymentData.ad_id}</p>
              <p><strong>المبلغ:</strong> {paymentData.amount} {paymentData.currency?.toUpperCase()}</p>
              <p><strong>الحالة:</strong> <span className="text-green-600">مدفوع ✓</span></p>
            </div>
          )}

          <Button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12"
          >
            العودة للرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
