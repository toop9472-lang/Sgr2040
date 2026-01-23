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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsContent />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-4">
            <InvoicesContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Analytics Content Component
const AnalyticsContent = () => {
  const [analytics, setAnalytics] = useState(null);
  const [topAds, setTopAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const [analyticsRes, topAdsRes] = await Promise.all([
        axios.get(`${API}/analytics/platform/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/top-ads?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setAnalytics(analyticsRes.data);
      setTopAds(topAdsRes.data.top_ads || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-indigo-600">{analytics?.engagement?.total_views || 0}</p>
            <p className="text-xs text-gray-500">إجمالي المشاهدات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{analytics?.users?.active_last_7_days || 0}</p>
            <p className="text-xs text-gray-500">نشط آخر 7 أيام</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-purple-600">{analytics?.financials?.total_points_distributed || 0}</p>
            <p className="text-xs text-gray-500">نقاط موزعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{analytics?.users?.activity_rate || 0}%</p>
            <p className="text-xs text-gray-500">معدل النشاط</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">أفضل الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          {topAds.length === 0 ? (
            <p className="text-gray-500 text-center">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {topAds.map((ad, i) => (
                <div key={ad.ad_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${i === 0 ? 'text-yellow-500' : 'text-gray-400'}`}>#{i+1}</span>
                    <span className="font-medium">{ad.title}</span>
                  </div>
                  <span className="font-bold text-indigo-600">{ad.views} مشاهدة</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Invoices Content Component
const InvoicesContent = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total_revenue: 0, pending_amount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/invoices/admin/all`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setInvoices(response.data.invoices || []);
      setStats({
        total_revenue: response.data.total_revenue || 0,
        pending_amount: response.data.pending_amount || 0
      });
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { paid: 'default', pending: 'secondary', cancelled: 'destructive' };
    const labels = { paid: 'مدفوعة', pending: 'معلقة', cancelled: 'ملغية' };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.total_revenue.toFixed(2)} ر.س</p>
            <p className="text-xs text-gray-500">إجمالي الإيرادات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_amount.toFixed(2)} ر.س</p>
            <p className="text-xs text-gray-500">مبالغ معلقة</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">الفواتير الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center">لا توجد فواتير</p>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 10).map((inv) => (
                <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-mono text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-500">{inv.advertiser_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{inv.total?.toFixed(2)} ر.س</p>
                    {getStatusBadge(inv.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
