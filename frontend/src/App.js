import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import AuthCallback from "./components/AuthCallback";
import AdViewer from "./components/AdViewer";
import ProfilePage from "./components/ProfilePage";
import WithdrawPage from "./components/WithdrawPage";
import AdvertiserPage from "./components/AdvertiserPage";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminDashboard from "./components/AdminDashboard";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancel from "./components/PaymentCancel";
import BottomNav from "./components/BottomNav";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./hooks/use-toast";
import { adAPI } from "./services/api";
import { LanguageProvider } from "./i18n/LanguageContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Router wrapper to detect session_id in URL
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (from Google OAuth)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return <MainApp />;
}

function MainApp() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);
  const [user, setUser] = useState(location.state?.user || null);
  const [ads, setAds] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);

  // Check if user is authenticated on load
  useEffect(() => {
    // Skip if user came from AuthCallback
    if (location.state?.user) {
      setIsLoading(false);
      loadAds();
      return;
    }

    const checkAuth = async () => {
      // Check admin first
      const adminToken = localStorage.getItem('admin_token');
      const savedAdmin = localStorage.getItem('admin_data');
      
      if (adminToken && savedAdmin) {
        setIsAdmin(true);
        setAdminData(JSON.parse(savedAdmin));
        setIsLoading(false);
        return;
      }
      
      // Check user session via /auth/me
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
          await loadAds();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [location.state]);

  const loadAds = async () => {
    try {
      const adsData = await adAPI.getAds();
      setAds(adsData);
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const handleLogin = async (userData) => {
    try {
      setIsLoading(true);
      
      // If guest mode, skip backend login but load real ads
      if (userData.isGuest) {
        setUser({
          ...userData,
          points: 0,
          total_earned: 0,
          watched_ads: [],
          joined_date: new Date().toISOString()
        });
        setIsAuthenticated(true);
        
        // Load real ads from API for guests
        try {
          const adsData = await adAPI.getAds();
          setAds(adsData);
        } catch (error) {
          console.error('Failed to load ads:', error);
          setAds([]);
        }
        
        toast({
          title: '👋 مرحباً بك كزائر',
          description: 'يمكنك تصفح الإعلانات. سجّل الدخول لكسب النقاط!',
        });
        
        setIsLoading(false);
        return;
      }
      
      // For email/social login, user data comes from auth response
      setUser(userData);
      setIsAuthenticated(true);
      
      // Load ads
      await loadAds();
      
      toast({
        title: '✅ تم تسجيل الدخول',
        description: `مرحباً ${userData.name}!`,
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

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
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
    // If guest, show message to login
    if (user?.isGuest) {
      toast({
        title: '🔒 سجّل الدخول لكسب النقاط',
        description: 'قم بتسجيل الدخول للحصول على نقاط عند مشاهدة الإعلانات',
        variant: 'default'
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/ads/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ad_id: adId, watch_time: watchTime })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400) {
          toast({
            title: '⚠️ تنبيه',
            description: data.detail || 'لقد شاهدت هذا الإعلان بالفعل',
            variant: 'destructive'
          });
        }
        throw new Error(data.detail);
      }
      
      // Refresh user data to get updated points
      await refreshUser();
      
      toast({
        title: '🎉 رائع!',
        description: `حصلت على ${data.points_earned} نقطة!`,
      });
      
      return data;
    } catch (error) {
      console.error('Watch ad error:', error);
      throw error;
    }
  };

  const handleWithdrawRequest = async (request) => {
    try {
      const response = await fetch(`${API_URL}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail);
      }
      
      // Refresh user data
      await refreshUser();
      
      return data;
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw error;
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleAdminLogin = (admin) => {
    setIsAdmin(true);
    setAdminData(admin);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    setIsAdmin(false);
    setAdminData(null);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً!',
    });
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

  // Admin routes should be accessible without user authentication
  return (
    <Routes>
      {/* Admin Routes - accessible without user auth */}
      <Route path="/admin/login" element={
        isAdmin ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage onAdminLogin={handleAdminLogin} />
      } />
      <Route path="/admin/dashboard" element={
        isAdmin ? <AdminDashboard admin={adminData} onLogout={handleAdminLogout} /> : <Navigate to="/admin/login" />
      } />
      
      {/* Payment Routes */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      
      {/* User Routes */}
      <Route path="/*" element={
        <>
          {currentPage === 'advertiser-preview' ? (
            <AdvertiserPage onNavigate={(page) => {
              if (page === 'home') {
                setCurrentPage('home');
                setIsAuthenticated(false);
              } else {
                setCurrentPage(page);
              }
            }} />
          ) : !isAuthenticated ? (
            <>
              <AuthPage onLogin={handleLogin} onGuestMode={handleLogin} />
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                  onClick={() => setCurrentPage('advertiser-preview')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2"
                  data-testid="add-your-ad-btn"
                >
                  <span>💼</span>
                  <span>أضف إعلانك</span>
                </button>
              </div>
              <Toaster />
            </>
          ) : (
            <>
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
            </>
          )}
        </>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <AppRouter />
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
