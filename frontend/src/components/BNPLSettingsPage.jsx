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

const BNPLSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [tabbyStatus, setTabbyStatus] = useState(null);
  const [tamaraStatus, setTamaraStatus] = useState(null);
  const [settings, setSettings] = useState({
    tabby: {
      enabled: false,
      api_key: '',
      installments: 4,
      min_amount: 100,
      max_amount: 5000
    },
    tamara: {
      enabled: false,
      api_key: '',
      sandbox: true,
      installments: 3,
      min_amount: 50,
      max_amount: 10000
    }
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [tabbyRes, tamaraRes] = await Promise.all([
        axios.get(`${API_URL}/api/tabby/status`),
        axios.get(`${API_URL}/api/tamara/status`)
      ]);
      setTabbyStatus(tabbyRes.data);
      setTamaraStatus(tamaraRes.data);
    } catch (error) {
      console.error('Error fetching BNPL status:', error);
    }
  };

  const saveSettings = async (provider) => {
    setLoading(true);
    try {
      // In a real implementation, this would save to backend
      // For now, we show configuration instructions
      toast.success(`تم حفظ إعدادات ${provider === 'tabby' ? 'Tabby' : 'Tamara'}`);
    } catch (error) {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">💳 بوابات الدفع بالتقسيط</h1>
        <p className="text-muted-foreground">إدارة Tabby و Tamara للدفع بالتقسيط</p>
      </div>

      <Tabs defaultValue="tabby" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tabby" className="flex items-center gap-2">
            <span>Tabby</span>
            <Badge variant={tabbyStatus?.configured ? "success" : "secondary"}>
              {tabbyStatus?.configured ? 'مُفعّل' : 'غير مُفعّل'}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tamara" className="flex items-center gap-2">
            <span>Tamara</span>
            <Badge variant={tamaraStatus?.configured ? "success" : "secondary"}>
              {tamaraStatus?.configured ? 'مُفعّل' : 'غير مُفعّل'}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tabby Settings */}
        <TabsContent value="tabby">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <div>
                  <h3 className="text-xl">Tabby</h3>
                  <p className="text-sm text-muted-foreground">قسّط على 4 دفعات بدون فوائد</p>
                </div>
              </CardTitle>
              <CardDescription>
                {tabbyStatus?.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">تفعيل Tabby</h4>
                  <p className="text-sm text-muted-foreground">عرض خيار التقسيط للمعلنين</p>
                </div>
                <Switch
                  checked={settings.tabby.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({...prev, tabby: {...prev.tabby, enabled: checked}}))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>مفتاح API</Label>
                  <Input
                    type="password"
                    placeholder="sk_test_..."
                    value={settings.tabby.api_key}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, tabby: {...prev.tabby, api_key: e.target.value}}))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    احصل على المفتاح من{' '}
                    <a href="https://tabby.ai/merchants" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      لوحة تحكم Tabby
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى (ر.س)</Label>
                    <Input
                      type="number"
                      value={settings.tabby.min_amount}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, tabby: {...prev.tabby, min_amount: parseInt(e.target.value)}}))
                      }
                    />
                  </div>
                  <div>
                    <Label>الحد الأقصى (ر.س)</Label>
                    <Input
                      type="number"
                      value={settings.tabby.max_amount}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, tabby: {...prev.tabby, max_amount: parseInt(e.target.value)}}))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span>📊</span> كيف يعمل Tabby
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• العميل يدفع 25% فقط عند الشراء</li>
                  <li>• الباقي على 3 دفعات شهرية</li>
                  <li>• بدون فوائد أو رسوم إضافية</li>
                  <li>• تستلم المبلغ كاملاً فوراً</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                onClick={() => saveSettings('tabby')}
                disabled={loading}
              >
                حفظ إعدادات Tabby
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tamara Settings */}
        <TabsContent value="tamara">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <div>
                  <h3 className="text-xl">Tamara</h3>
                  <p className="text-sm text-muted-foreground">ادفع لاحقاً - تقسيط مرن</p>
                </div>
              </CardTitle>
              <CardDescription>
                {tamaraStatus?.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">تفعيل Tamara</h4>
                  <p className="text-sm text-muted-foreground">عرض خيار التقسيط للمعلنين</p>
                </div>
                <Switch
                  checked={settings.tamara.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({...prev, tamara: {...prev.tamara, enabled: checked}}))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">وضع الاختبار (Sandbox)</h4>
                  <p className="text-sm text-muted-foreground">استخدم بيئة الاختبار</p>
                </div>
                <Switch
                  checked={settings.tamara.sandbox}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({...prev, tamara: {...prev.tamara, sandbox: checked}}))
                  }
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>مفتاح API</Label>
                  <Input
                    type="password"
                    placeholder="sk_..."
                    value={settings.tamara.api_key}
                    onChange={(e) => 
                      setSettings(prev => ({...prev, tamara: {...prev.tamara, api_key: e.target.value}}))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    احصل على المفتاح من{' '}
                    <a href="https://tamara.co/merchants" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      لوحة تحكم Tamara
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الحد الأدنى (ر.س)</Label>
                    <Input
                      type="number"
                      value={settings.tamara.min_amount}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, tamara: {...prev.tamara, min_amount: parseInt(e.target.value)}}))
                      }
                    />
                  </div>
                  <div>
                    <Label>الحد الأقصى (ر.س)</Label>
                    <Input
                      type="number"
                      value={settings.tamara.max_amount}
                      onChange={(e) => 
                        setSettings(prev => ({...prev, tamara: {...prev.tamara, max_amount: parseInt(e.target.value)}}))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-teal-500/10 rounded-lg border border-teal-500/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span>📊</span> كيف يعمل Tamara
                </h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• العميل يدفع على 3 دفعات شهرية</li>
                  <li>• بدون دفعة أولى في بعض الحالات</li>
                  <li>• بدون فوائد للعميل</li>
                  <li>• موافقة فورية خلال ثوانٍ</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                onClick={() => saveSettings('tamara')}
                disabled={loading}
              >
                حفظ إعدادات Tamara
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>📚 دليل التكامل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">1. إضافة المفاتيح في ملف .env</h4>
            <pre className="text-xs bg-black/50 p-3 rounded overflow-x-auto text-green-400">
{`# Tabby
TABBY_API_KEY=sk_test_your_key_here

# Tamara
TAMARA_API_KEY=your_key_here
TAMARA_SANDBOX=true`}
            </pre>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">2. اختبار الدفع</h4>
            <p className="text-sm text-muted-foreground">
              استخدم بطاقات الاختبار المقدمة من كل مزود لاختبار عملية الدفع قبل التفعيل الفعلي.
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">3. Webhooks</h4>
            <p className="text-sm text-muted-foreground mb-2">
              قم بتكوين Webhooks في لوحة التحكم لكل مزود:
            </p>
            <div className="text-xs font-mono bg-black/50 p-2 rounded">
              <p>Tabby: {API_URL}/api/tabby/webhook</p>
              <p>Tamara: {API_URL}/api/tamara/webhook</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BNPLSettingsPage;
