import React, { useState, useEffect } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";
import AdViewer from "./components/AdViewer";
import ProfilePage from "./components/ProfilePage";
import WithdrawPage from "./components/WithdrawPage";
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

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="App">
      {currentPage === 'home' && (
        <AdViewer 
          ads={mockAds} 
          onAdWatched={handleAdWatched}
          watchedAds={watchedAds}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage 
          user={user} 
          onLogout={handleLogout}
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
