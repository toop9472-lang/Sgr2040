import React, { useState, useEffect } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";
import AdViewer from "./components/AdViewer";
import ProfilePage from "./components/ProfilePage";
import WithdrawPage from "./components/WithdrawPage";
import AdvertiserPage from "./components/AdvertiserPage";
import BottomNav from "./components/BottomNav";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./hooks/use-toast";
import { authAPI, userAPI, adAPI, withdrawalAPI, getToken } from "./services/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.user);
          setIsAuthenticated(true);
          
          // Load ads
          const adsData = await adAPI.getAds();
          setAds(adsData);
        } catch (error) {
          console.error('Auth check failed:', error);
          authAPI.logout();
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const handleLogin = async (userData) => {
    try {
      setIsLoading(true);
      
      // If guest mode, skip backend login
      if (userData.isGuest) {
        setUser({
          ...userData,
          points: 0,
          total_earned: 0,
          watched_ads: [],
          joined_date: new Date().toISOString()
        });
        setIsAuthenticated(true);
        
        // Load ads with mock data for guests
        setAds([
          {
            id: '1',
            title: 'إعلان سامسونج الجديد',
            description: 'اكتشف هاتف سامسونج الجديد مع تقنية الذكاء الاصطناعي',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
            advertiser: 'Samsung',
            duration: 60,
            points: 1
          },
          {
            id: '2',
            title: 'عرض خاص من أمازون',
            description: 'تخفيضات تصل إلى 50% على جميع المنتجات',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400',
            advertiser: 'Amazon',
            duration: 60,
            points: 1
          },
          {
            id: '3',
            title: 'مطعم الذواقة',
            description: 'وجبات شهية وعروض حصرية لفترة محدودة',
            video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            advertiser: 'Gourmet Restaurant',
            duration: 60,
            points: 1
          }
        ]);
        
        toast({
          title: '👋 مرحباً بك كزائر',
          description: 'يمكنك تصفح الإعلانات. سجّل الدخول لكسب النقاط!',
        });
        
        setIsLoading(false);
        return;
      }
      
      const response = await authAPI.login(userData.provider, userData);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Load ads
      const adsData = await adAPI.getAds();
      setAds(adsData);
      
      toast({
        title: '✅ تم تسجيل الدخول',
        description: `مرحباً ${response.user.name}!`,
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: '❌ فشل تسجيل الدخول',
        description: 'حدث خطأ، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAds([]);
    setCurrentPage('home');
    
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً!',
    });
  };

  const handleAdWatched = async (adId, watchTime) => {
    try {
      const response = await adAPI.watchAd(adId, watchTime);
      
      // Refresh user data to get updated points
      await refreshUser();
      
      return response;
    } catch (error) {
      console.error('Watch ad error:', error);
      
      if (error.response?.status === 400) {
        toast({
          title: '⚠️ تنبيه',
          description: error.response.data.detail || 'لقد شاهدت هذا الإعلان بالفعل',
          variant: 'destructive'
        });
      }
      
      throw error;
    }
  };

  const handleWithdrawRequest = async (request) => {
    try {
      const response = await withdrawalAPI.createWithdrawal(request);
      
      // Refresh user data
      await refreshUser();
      
      return response;
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw error;
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Show advertiser page for non-authenticated users
  if (currentPage === 'advertiser-preview') {
    return (
      <>
        <AdvertiserPage onNavigate={(page) => {
          if (page === 'home') {
            setCurrentPage('home');
            setIsAuthenticated(false);
          } else {
            setCurrentPage(page);
          }
        }} />
        <Toaster />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-4xl">🦅</span>
          </div>
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setCurrentPage('advertiser-preview')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2"
          >
            <span>💼</span>
            <span>أضف إعلانك</span>
          </button>
        </div>
        <Toaster />
      </>
    );
  }

  return (
    <div className="App">
      {currentPage === 'home' && (
        <AdViewer 
          ads={ads} 
          onAdWatched={handleAdWatched}
          user={user}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage 
          user={user} 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'advertiser' && (
        <AdvertiserPage 
          onNavigate={handleNavigate}
        />
      )}
      {currentPage === 'withdraw' && (
        <WithdrawPage 
          user={user}
          onNavigate={handleNavigate}
          onWithdrawRequest={handleWithdrawRequest}
        />
      )}
      {currentPage !== 'withdraw' && (
        <BottomNav 
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App;
