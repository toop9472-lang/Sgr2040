import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ admin, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [pendingAds, setPendingAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();

      // Load stats
      const statsResponse = await axios.get(`${API}/admin/dashboard/stats`, { headers });
      setStats(statsResponse.data);

      // Load pending withdrawals
      const withdrawalsResponse = await axios.get(`${API}/admin/dashboard/withdrawals/pending`, { headers });
      setPendingWithdrawals(withdrawalsResponse.data.withdrawals);

      // Load pending ads
      const adsResponse = await axios.get(`${API}/admin/dashboard/ads/pending`, { headers });
      setPendingAds(adsResponse.data.ads);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل تحميل البيانات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API}/admin/dashboard/withdrawals/${withdrawalId}/approve`, {}, { headers });
      
      toast({
        title: '✅ تمت الموافقة',
        description: 'تمت الموافقة على طلب السحب',
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشلت الموافقة',
        variant: 'destructive'
      });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      const headers = getAuthHeaders();
      await axios.put(`${API}/admin/dashboard/withdrawals/${withdrawalId}/reject`, { reason }, { headers });
      
      toast({
        title: '✅ تم الرفض',
        description: 'تم رفض الطلب وإرجاع النقاط',
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Reject error:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل الرفض',
        variant: 'destructive'
      });
    }
  };

  const handleApproveAd = async (adId) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API}/admin/dashboard/ads/${adId}/approve`, {}, { headers });
      
      toast({
        title: '✅ تمت الموافقة',
        description: 'تم تفعيل الإعلان',
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Approve ad error:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشلت الموافقة',
        variant: 'destructive'
      });
    }
  };

  const handleRejectAd = async (adId) => {
    const reason = prompt('سبب رفض الإعلان:');
    if (!reason) return;

    try {
      const headers = getAuthHeaders();
      await axios.put(`${API}/admin/dashboard/ads/${adId}/reject`, { reason }, { headers });
      
      toast({
        title: '✅ تم الرفض',
        description: 'تم رفض الإعلان',
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Reject ad error:', error);
      toast({
        title: '❌ خطأ',
        description: 'فشل الرفض',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 pt-8 pb-16 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">لوحة التحكم</h1>
            <p className="text-gray-400 text-sm mt-1">مرحباً {admin.name}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-green-600">{stats?.total_revenue || 0} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">المدفوعات للمستخدمين</p>
                <p className="text-3xl font-bold text-red-600">{stats?.total_payouts || 0} $</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">صافي الربح</p>
                <p className="text-3xl font-bold text-indigo-600">{stats?.net_profit || 0} ر.س</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.total_users || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="withdrawals">
              السحوبات ({pendingWithdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="ads">
              الإعلانات ({pendingAds.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="invoices">
              الفواتير
            </TabsTrigger>
          </TabsList>

          {/* Pending Withdrawals */}
          <TabsContent value="withdrawals" className="space-y-4 mt-4">
            {pendingWithdrawals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  لا توجد طلبات سحب معلقة
                </CardContent>
              </Card>
            ) : (
              pendingWithdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{withdrawal.user_name || 'مستخدم'}</CardTitle>
                        <CardDescription>{withdrawal.user_email}</CardDescription>
                      </div>
                      <Badge variant="outline">{withdrawal.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><strong>المبلغ:</strong> ${withdrawal.amount}</p>
                      <p className="text-sm"><strong>النقاط:</strong> {withdrawal.points}</p>
                      <p className="text-sm"><strong>الطريقة:</strong> {withdrawal.method_name}</p>
                      <div className="bg-gray-50 p-3 rounded-lg mt-2">
                        <p className="text-sm font-semibold mb-1">تفاصيل الحساب:</p>
                        {Object.entries(withdrawal.details || {}).map(([key, value]) => (
                          <p key={key} className="text-sm"><strong>{key}:</strong> {value}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        ✓ موافقة
                      </Button>
                      <Button
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        ✗ رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pending Ads */}
          <TabsContent value="ads" className="space-y-4 mt-4">
            {pendingAds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  لا توجد طلبات إعلانات معلقة
                </CardContent>
              </Card>
            ) : (
              pendingAds.map((ad) => (
                <Card key={ad.id} className="shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{ad.title}</CardTitle>
                        <CardDescription>{ad.advertiser_name}</CardDescription>
                      </div>
                      <Badge variant="outline">{ad.payment_status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">{ad.description}</p>
                      <p className="text-sm"><strong>المبلغ:</strong> {ad.price} ر.س</p>
                      <p className="text-sm"><strong>المدة:</strong> {ad.duration_months} شهر</p>
                      <p className="text-sm"><strong>البريد:</strong> {ad.advertiser_email}</p>
                      <p className="text-sm"><strong>الجوال:</strong> {ad.advertiser_phone || '-'}</p>
                      <a 
                        href={ad.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline block"
                      >
                        مشاهدة الفيديو →
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveAd(ad.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        ✓ موافقة وتفعيل
                      </Button>
                      <Button
                        onClick={() => handleRejectAd(ad.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        ✗ رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
