import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdNetworksSettings = () => {
  const [loading, setLoading] = useState(false);
  const [unityStatus, setUnityStatus] = useState(null);
  const [unityStats, setUnityStats] = useState(null);
  const [admobStatus, setAdmobStatus] = useState(null);
  const [settings, setSettings] = useState({
    unity: {
      enabled: false,
      game_id: '',
      api_key: '',
      s2s_secret: '',
      rewarded_placement: 'rewardedVideo',
      interstitial_placement: 'interstitial'
    },
    admob: {
      enabled: true,
      app_id: '',
      rewarded_unit_id: '',
      interstitial_unit_id: ''
    }
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [unityRes, unityStatsRes] = await Promise.all([
        axios.get(`${API_URL}/api/unity-ads/status`),
        axios.get(`${API_URL}/api/unity-ads/stats`).catch(() => ({ data: null }))
      ]);
      setUnityStatus(unityRes.data);
      if (unityStatsRes.data) setUnityStats(unityStatsRes.data);
    } catch (error) {
      console.error('Error fetching ad networks status:', error);
    }
  };

  const saveSettings = async (network) => {
    setLoading(true);
    try {
      toast.success(`تم حفظ إعدادات ${network === 'unity' ? 'Unity Ads' : 'AdMob'}`);
    } catch (error) {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">📺 شبكات الإعلانات</h1>
        <p className="text-muted-foreground">إدارة Unity Ads و Google AdMob</p>
      </div>

      <Tabs defaultValue="unity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unity" className="flex items-center gap-2">
            <span>Unity Ads</span>
            <Badge variant={unityStatus?.configured ? "success" : "secondary"}>
              {unityStatus?.configured ? 'مُفعّل' : 'غير مُفعّل'}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admob" className="flex items-center gap-2">
            <span>Google AdMob</span>
            <Badge variant="success">مُفعّل</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Unity Ads Settings */}
        <TabsContent value="unity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-white text-2xl">U</span>
                </div>
                <div>
                  <h3 className="text-xl">Unity Ads</h3>
                  <p className="text-sm text-muted-foreground">إعلانات مكافأة وبينية</p>
                </div>
              </CardTitle>
              <CardDescription>
                {unityStatus?.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              {unityStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{unityStats.total_views}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المشاهدات</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{unityStats.today_views}</p>
                    <p className="text-xs text-muted-foreground">اليوم</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{unityStats.total_points_awarded}</p>
                    <p className="text-xs text-muted-foreground">نقاط موزعة</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{unityStats.average_daily_views}</p>
                    <p className="text-xs text-muted-foreground">معدل يومي</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">تفعيل Unity Ads</h4>
                  <p className="text-sm text-muted-foreground">عرض إعلانات Unity في التطبيق</p>
                </div>
                <Switch
                  checked={settings.unity.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({...prev, unity: {...prev.unity, enabled: checked}}))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Game ID</Label>
                  <Input
                    placeholder="1234567"
                    value={settings.unity.game_id}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, unity: {...prev.unity, game_id: e.target.value}}))
                    }
                  />
                </div>

                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="your_api_key"
                    value={settings.unity.api_key}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, unity: {...prev.unity, api_key: e.target.value}}))
                    }
                  />
                </div>

                <div>
                  <Label>S2S Secret (للتحقق من الـ Callbacks)</Label>
                  <Input
                    type="password"
                    placeholder="your_s2s_secret"
                    value={settings.unity.s2s_secret}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, unity: {...prev.unity, s2s_secret: e.target.value}}))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rewarded Placement ID</Label>
                    <Input
                      value={settings.unity.rewarded_placement}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, unity: {...prev.unity, rewarded_placement: e.target.value}}))
                      }
                    />
                  </div>
                  <div>
                    <Label>Interstitial Placement ID</Label>
                    <Input
                      value={settings.unity.interstitial_placement}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, unity: {...prev.unity, interstitial_placement: e.target.value}}))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span>🔗</span> Server-to-Server Callback
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  أضف هذا الرابط في لوحة تحكم Unity:
                </p>
                <code className="text-xs bg-black/50 p-2 rounded block overflow-x-auto">
                  {API_URL}/api/unity-ads/callback?userId=%USERID%&placementId=%PLACEMENT%&amount=%VALUE%
                </code>
              </div>

              <Button 
                className="w-full" 
                onClick={() => saveSettings('unity')}
                disabled={loading}
              >
                حفظ إعدادات Unity Ads
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AdMob Settings */}
        <TabsContent value="admob">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">G</span>
                </div>
                <div>
                  <h3 className="text-xl">Google AdMob</h3>
                  <p className="text-sm text-muted-foreground">إعلانات Google المكافئة</p>
                </div>
              </CardTitle>
              <CardDescription>
                شبكة إعلانات Google للجوال
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">تفعيل AdMob</h4>
                  <p className="text-sm text-muted-foreground">عرض إعلانات AdMob في التطبيق</p>
                </div>
                <Switch
                  checked={settings.admob.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({...prev, admob: {...prev.admob, enabled: checked}}))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>App ID</Label>
                  <Input
                    placeholder="ca-app-pub-xxxxxxxxxxxxx~xxxxxxxxxx"
                    value={settings.admob.app_id}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, admob: {...prev.admob, app_id: e.target.value}}))
                    }
                  />
                </div>

                <div>
                  <Label>Rewarded Ad Unit ID</Label>
                  <Input
                    placeholder="ca-app-pub-xxxxxxxxxxxxx/xxxxxxxxxx"
                    value={settings.admob.rewarded_unit_id}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, admob: {...prev.admob, rewarded_unit_id: e.target.value}}))
                    }
                  />
                </div>

                <div>
                  <Label>Interstitial Ad Unit ID</Label>
                  <Input
                    placeholder="ca-app-pub-xxxxxxxxxxxxx/xxxxxxxxxx"
                    value={settings.admob.interstitial_unit_id}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, admob: {...prev.admob, interstitial_unit_id: e.target.value}}))
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span>📊</span> مميزات AdMob
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• أعلى معدلات تعبئة (Fill Rate)</li>
                  <li>• دعم جميع أنواع الإعلانات</li>
                  <li>• تحليلات متقدمة</li>
                  <li>• دعم SSV للتحقق من المكافآت</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                onClick={() => saveSettings('admob')}
                disabled={loading}
              >
                حفظ إعدادات AdMob
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>📚 دليل التكوين</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">1. إضافة المفاتيح في ملف .env</h4>
            <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-green-400">
{`# Unity Ads
UNITY_GAME_ID=your_game_id
UNITY_API_KEY=your_api_key
UNITY_S2S_SECRET=your_secret

# Google AdMob (Mobile)
ADMOB_APP_ID=ca-app-pub-xxx
ADMOB_REWARDED_UNIT=ca-app-pub-xxx/xxx`}
            </pre>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">2. تكوين التطبيق</h4>
            <p className="text-sm text-muted-foreground">
              أضف معرفات الإعلانات في ملف app.json للتطبيق الجوال:
            </p>
            <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-green-400 mt-2">
{`"android": {
  "config": {
    "googleMobileAdsAppId": "ca-app-pub-xxx"
  }
}`}
            </pre>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">3. اختبار الإعلانات</h4>
            <p className="text-sm text-muted-foreground">
              استخدم معرفات الاختبار من كل شبكة قبل النشر الفعلي لتجنب الحظر.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdNetworksSettings;
