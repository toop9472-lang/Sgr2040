import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const TwoFactorSettings = ({ user, onBack }) => {
  const { t, isRTL } = useLanguage();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [debugCode, setDebugCode] = useState('');
  const [step, setStep] = useState(1); // 1: Choose method, 2: Verify code, 3: Show backup codes

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/2fa/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIs2FAEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: 'email' })
      });

      if (response.ok) {
        const data = await response.json();
        setDebugCode(data.debug_code || '');
        setStep(2);
        toast.success(isRTL ? 'تم إرسال رمز التحقق' : 'Verification code sent');
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(isRTL ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter 6-digit verification code');
      return;
    }

    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backup_codes || []);
        setStep(3);
        setIs2FAEnabled(true);
        toast.success(isRTL ? 'تم تفعيل التحقق بخطوتين' : '2FA enabled successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || (isRTL ? 'رمز غير صحيح' : 'Invalid code'));
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode) {
      toast.error(isRTL ? 'أدخل رمز التحقق' : 'Enter verification code');
      return;
    }

    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCode })
      });

      if (response.ok) {
        setIs2FAEnabled(false);
        setShowDisableModal(false);
        setVerificationCode('');
        toast.success(isRTL ? 'تم إلغاء التحقق بخطوتين' : '2FA disabled');
      } else {
        const error = await response.json();
        toast.error(error.detail || (isRTL ? 'رمز غير صحيح' : 'Invalid code'));
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success(isRTL ? 'تم نسخ الرموز' : 'Codes copied');
  };

  const resetModal = () => {
    setShowEnableModal(false);
    setStep(1);
    setVerificationCode('');
    setDebugCode('');
    setBackupCodes([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold">{isRTL ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}</h1>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Status Card */}
        <Card className="bg-[#111118]/80 border-white/10">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${is2FAEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                {is2FAEnabled ? (
                  <ShieldCheck className="text-green-400" size={32} />
                ) : (
                  <Shield className="text-gray-400" size={32} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">
                  {is2FAEnabled 
                    ? (isRTL ? 'التحقق بخطوتين مفعّل' : '2FA is Enabled')
                    : (isRTL ? 'التحقق بخطوتين غير مفعّل' : '2FA is Disabled')
                  }
                </h3>
                <p className="text-gray-400 text-sm">
                  {is2FAEnabled
                    ? (isRTL ? 'حسابك محمي بطبقة أمان إضافية' : 'Your account has extra security')
                    : (isRTL ? 'فعّل التحقق بخطوتين لحماية حسابك' : 'Enable 2FA to protect your account')
                  }
                </p>
              </div>
            </div>

            <Button
              onClick={() => is2FAEnabled ? setShowDisableModal(true) : setShowEnableModal(true)}
              className={`w-full mt-4 ${is2FAEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3b82f6] hover:bg-[#2563eb]'}`}
              data-testid="toggle-2fa-btn"
            >
              {is2FAEnabled 
                ? (isRTL ? 'إلغاء التحقق بخطوتين' : 'Disable 2FA')
                : (isRTL ? 'تفعيل التحقق بخطوتين' : 'Enable 2FA')
              }
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[#111118]/80 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">{isRTL ? 'ما هو التحقق بخطوتين؟' : 'What is 2FA?'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-400 text-sm">
            <p>{isRTL ? 'التحقق بخطوتين يضيف طبقة أمان إضافية لحسابك.' : 'Two-factor authentication adds an extra layer of security.'}</p>
            <p>{isRTL ? 'عند تسجيل الدخول، ستحتاج إلى إدخال رمز يُرسل إلى بريدك الإلكتروني.' : 'When logging in, you\'ll need to enter a code sent to your email.'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enable 2FA Modal */}
      <Dialog open={showEnableModal} onOpenChange={resetModal}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>
              {step === 1 && (isRTL ? 'تفعيل التحقق بخطوتين' : 'Enable 2FA')}
              {step === 2 && (isRTL ? 'أدخل رمز التحقق' : 'Enter Verification Code')}
              {step === 3 && (isRTL ? 'رموز الاسترداد' : 'Backup Codes')}
            </DialogTitle>
            {step === 3 && (
              <DialogDescription className="text-gray-400">
                {isRTL ? 'احفظ هذه الرموز في مكان آمن. يمكنك استخدامها لتسجيل الدخول إذا فقدت الوصول لبريدك.' : 'Save these codes in a safe place. You can use them to login if you lose access to your email.'}
              </DialogDescription>
            )}
          </DialogHeader>

          {step === 1 && (
            <div className="py-4 space-y-4">
              <p className="text-gray-400 text-sm">
                {isRTL ? 'سيتم إرسال رمز تحقق إلى بريدك الإلكتروني:' : 'A verification code will be sent to your email:'}
              </p>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <span className="text-[#60a5fa]">{user?.email}</span>
              </div>
              <Button onClick={handleEnable2FA} className="w-full bg-[#3b82f6]">
                {isRTL ? 'إرسال الرمز' : 'Send Code'}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="py-4 space-y-4">
              {debugCode && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-lg text-center">
                  <p className="text-yellow-400 text-xs mb-1">{isRTL ? 'رمز التجربة (للتطوير فقط):' : 'Debug Code (Dev only):'}</p>
                  <span className="text-yellow-300 font-mono text-lg">{debugCode}</span>
                </div>
              )}
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
              <Button onClick={handleVerifyCode} className="w-full bg-[#3b82f6]">
                {isRTL ? 'تحقق' : 'Verify'}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-black/30 p-2 rounded text-center font-mono text-sm text-white">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={copyBackupCodes} variant="outline" className="w-full border-white/10">
                <Copy size={16} className="mr-2" />
                {isRTL ? 'نسخ الرموز' : 'Copy Codes'}
              </Button>
              <Button onClick={resetModal} className="w-full bg-[#3b82f6]">
                {isRTL ? 'تم' : 'Done'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إلغاء التحقق بخطوتين' : 'Disable 2FA'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isRTL ? 'أدخل أحد رموز الاسترداد لإلغاء التحقق بخطوتين' : 'Enter one of your backup codes to disable 2FA'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableModal(false)} className="border-white/10">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleDisable2FA} className="bg-red-600 hover:bg-red-700">
              {isRTL ? 'إلغاء التحقق' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwoFactorSettings;
