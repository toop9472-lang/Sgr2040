import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Gift, TrendingUp, Clock, Star, Play, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const HomePage = ({ user, onNavigateToAds }) => {
  const { t } = useLanguage();
  const [currentTip, setCurrentTip] = useState(0);

  // نصائح ترفيهية
  const tips = [
    { icon: '💡', text: 'شاهد 10 إعلانات = 50 نقطة!' },
    { icon: '🎯', text: 'كل 500 نقطة = 1 دولار' },
    { icon: '⚡', text: 'الإعلانات الجديدة تعطي نقاط أكثر' },
    { icon: '🏆', text: 'حقق التحديات اليومية لمضاعفة النقاط' },
    { icon: '🎁', text: 'سجل يومياً للحصول على مكافآت' },
  ];

  // تحدي يومي عشوائي
  const challenges = [
    { title: 'المشاهد النشط', target: 5, reward: 25, icon: '👁️', desc: 'شاهد 5 إعلانات' },
    { title: 'جامع النقاط', target: 50, reward: 30, icon: '⭐', desc: 'اكسب 50 نقطة' },
    { title: 'المثابر', target: 10, reward: 50, icon: '🔥', desc: 'شاهد 10 إعلانات متتالية' },
  ];

  // اختيار التحدي اليومي عند التحميل
  const today = new Date().getDate();
  const dailyChallenge = challenges[today % challenges.length];

  useEffect(() => {
    // تغيير النصيحة كل 4 ثواني
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [tips.length]);

  const userPoints = user?.points || 0;
  const userBalance = (userPoints / 500).toFixed(2);
  const watchedToday = user?.watched_today || 0;
  const dailyLimit = 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 pb-24">
      {/* Header مع ترحيب */}
      <div className="pt-12 px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">مرحباً {user?.name || 'صديقي'} 👋</h1>
            <p className="text-purple-300 text-sm mt-1">جاهز لكسب المزيد اليوم؟</p>
          </div>
          <div className="bg-yellow-500/20 rounded-2xl px-4 py-2">
            <span className="text-yellow-400 font-bold">{userPoints} ⭐</span>
          </div>
        </div>

        {/* بطاقة الرصيد الرئيسية */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">رصيدك الحالي</p>
              <p className="text-4xl font-bold text-white">${userBalance}</p>
              <p className="text-white/60 text-xs mt-2">{userPoints} نقطة</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* زر المشاهدة الرئيسي */}
        <button
          onClick={onNavigateToAds}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-2xl p-5 mb-6 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="start-watching-btn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">ابدأ المشاهدة الآن</p>
                <p className="text-white/80 text-sm">اكسب 5 نقاط لكل إعلان</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* التحدي اليومي */}
        {dailyChallenge && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{dailyChallenge.icon}</span>
              <div>
                <p className="text-amber-400 font-bold">التحدي اليومي</p>
                <p className="text-white/70 text-sm">{dailyChallenge.title}</p>
              </div>
            </div>
            <p className="text-white/80 text-sm mb-3">{dailyChallenge.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-black/30 rounded-full h-2 mr-4">
                <div 
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((watchedToday / dailyChallenge.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-amber-400 text-sm font-bold">+{dailyChallenge.reward} ⭐</span>
            </div>
          </div>
        )}

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white/70 text-sm">اليوم</span>
            </div>
            <p className="text-white text-2xl font-bold">{watchedToday}/{dailyLimit}</p>
            <p className="text-white/50 text-xs">إعلان</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-white/70 text-sm">المتبقي</span>
            </div>
            <p className="text-white text-2xl font-bold">{dailyLimit - watchedToday}</p>
            <p className="text-white/50 text-xs">إعلان متاح</p>
          </div>
        </div>

        {/* النصائح المتحركة */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">{tips[currentTip].icon}</span>
            <p className="text-white/80 text-sm">{tips[currentTip].text}</p>
          </div>
        </div>

        {/* الإنجازات السريعة */}
        <div className="mt-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            إنجازاتك
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: '🌟', name: 'البداية', done: userPoints >= 5 },
              { icon: '🔥', name: 'نشط', done: userPoints >= 50 },
              { icon: '💎', name: 'محترف', done: userPoints >= 100 },
              { icon: '👑', name: 'ملك', done: userPoints >= 500 },
              { icon: '🚀', name: 'أسطورة', done: userPoints >= 1000 },
            ].map((achievement, idx) => (
              <div 
                key={idx}
                className={`flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                  achievement.done 
                    ? 'bg-gradient-to-br from-yellow-500/30 to-amber-500/30 border border-yellow-500/50' 
                    : 'bg-white/5 border border-white/10 opacity-50'
                }`}
              >
                <span className="text-2xl mb-1">{achievement.icon}</span>
                <span className="text-white/70 text-[10px]">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
