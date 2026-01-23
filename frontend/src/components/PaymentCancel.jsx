import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adId = searchParams.get('ad_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <XCircle className="text-orange-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إلغاء الدفع</h2>
          <p className="text-gray-600 mb-6">
            تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى في أي وقت.
          </p>
          
          <div className="space-y-3">
            {adId && (
              <Button
                onClick={() => navigate(`/?continue_ad=${adId}`)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
              >
                إعادة المحاولة
              </Button>
            )}
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 border-2"
            >
              العودة للرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
