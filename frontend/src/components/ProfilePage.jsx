import React from 'react';
import { User, Award, TrendingUp, Clock, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { useLanguage } from '../i18n/LanguageContext';

const ProfilePage = ({ user, onLogout, onNavigate }) => {
  const { t, isRTL, language } = useLanguage();
  const pointsToNextDollar = 500 - (user.points % 500);
  const progressToNextDollar = ((user.points % 500) / 500) * 100;
  const isGuest = user?.isGuest || false;

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 relative overflow-hidden">
      {/* Decorative Blue Circles */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-4 pt-8 pb-24 rounded-b-3xl shadow-lg shadow-[#3b82f6]/20">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-white text-2xl font-bold">{t('profile')}</h1>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title={t('logout')}
          >
            <LogOut size={20} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white/20 shadow-lg">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-[#111118] text-white text-2xl">{user.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-white text-xl font-bold">{user.name}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {isGuest && (
              <div className="mt-1 bg-[#3b82f6]/30 text-[#60a5fa] px-2 py-1 rounded text-xs">
                👤 {t('guestModeLabel')}
              </div>
            )}
            {!isGuest && user.joined_date && (
              <p className="text-white/60 text-xs mt-1">
                {isRTL ? 'عضو منذ' : 'Member since'} {new Date(user.joined_date || user.joinedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-16 space-y-4">
        {/* Guest Warning */}
        {isGuest && (
          <Card className="shadow-xl border border-[#3b82f6]/30 bg-[#111118]/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h3 className="font-bold text-lg mb-2 text-white">
                  {isRTL ? 'أنت في وضع الزائر' : "You're in Guest Mode"}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {isRTL ? 'سجّل الدخول للحصول على النقاط وكسب المال!' : 'Login to earn points and make money!'}
                </p>
                <Button
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] rounded-full"
                >
                  {isRTL ? 'تسجيل الدخول الآن' : 'Login Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Card */}
        {!isGuest && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="text-[#60a5fa]" size={24} />
                {isRTL ? 'رصيد النقاط' : 'Points Balance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-[#60a5fa] mb-2">
                {user.points}
              </div>
              <p className="text-gray-400">{isRTL ? 'نقطة متاحة' : 'points available'}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  {isRTL ? 'التقدم نحو $1' : 'Progress to $1'}
                </span>
                <span className="text-sm font-bold text-[#60a5fa]">
                  {pointsToNextDollar} {isRTL ? 'نقطة متبقية' : 'points remaining'}
                </span>
              </div>
              <Progress value={progressToNextDollar} className="h-3" />
            </div>

            <Button
              onClick={() => onNavigate('withdraw')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 shadow-md hover:shadow-lg transition-all"
              disabled={user.points < 500}
            >
              {user.points >= 500 
                ? (isRTL ? 'استبدال النقاط' : 'Redeem Points')
                : (isRTL ? `تحتاج ${pointsToNextDollar} نقطة للاستبدال` : `Need ${pointsToNextDollar} more points`)}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Stats Cards */}
        {!isGuest && (
          <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-white">
                  ${((user.totalEarned || user.total_earned || 0) / 500).toFixed(2)}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t('totalEarned')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#3b82f6]/20 flex items-center justify-center mb-2">
                  <Clock className="text-[#60a5fa]" size={24} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {(user.watchedAds || user.watched_ads || []).length}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t('watchedAds')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Info Card */}
        {!isGuest && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              {isRTL ? 'كيف يعمل النظام؟' : 'How It Works?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#60a5fa] font-bold">1</span>
              </div>
              <p className="text-sm text-gray-400">
                {isRTL 
                  ? 'شاهد الإعلانات واحصل على نقطة واحدة لكل دقيقة'
                  : 'Watch ads and earn 1 point per minute'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#60a5fa] font-bold">2</span>
              </div>
              <p className="text-sm text-gray-400">
                {isRTL 
                  ? 'اجمع 500 نقطة لاستبدالها بـ $1'
                  : 'Collect 500 points to redeem $1'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#60a5fa] font-bold">3</span>
              </div>
              <p className="text-sm text-gray-400">
                {isRTL 
                  ? 'اطلب السحب وانتظر موافقة الإدارة'
                  : 'Request withdrawal and wait for approval'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 font-bold">⚠️</span>
              </div>
              <p className="text-sm text-gray-400 font-medium">
                {isRTL 
                  ? 'كل إعلان يُحسب مرة واحدة فقط - منع الغش'
                  : 'Each ad counts once only - anti-cheat'}
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
