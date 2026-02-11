import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Play, ChevronRight, BarChart3, Award, Calendar, Zap, Moon, Sun, Sparkles, Gift, Target } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center relative overflow-hidden`}>
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#FFD700]/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#FFD700]/15 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
        
        {/* Logo with Glow */}
        <motion.div 
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-0 bg-[#FFD700]/30 rounded-full blur-xl" />
          <div className="relative w-24 h-24 rounded-full bg-[#0a0a0f] border-2 border-[#FFD700]/50 flex items-center justify-center overflow-hidden shadow-lg shadow-[#FFD700]/30">
            <img src="/logo_saqr.png" alt="صقر" className="w-20 h-20 object-contain" />
          </div>
        </motion.div>
        
        <motion.div 
          className={`${textClass} text-lg mt-4`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          جاري التحميل...
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-28 relative overflow-y-auto overflow-x-hidden`}>
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#FFD700]/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
      
      {/* Decorative Glow Circles */}
      <motion.div 
        className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#FFD700]/20 blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="fixed bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#FFD700]/15 blur-3xl pointer-events-none"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Header مع الشعار والترحيب */}
      <div className="relative z-10 pt-8 px-5 pb-6">
        {/* شعار التطبيق واسمه */}
        <motion.div 
          className="flex items-center justify-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 bg-[#FFD700]/30 rounded-full blur-md" />
              <div className="relative w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-[#FFD700]/50 flex items-center justify-center overflow-hidden shadow-lg shadow-[#FFD700]/30">
                <img src="/logo_saqr.png" alt="صقر" className="w-11 h-11 object-contain" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">صقر</h1>
          </div>
        </motion.div>
        
        {/* ترحيب المستخدم */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>مرحباً {user?.name || 'صديقي'} 👋</h2>
            <p className={`${textMutedClass} text-sm mt-1`}>جاهز لكسب المزيد اليوم؟</p>
          </div>
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-full px-4 py-2 shadow-lg shadow-[#FFD700]/10">
              <span className="text-[#FFD700] font-bold">{userPoints} ⭐</span>
            </div>
          </motion.div>
        </motion.div>

        {/* بطاقة الرصيد الرئيسية - Premium Design */}
        <motion.div 
          className="relative mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700]/30 to-[#FFA500]/30 rounded-3xl blur-xl opacity-75" />
          
          <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] rounded-3xl p-6 border border-[#FFD700]/30 shadow-2xl overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD700] rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFA500] rounded-full -ml-16 -mb-16 blur-2xl" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFD700]" />
                  رصيدك الحالي
                </p>
                <motion.p 
                  className="text-5xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent"
                  animate={{ textShadow: ['0 0 10px #FFD700', '0 0 20px #FFD700', '0 0 10px #FFD700'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ${userBalance}
                </motion.p>
                <p className="text-white/50 text-xs mt-2">{userPoints} نقطة = {pointsPerDollar} نقطة/دولار</p>
              </div>
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 rounded-full flex items-center justify-center border border-[#FFD700]/30"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <TrendingUp className="w-10 h-10 text-[#FFD700]" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* زر المشاهدة الرئيسي - Premium Animated Button */}
        <motion.button
          onClick={onNavigateToAds}
          className="w-full relative mb-6 group"
          data-testid="start-watching-btn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated Glow */}
          <motion.div 
            className="absolute -inset-1 rounded-2xl opacity-75"
            style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899, #ef4444)' }}
            animate={{ 
              boxShadow: ['0 0 20px #ef4444', '0 0 40px #ec4899', '0 0 20px #ef4444']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative bg-gradient-to-r from-[#ef4444] to-[#ec4899] rounded-2xl p-5 shadow-xl overflow-hidden">
            {/* Shimmer Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Play className="w-8 h-8 text-white fill-white" />
                </motion.div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">ابدأ المشاهدة الآن</p>
                  <p className="text-white/80 text-sm">اكسب {pointsPerAd} نقاط لكل إعلان ✨</p>
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.button>

        {/* البيانات التحليلية - Animated Cards */}
        <motion.div 
          className="bg-[#111118]/80 backdrop-blur-xl rounded-2xl p-5 mb-6 border border-white/10 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#FFD700]" />
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
        </motion.div>

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
