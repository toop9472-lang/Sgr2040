import React, { useState, useEffect } from "react";
import "./App.css";
import AuthPage from "./components/AuthPage";
import AdViewer from "./components/AdViewer";
import ProfilePage from "./components/ProfilePage";
import WithdrawPage from "./components/WithdrawPage";
import BottomNav from "./components/BottomNav";
import { Toaster } from "./components/ui/toaster";
import { mockAds, mockUser } from "./mockData";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [watchedAds, setWatchedAds] = useState([]);

  // Load user data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('saqr_user');
    const savedWatchedAds = localStorage.getItem('saqr_watched_ads');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    if (savedWatchedAds) {
      setWatchedAds(JSON.parse(savedWatchedAds));
    }
  }, []);

  // Save user data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('saqr_user', JSON.stringify(user));
    }
  }, [user]);

  // Save watched ads to localStorage
  useEffect(() => {
    localStorage.setItem('saqr_watched_ads', JSON.stringify(watchedAds));
  }, [watchedAds]);

  const handleLogin = (userData) => {
    const newUser = {
      ...mockUser,
      ...userData,
      points: 0,
      totalEarned: 0,
      watchedAds: [],
      joinedDate: new Date().toISOString()
    };
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('saqr_user');
    localStorage.removeItem('saqr_watched_ads');
    setIsAuthenticated(false);
    setUser(null);
    setWatchedAds([]);
    setCurrentPage('home');
  };

  const handleAdWatched = (adId, points) => {
    // Check if ad was already watched (anti-cheat)
    if (watchedAds.includes(adId)) {
      return;
    }

    setUser(prev => ({
      ...prev,
      points: prev.points + points,
      totalEarned: prev.totalEarned + points,
      watchedAds: [...prev.watchedAds, adId]
    }));

    setWatchedAds(prev => [...prev, adId]);
  };

  const handleWithdrawRequest = (request) => {
    // Deduct points after admin approval (for now just simulate)
    setUser(prev => ({
      ...prev,
      points: prev.points - request.points
    }));
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
