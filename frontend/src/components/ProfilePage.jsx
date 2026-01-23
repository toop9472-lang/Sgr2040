import React from 'react';
import { User, Award, TrendingUp, Clock, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';

const ProfilePage = ({ user, onLogout, onNavigate }) => {
  const pointsToNextDollar = 500 - (user.points % 500);
  const progressToNextDollar = ((user.points % 500) / 500) * 100;
  const isGuest = user?.isGuest || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 pt-8 pb-24 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-white text-2xl font-bold">الملف الشخصي</h1>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <LogOut size={20} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-white text-xl font-bold">{user.name}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {isGuest && (
              <div className="mt-1 bg-yellow-500/20 text-yellow-100 px-2 py-1 rounded text-xs">
                👤 وضع الزائر
              </div>
            )}
            {!isGuest && (
              <p className="text-white/60 text-xs mt-1">
                عضو منذ {new Date(user.joined_date || user.joinedDate).toLocaleDateString('ar-SA')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 space-y-4">
        {/* Guest Warning */}
        {isGuest && (
          <Card className="shadow-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h3 className="font-bold text-lg mb-2">أنت في وضع الزائر</h3>
                <p className="text-sm text-gray-600 mb-4">
                  سجّل الدخول للحصول على النقاط وكسب المال!
                </p>
                <Button
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  تسجيل الدخول الآن
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Card */}
        {!isGuest && (
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Award className="text-yellow-500" size={24} />
                رصيد النقاط
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {user.points}
              </div>
              <p className="text-gray-600">نقطة متاحة</p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">التقدم نحو $1</span>
                <span className="text-sm font-bold text-indigo-600">
                  {pointsToNextDollar} نقطة متبقية
                </span>
              </div>
              <Progress value={progressToNextDollar} className="h-3" />
            </div>

            <Button
              onClick={() => onNavigate('withdraw')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 shadow-md hover:shadow-lg transition-all"
              disabled={user.points < 500}
            >
              {user.points >= 500 ? 'استبدال النقاط' : `تحتاج ${pointsToNextDollar} نقطة للاستبدال`}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Stats Cards */}
        {!isGuest && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  ${(user.totalEarned / 500).toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 mt-1">إجمالي الأرباح</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {user.watchedAds.length}
                </div>
                <p className="text-xs text-gray-600 mt-1">إعلان مشاهد</p>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Info Card */}
        {!isGuest && (
          <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="text-lg">كيف يعمل النظام؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">1</span>
              </div>
              <p className="text-sm text-gray-600">شاهد الإعلانات واحصل على نقطة واحدة لكل دقيقة</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">2</span>
              </div>
              <p className="text-sm text-gray-600">اجمع 500 نقطة لاستبدالها بـ $1</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold">3</span>
              </div>
              <p className="text-sm text-gray-600">اطلب السحب وانتظر موافقة الإدارة</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold">⚠️</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">كل إعلان يُحسب مرة واحدة فقط - منع الغش</p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;