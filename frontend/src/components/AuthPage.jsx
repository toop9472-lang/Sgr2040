import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const AuthPage = ({ onLogin, onGuestMode }) => {
  const handleGoogleLogin = () => {
    // Mock login - will be replaced with actual Google Auth
    const mockUser = {
      id: 'user_' + Date.now(),
      name: 'مستخدم جديد',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff',
      provider: 'google'
    };
    onLogin(mockUser);
  };

  const handleAppleLogin = () => {
    // Mock login - will be replaced with actual Apple Auth
    const mockUser = {
      id: 'user_' + Date.now(),
      name: 'مستخدم جديد',
      email: 'user@icloud.com',
      avatar: 'https://ui-avatars.com/api/?name=User&background=000000&color=fff',
      provider: 'apple'
    };
    onLogin(mockUser);
  };

  const handleGuestMode = () => {
    // Guest mode
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'زائر',
      email: 'guest@saqr.app',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=94A3B8&color=fff',
      provider: 'guest',
      isGuest: true
    };
    onGuestMode(guestUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl">🦅</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            صقر
          </CardTitle>
          <CardDescription className="text-base mt-3 text-gray-600">
            شاهد الإعلانات واكسب النقاط
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-10">
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow"
            variant="outline"
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
            <span className="font-medium">تسجيل الدخول بواسطة Google</span>
          </Button>

          <Button
            onClick={handleAppleLogin}
            className="w-full h-12 bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="font-medium">تسجيل الدخول بواسطة Apple</span>
          </Button>

          <div className="pt-4">
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              بتسجيل الدخول، أنت توافق على{' '}
              <a href="#" className="text-indigo-600 hover:underline">
                الشروط والأحكام
              </a>{' '}
              و{' '}
              <a href="#" className="text-indigo-600 hover:underline">
                سياسة الخصوصية
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;