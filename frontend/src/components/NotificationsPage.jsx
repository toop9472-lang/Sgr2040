import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationsPage = ({ user }) => {
  const { t, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/api/notifications/my-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('user_token');
      await fetch(`${API_URL}/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('user_token');
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'withdrawal_approved':
        return '✅';
      case 'withdrawal_rejected':
        return '❌';
      case 'new_ad':
        return '🎬';
      case 'points_milestone':
        return '🎯';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">🔔</span>
        <p className="text-gray-500">{isRTL ? 'سجّل الدخول لمشاهدة الإشعارات' : 'Login to view notifications'}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-4 ${isRTL ? 'rtl' : 'ltr'}`} data-testid="notifications-page">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🔔</span>
            <span>{isRTL ? 'الإشعارات' : 'Notifications'}</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">📭</span>
              <p className="text-gray-500">{isRTL ? 'لا توجد إشعارات' : 'No notifications'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-indigo-50 hover:bg-indigo-100'
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getIcon(notification.notification_type)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{notification.body}</p>
                      <p className="text-gray-400 text-xs mt-2">{formatDate(notification.created_at)}</p>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
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

export default NotificationsPage;
