import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  FileText, 
  Download, 
  Bell, 
  Send, 
  Users, 
  Smartphone,
  TrendingUp,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ReportsAndNotifications = ({ adminToken }) => {
  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(false);
  const [notificationStats, setNotificationStats] = useState(null);
  
  // Notification form
  const [notificationForm, setNotificationForm] = useState({
    target: 'all',
    targetUserId: '',
    title: '',
    body: '',
    type: 'admin_message'
  });

  // Download report
  const downloadReport = async (type, days = 30) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/reports/${type}?days=${days}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `saqr_${type}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('فشل في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  // Load notification stats
  const loadNotificationStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setNotificationStats(response.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  // Send notification
  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      toast.error('يرجى إدخال العنوان والمحتوى');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        target: notificationForm.target === 'specific' ? notificationForm.targetUserId : 'all',
        title: notificationForm.title,
        body: notificationForm.body,
        type: notificationForm.type
      };

      const response = await axios.post(`${API_URL}/api/notifications/admin/send`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      toast.success(response.data.message || 'تم إرسال الإشعار بنجاح');
      setNotificationForm({
        target: 'all',
        targetUserId: '',
        title: '',
        body: '',
        type: 'admin_message'
      });
    } catch (error) {
      console.error('Send error:', error);
      toast.error('فشل في إرسال الإشعار');
    } finally {
      setLoading(false);
    }
  };

  // Load stats when tab changes
  React.useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationStats();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-2 border-b pb-4">
        <Button
          variant={activeTab === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reports')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          التقارير
        </Button>
        <Button
          variant={activeTab === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveTab('notifications')}
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          الإشعارات
        </Button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Financial Report */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
                التقرير المالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                تقرير شامل بالإيرادات والمصروفات والسحوبات
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport('financial', 7)}
                  disabled={loading}
                >
                  7 أيام
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport('financial', 30)}
                  disabled={loading}
                >
                  30 يوم
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadReport('financial', 90)}
                  disabled={loading}
                  className="gap-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  90 يوم
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ads Performance Report */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                تقرير أداء الإعلانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                إحصائيات المشاهدات ومعدلات الإكمال
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport('ads-performance', 7)}
                  disabled={loading}
                >
                  7 أيام
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport('ads-performance', 30)}
                  disabled={loading}
                >
                  30 يوم
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadReport('ads-performance', 90)}
                  disabled={loading}
                  className="gap-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  90 يوم
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-indigo-700">
                <FileText className="w-5 h-5" />
                تقارير PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-600">
                جميع التقارير بصيغة PDF جاهزة للطباعة والمشاركة
              </p>
              <ul className="text-xs text-indigo-500 mt-2 space-y-1">
                <li>• تفاصيل مالية شاملة</li>
                <li>• إحصائيات دقيقة</li>
                <li>• جداول واضحة</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                إرسال إشعار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">المستلم</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={notificationForm.target === 'all' ? 'default' : 'outline'}
                    onClick={() => setNotificationForm(prev => ({ ...prev, target: 'all' }))}
                    className="gap-1"
                  >
                    <Users className="w-4 h-4" />
                    جميع المستخدمين
                  </Button>
                  <Button
                    size="sm"
                    variant={notificationForm.target === 'specific' ? 'default' : 'outline'}
                    onClick={() => setNotificationForm(prev => ({ ...prev, target: 'specific' }))}
                  >
                    مستخدم محدد
                  </Button>
                </div>
              </div>

              {/* User ID for specific */}
              {notificationForm.target === 'specific' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">معرف المستخدم</label>
                  <Input
                    value={notificationForm.targetUserId}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                    placeholder="أدخل معرف المستخدم"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-sm font-medium mb-2 block">العنوان</label>
                <Input
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان الإشعار"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-medium mb-2 block">المحتوى</label>
                <Textarea
                  value={notificationForm.body}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="محتوى الإشعار"
                  rows={3}
                />
              </div>

              {/* Notification Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">نوع الإشعار</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="admin_message">رسالة إدارية</option>
                  <option value="promotion">عرض ترويجي</option>
                  <option value="new_feature">ميزة جديدة</option>
                  <option value="maintenance">صيانة</option>
                </select>
              </div>

              {/* Send Button */}
              <Button
                className="w-full gap-2"
                onClick={sendNotification}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                إرسال الإشعار
              </Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-500" />
                إحصائيات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationStats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {notificationStats.total_devices}
                    </div>
                    <div className="text-sm text-blue-500">الأجهزة المسجلة</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {notificationStats.ios_devices}
                    </div>
                    <div className="text-sm text-green-500">iOS</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {notificationStats.android_devices}
                    </div>
                    <div className="text-sm text-purple-500">Android</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {notificationStats.unread_notifications}
                    </div>
                    <div className="text-sm text-orange-500">غير مقروءة</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">نصائح</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• استخدم عناوين قصيرة وجذابة</li>
                  <li>• تجنب إرسال إشعارات كثيرة</li>
                  <li>• أفضل وقت للإرسال: 10 صباحاً - 8 مساءً</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsAndNotifications;
