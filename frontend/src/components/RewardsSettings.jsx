import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import { Settings, Gift, Target, Clock, DollarSign, Save, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RewardsSettings = ({ getAuthHeaders }) => {
  const [settings, setSettings] = useState({
    points_per_ad: 5,
    min_watch_time: 30,
    points_per_dollar: 500,
    daily_limit: 50,
    min_withdrawal: 500,
    daily_challenges: [
      { title: 'المشاهد النشط', target: 5, reward: 25, icon: '👁️', desc: 'شاهد 5 إعلانات', enabled: true },
      { title: 'جامع النقاط', target: 50, reward: 30, icon: '⭐', desc: 'اكسب 50 نقطة', enabled: true },
      { title: 'المثابر', target: 10, reward: 50, icon: '🔥', desc: 'شاهد 10 إعلانات متتالية', enabled: true },
    ],
    tips: [
      { icon: '💡', text: 'شاهد 10 إعلانات = 50 نقطة!', enabled: true },
      { icon: '🎯', text: 'كل 500 نقطة = 1 دولار', enabled: true },
      { icon: '⚡', text: 'الإعلانات الجديدة تعطي نقاط أكثر', enabled: true },
      { icon: '🏆', text: 'حقق التحديات اليومية لمضاعفة النقاط', enabled: true },
      { icon: '🎁', text: 'سجل يومياً للحصول على مكافآت', enabled: true },
    ]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API}/admin/settings/rewards`, { headers });
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.log('Using default settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API}/admin/settings/rewards`, settings, { headers });
      toast({ title: '✅ تم الحفظ', description: 'تم حفظ إعدادات المكافآت' });
    } catch (error) {
      toast({ title: '❌ خطأ', description: 'فشل حفظ الإعدادات', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateChallenge = (index, field, value) => {
    const newChallenges = [...settings.daily_challenges];
    newChallenges[index] = { ...newChallenges[index], [field]: value };
    setSettings({ ...settings, daily_challenges: newChallenges });
  };

  const updateTip = (index, field, value) => {
    const newTips = [...settings.tips];
    newTips[index] = { ...newTips[index], [field]: value };
    setSettings({ ...settings, tips: newTips });
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* الإعدادات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-indigo-600" />
            إعدادات النقاط الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">النقاط لكل إعلان</label>
              <Input
                type="number"
                value={settings.points_per_ad}
                onChange={(e) => setSettings({ ...settings, points_per_ad: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">وقت المشاهدة (ثانية)</label>
              <Input
                type="number"
                value={settings.min_watch_time}
                onChange={(e) => setSettings({ ...settings, min_watch_time: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">نقاط = 1 دولار</label>
              <Input
                type="number"
                value={settings.points_per_dollar}
                onChange={(e) => setSettings({ ...settings, points_per_dollar: parseInt(e.target.value) || 500 })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">الحد اليومي للإعلانات</label>
              <Input
                type="number"
                value={settings.daily_limit}
                onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) || 50 })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600 mb-1 block">الحد الأدنى للسحب (نقاط)</label>
              <Input
                type="number"
                value={settings.min_withdrawal}
                onChange={(e) => setSettings({ ...settings, min_withdrawal: parseInt(e.target.value) || 500 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التحديات اليومية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-amber-600" />
            التحديات اليومية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.daily_challenges.map((challenge, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{challenge.icon}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={challenge.enabled}
                    onChange={(e) => updateChallenge(idx, 'enabled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">مفعّل</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="العنوان"
                  value={challenge.title}
                  onChange={(e) => updateChallenge(idx, 'title', e.target.value)}
                />
                <Input
                  placeholder="الوصف"
                  value={challenge.desc}
                  onChange={(e) => updateChallenge(idx, 'desc', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="الهدف"
                  value={challenge.target}
                  onChange={(e) => updateChallenge(idx, 'target', parseInt(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="المكافأة"
                  value={challenge.reward}
                  onChange={(e) => updateChallenge(idx, 'reward', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* النصائح */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-green-600" />
            نصائح الصفحة الرئيسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.tips.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">{tip.icon}</span>
              <Input
                value={tip.text}
                onChange={(e) => updateTip(idx, 'text', e.target.value)}
                className="flex-1"
              />
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={tip.enabled}
                  onChange={(e) => updateTip(idx, 'enabled', e.target.checked)}
                  className="rounded"
                />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <Button 
        onClick={saveSettings} 
        disabled={isSaving}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isSaving ? (
          <RefreshCw className="w-4 h-4 animate-spin ml-2" />
        ) : (
          <Save className="w-4 h-4 ml-2" />
        )}
        حفظ الإعدادات
      </Button>
    </div>
  );
};

export default RewardsSettings;
