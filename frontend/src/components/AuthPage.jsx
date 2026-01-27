import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * AuthPage Component
 * Supports Google OAuth, Apple OAuth, Email/Password, and Guest mode
 * UNIFIED LOGIN: If admin credentials are entered, redirects to admin dashboard
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const AuthPage = ({ onLogin, onGuestMode, onAdminLogin }) => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthSettings, setOauthSettings] = useState({
    google_enabled: true,
    apple_enabled: false
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Load OAuth settings from backend
  useEffect(() => {
    const loadOAuthSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/public/oauth`);
        if (response.ok) {
          const data = await response.json();
          setOauthSettings(data);
        }
      } catch (error) {
        console.error('Failed to load OAuth settings:', error);
      }
    };
    loadOAuthSettings();
  }, []);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleAppleLogin = () => {
    toast({
      title: t('comingSoon'),
      description: isRTL ? 'تسجيل الدخول بـ Apple متاح فقط في تطبيق iOS' : 'Apple Sign In is only available on iOS app',
    });
  };

  const handleGuestMode = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: isRTL ? 'زائر' : 'Guest',
      email: 'guest@saqr.app',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=94A3B8&color=fff',
      provider: 'guest',
      isGuest: true
    };
    onGuestMode(guestUser);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/signin';
      const body = isRegister 
        ? { email: formData.email, password: formData.password, name: formData.name }
        : { email: formData.email, password: formData.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Check if this is an admin login
      if (data.role === 'admin') {
        // Store admin data
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.user));
        
        toast({
          title: '✅ ' + (isRTL ? 'مرحباً بك' : 'Welcome'),
          description: `${isRTL ? 'مرحباً' : 'Hello'} ${data.user.name}!`,
        });

        // Call admin login handler and redirect to admin dashboard
        if (onAdminLogin) {
          onAdminLogin(data.user);
        }
        navigate('/admin/dashboard');
        return;
      }

      // Regular user login - store token for API calls
      if (data.token) {
        localStorage.setItem('user_token', data.token);
      }
      
      toast({
        title: isRegister ? '✅ ' + t('success') : '✅ ' + t('login'),
        description: `${t('welcome')} ${data.user.name}!`,
      });

      onLogin(data.user);
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: '❌ ' + t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        {/* Language Switcher */}
        <div className="fixed top-4 left-4 z-50">
          <LanguageSwitcher className="!bg-indigo-600 hover:!bg-indigo-700" />
        </div>

        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-6 pt-8 relative">
            <button
              onClick={() => setShowEmailForm(false)}
              className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} text-gray-500 hover:text-gray-700`}
            >
              {isRTL ? '←' : '→'}
            </button>
            <div className="mx-auto mb-4 w-16 h-16 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5">
              <img 
                src="/logo_new.png" 
                alt="صقر" 
                className="w-full h-full object-contain rounded-lg bg-white/10"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {isRegister ? t('register') : t('login')}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isRegister 
                ? (isRTL ? 'أدخل بياناتك لإنشاء حساب' : 'Enter your details to create an account')
                : (isRTL ? 'أدخل بريدك الإلكتروني وكلمة المرور' : 'Enter your email and password')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'}
                    className="mt-1"
                    dir={isRTL ? 'rtl' : 'ltr'}
                    data-testid="auth-name-input"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="your@email.com"
                  className="mt-1"
                  dir="ltr"
                  data-testid="auth-email-input"
                />
              </div>
              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="mt-1"
                  minLength={6}
                  data-testid="auth-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                data-testid="auth-submit-btn"
              >
                {isLoading ? t('loading') : (isRegister ? t('register') : t('login'))}
              </Button>
            </form>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-indigo-600 hover:underline text-sm"
              >
                {isRegister ? t('haveAccount') : t('noAccount')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Decorative Blue Circles */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
      <div className="absolute top-[50%] right-[-100px] w-[300px] h-[300px] rounded-full bg-[#60a5fa]/10 blur-2xl"></div>
      
      {/* Language Switcher */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher className="!bg-[#1a1a2e] hover:!bg-[#252545] !border-white/10" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
        <CardHeader className="text-center pb-6 pt-10">
          <div className="mx-auto mb-6 text-7xl">
            🦅
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            {t('appName')}
          </CardTitle>
          <CardDescription className="text-base mt-3 text-gray-400">
            {t('watchAdsEarnPoints')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-10 px-8">
          {oauthSettings.google_enabled && (
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 flex items-center justify-center gap-3 transition-all rounded-full font-medium"
              variant="outline"
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t('loginWithGoogle')}</span>
            </Button>
          )}

          {oauthSettings.apple_enabled && (
            <Button
              onClick={handleAppleLogin}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-3 transition-all rounded-full border border-white/20 font-medium"
              data-testid="apple-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>{t('loginWithApple')}</span>
            </Button>
          )}

          {(oauthSettings.google_enabled || oauthSettings.apple_enabled) && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#111118] text-gray-500">{t('or')}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            className="w-full h-12 border border-[#3b82f6]/50 hover:border-[#3b82f6] bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#60a5fa] flex items-center justify-center gap-3 transition-all rounded-full font-medium"
            data-testid="email-login-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t('loginWithEmail')}</span>
          </Button>

          <div className="pt-4">
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              {t('termsText')}{' '}
              <a href="#" className="text-[#60a5fa] hover:underline">
                {t('termsLink')}
              </a>{' '}
              {t('and')}{' '}
              <a href="#" className="text-[#60a5fa] hover:underline">
                {t('privacyLink')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
