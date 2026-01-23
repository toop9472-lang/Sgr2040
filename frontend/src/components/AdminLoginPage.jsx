import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLoginPage = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/admin/auth/login`, {
        email,
        password
      });

      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
      
      onAdminLogin(response.data.admin);
      
      toast({
        title: '✅ تم تسجيل الدخول',
        description: `مرحباً ${response.data.admin.name}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '❌ خطأ',
        description: error.response?.data?.detail || 'فشل تسجيل الدخول',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-gray-800">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl">🔐</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            لوحة التحكم
          </CardTitle>
          <CardDescription className="text-base mt-3 text-gray-400">
            تسجيل دخول المسؤولين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-gray-700 text-white border-gray-600"
                placeholder="admin@saqr.app"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 bg-gray-700 text-white border-gray-600"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;