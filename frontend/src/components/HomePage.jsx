import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Play, ChevronRight, BarChart3, Award, Calendar, Zap, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = ({ user, onNavigateToAds }) => {
  const { t } = useLanguage();
  const [currentTip, setCurrentTip] = useState(0);
  const [settings, setSettings] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default dark for mobile
  });

  useEffect(() => {
    loadData();
    
    // تغيير النصيحة كل 4 ثواني
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % (settings?.tips?.length || 5));
    }, 4000);

    return () => clearInterval(interval);
  }, [settings?.tips?.length]);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const loadData = async () => {
    try {
      // جلب إعدادات المكافآت
      const settingsRes = await axios.get(`${API_URL}/api/settings/public/rewards`);
      setSettings(settingsRes.data);

      // جلب تحليلات المستخدم إذا كان مسجل
      if (user?.id || user?.user_id) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const analyticsRes = await axios.get(`${API_URL}/api/users/analytics`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUserAnalytics(analyticsRes.data);
          } catch (e) {
            console.log('Analytics not available');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const watchedToday = user?.watched_today || userAnalytics?.today_watches || 0;
  const dailyLimit = settings?.daily_limit || 50;
  const pointsPerAd = settings?.points_per_ad || 5;

  // التحديات اليومية
  const challenges = settings?.daily_challenges || [
    { title: 'المشاهد النشط', target: 5, reward: 25, icon: '👁️', desc: 'شاهد 5 إعلانات', enabled: true },
  ];
  const today = new Date().getDate();
  const dailyChallenge = challenges[today % challenges.length];

  // النصائح
  const tips = settings?.tips || [
    { icon: '💡', text: 'شاهد الإعلانات واكسب النقاط!', enabled: true },
  ];

  // Theme classes - New Professional Dark Design
  const bgClass = 'bg-[#0a0a0f]';
  const cardClass = 'bg-[#111118]/80 backdrop-blur-xl border-white/10';
  const textClass = 'text-white';
  const textMutedClass = 'text-gray-400';
  const textDimClass = 'text-gray-500';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
        <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
        <div className={`animate-pulse ${textClass}`}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-28 relative overflow-y-auto overflow-x-hidden`}>
      {/* Decorative Blue Circles */}
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl pointer-events-none"></div>
      <div className="fixed top-[40%] right-[-100px] w-[300px] h-[300px] rounded-full bg-[#60a5fa]/10 blur-2xl pointer-events-none"></div>
      {/* Header مع الشعار والترحيب */}
      <div className="relative z-10 pt-8 px-5 pb-6">
        {/* شعار التطبيق واسمه */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-[#3b82f6]/30 flex items-center justify-center overflow-hidden shadow-lg shadow-[#3b82f6]/20">
              <img 
                src="/logo_saqr.png" 
                alt="صقر" 
                className="w-11 h-11 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white">صقر</h1>
          </div>
        </div>
        
        {/* ترحيب المستخدم */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>مرحباً {user?.name || 'صديقي'} 👋</h2>
            <p className={`${textMutedClass} text-sm mt-1`}>جاهز لكسب المزيد اليوم؟</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-full px-4 py-2">
              <span className="text-[#60a5fa] font-bold">{userPoints} ⭐</span>
            </div>
          </div>
        </div>

        {/* بطاقة الرصيد الرئيسية */}
        <div className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] rounded-3xl p-6 mb-6 shadow-2xl shadow-[#3b82f6]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">رصيدك الحالي</p>
              <p className="text-4xl font-bold text-white">${userBalance}</p>
              <p className="text-white/60 text-xs mt-2">{userPoints} نقطة = {pointsPerDollar} نقطة/دولار</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* زر المشاهدة الرئيسي */}
        <button
          onClick={onNavigateToAds}
          className="w-full bg-gradient-to-r from-[#ef4444] to-[#ec4899] hover:from-[#dc2626] hover:to-[#db2777] rounded-2xl p-5 mb-6 shadow-xl shadow-[#ef4444]/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="start-watching-btn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">ابدأ المشاهدة الآن</p>
                <p className="text-white/80 text-sm">اكسب {pointsPerAd} نقاط لكل إعلان</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* البيانات التحليلية */}
        <div className={`${cardClass} rounded-2xl p-5 mb-6 border`}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#60a5fa]" />
            <h3 className={`${textClass} font-bold`}>إحصائياتك</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* إعلانات اليوم */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className={`${textDimClass} text-xs`}>اليوم</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{watchedToday}</p>
              <p className={`${textDimClass} text-xs`}>من {dailyLimit} إعلان</p>
              <div className="mt-2 bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((watchedToday / dailyLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* المتبقي */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#60a5fa]" />
                <span className={`${textDimClass} text-xs`}>المتبقي</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{Math.max(dailyLimit - watchedToday, 0)}</p>
              <p className={`${textDimClass} text-xs`}>إعلان متاح</p>
              <p className="text-[#60a5fa] text-xs mt-2">= {Math.max(dailyLimit - watchedToday, 0) * pointsPerAd} نقطة ممكنة</p>
            </div>

            {/* إجمالي النقاط المكتسبة */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className={`${textDimClass} text-xs`}>إجمالي النقاط</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{user?.total_earned || userPoints}</p>
              <p className={`${textDimClass} text-xs`}>نقطة مكتسبة</p>
            </div>

            {/* معدل الكسب */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#a855f7]" />
                <span className={`${textDimClass} text-xs`}>معدل الكسب</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{pointsPerAd}</p>
              <p className={`${textDimClass} text-xs`}>نقاط/إعلان</p>
            </div>
          </div>
        </div>

        {/* التحدي اليومي */}
        {dailyChallenge && dailyChallenge.enabled && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{dailyChallenge.icon}</span>
              <div>
                <p className="text-amber-400 font-bold">التحدي اليومي</p>
                <p className={`${textMutedClass} text-sm`}>{dailyChallenge.title}</p>
              </div>
            </div>
            <p className={`${textMutedClass} text-sm mb-3`}>{dailyChallenge.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-white/10 rounded-full h-2 mr-4">
                <div 
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((watchedToday / dailyChallenge.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-amber-400 text-sm font-bold">+{dailyChallenge.reward} ⭐</span>
            </div>
            <p className={`${textDimClass} text-xs mt-2 text-center`}>
              {watchedToday >= dailyChallenge.target ? '🎉 أحسنت! أكملت التحدي' : `${watchedToday}/${dailyChallenge.target}`}
            </p>
          </div>
        )}

        {/* النصائح المتحركة */}
        {tips.length > 0 && (
          <div className={`${cardClass} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">{tips[currentTip % tips.length]?.icon || '💡'}</span>
              <p className={`${textMutedClass} text-sm`}>{tips[currentTip % tips.length]?.text || ''}</p>
            </div>
          </div>
        )}

        {/* معلومات سريعة */}
        <div className={`mt-6 ${cardClass} rounded-2xl p-4 border`}>
          <h4 className={`${textClass} font-bold mb-3 text-sm`}>كيف تكسب؟</h4>
          <div className="space-y-2 text-sm">
            <p className={textMutedClass}>✓ شاهد إعلان كامل = <span className="text-green-400">{pointsPerAd} نقاط</span></p>
            <p className={textMutedClass}>✓ أكمل التحدي اليومي = <span className="text-amber-400">مكافأة إضافية</span></p>
            <p className={textMutedClass}>✓ {pointsPerDollar} نقطة = <span className="text-cyan-400">$1 دولار</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
