import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AnalyticsPage = () => {
  const { isRTL } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [topAds, setTopAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Load platform analytics
      const analyticsRes = await fetch(`${API_URL}/api/analytics/platform/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
      
      // Load top ads
      const topAdsRes = await fetch(`${API_URL}/api/analytics/top-ads?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const topAdsData = await topAdsRes.json();
      setTopAds(topAdsData.top_ads || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} data-testid="analytics-page">
      <h2 className="text-2xl font-bold">{isRTL ? 'التحليلات' : 'Analytics'}</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{analytics?.users?.total || 0}</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'إجمالي المستخدمين' : 'Total Users'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{analytics?.users?.active_last_7_days || 0}</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'نشط آخر 7 أيام' : 'Active Last 7 Days'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{analytics?.engagement?.total_views || 0}</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'إجمالي المشاهدات' : 'Total Views'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{analytics?.ads?.active || 0}</p>
              <p className="text-gray-500 text-sm">{isRTL ? 'إعلانات نشطة' : 'Active Ads'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'الملخص المالي' : 'Financial Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {analytics?.financials?.total_revenue?.toFixed(2) || 0} ر.س
              </p>
              <p className="text-gray-600 text-sm">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {analytics?.financials?.total_payouts?.toFixed(2) || 0} ر.س
              </p>
              <p className="text-gray-600 text-sm">{isRTL ? 'إجمالي المدفوعات' : 'Total Payouts'}</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {analytics?.financials?.net_profit?.toFixed(2) || 0} ر.س
              </p>
              <p className="text-gray-600 text-sm">{isRTL ? 'صافي الربح' : 'Net Profit'}</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {analytics?.financials?.total_points_distributed || 0}
              </p>
              <p className="text-gray-600 text-sm">{isRTL ? 'نقاط موزعة' : 'Points Distributed'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Ads */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'أفضل الإعلانات أداءً' : 'Top Performing Ads'}</CardTitle>
        </CardHeader>
        <CardContent>
          {topAds.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
          ) : (
            <div className="space-y-3">
              {topAds.map((ad, index) => (
                <div 
                  key={ad.ad_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      index === 2 ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{ad.title}</p>
                      <p className="text-sm text-gray-500">@{ad.advertiser}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-indigo-600">{ad.views}</p>
                    <p className="text-xs text-gray-500">{isRTL ? 'مشاهدة' : 'views'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Daily Active Users Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? 'المستخدمون النشطون يومياً' : 'Daily Active Users'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {analytics?.daily_active_users?.slice(-14).map((day, index) => {
              const maxUsers = Math.max(...(analytics?.daily_active_users?.map(d => d.active_users) || [1]));
              const height = maxUsers > 0 ? (day.active_users / maxUsers) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.active_users} users`}
                  ></div>
                  <span className="text-[8px] text-gray-400 mt-1 rotate-45">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
