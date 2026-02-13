import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Home, User, PlusCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import AdViewer from './AdViewer';
import ProfilePage from './ProfilePage';
import AdvertiserPage from './AdvertiserPage';
import AIFloatingButton from './AIFloatingButton';
import FullScreenAdsViewer from './FullScreenAdsViewer';
import SettingsPage from './SettingsPage';

const SwipeableApp = ({ 
  user, 
  ads,
  onLogout, 
  onAdWatched,
  onWithdrawRequest,
  refreshUser
}) => {
  const { t } = useLanguage();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isInAdsViewer, setIsInAdsViewer] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);

  const MIN_SWIPE_DISTANCE = 50;

  // الصفحات الأساسية (بدون النجمة والنقاط)
  const pages = [
    { id: 'home', label: t('home'), icon: Home, component: 'home' },
    { id: 'advertiser', label: t('advertiseNow'), icon: PlusCircle, component: 'advertiser' },
    { id: 'profile', label: t('profile'), icon: User, component: 'profile' },
    { id: 'ads', label: 'إعلانات', icon: Play, component: 'ads', highlight: true },
  ];

  // معالجة السحب الأفقي بين الصفحات
  const handleTouchStart = (e) => {
    if (isInAdsViewer) return;
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (isInAdsViewer || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;

    // فقط السحب الأفقي
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
      setTouchEnd({ x: currentX, y: currentY });
    }
  };

  const handleTouchEnd = () => {
    if (isInAdsViewer) return;
    setIsDragging(false);

    const diffX = touchEnd.x - touchStart.x;
    
    if (Math.abs(diffX) > MIN_SWIPE_DISTANCE) {
      if (diffX > 0 && currentPageIndex > 0) {
        // سحب لليمين - الصفحة السابقة
        setCurrentPageIndex(prev => prev - 1);
      } else if (diffX < 0 && currentPageIndex < pages.length - 1) {
        // سحب لليسار - الصفحة التالية
        setCurrentPageIndex(prev => prev + 1);
      }
    }
    
    setDragOffset(0);
  };

  // التنقل المباشر
  const navigateToPage = (index) => {
    if (pages[index].id === 'ads') {
      setIsInAdsViewer(true);
    } else {
      setCurrentPageIndex(index);
    }
  };

  // الخروج من عارض الإعلانات
  const handleExitAdsViewer = () => {
    setIsInAdsViewer(false);
  };

  // معالجة النقاط المكتسبة
  const handlePointsEarned = useCallback(async (points) => {
    if (refreshUser) {
      await refreshUser();
    }
  }, [refreshUser]);

  // التنقل للسحب
  const handleNavigate = (page) => {
    const index = pages.findIndex(p => p.id === page);
    if (index !== -1) {
      if (page === 'ads') {
        setIsInAdsViewer(true);
      } else {
        setCurrentPageIndex(index);
      }
    }
  };

  // عرض عارض الإعلانات بشاشة كاملة
  if (isInAdsViewer) {
    return (
      <FullScreenAdsViewer
        user={user}
        onClose={handleExitAdsViewer}
        onPointsEarned={handlePointsEarned}
      />
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* مؤشر الصفحات */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        {pages.map((page, idx) => (
          <button
            key={page.id}
            onClick={() => navigateToPage(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentPageIndex 
                ? page.highlight 
                  ? 'w-6 bg-gradient-to-r from-red-500 to-pink-500' 
                  : 'w-6 bg-indigo-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            data-testid={`page-indicator-${page.id}`}
          />
        ))}
      </div>

      {/* تلميحات السحب */}
      {currentPageIndex > 0 && (
        <div className="fixed left-2 top-1/2 -translate-y-1/2 z-20 opacity-30">
          <ChevronLeft className="w-8 h-8 text-gray-500 animate-pulse" />
        </div>
      )}
      {currentPageIndex < pages.length - 1 && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-20 opacity-30">
          <ChevronRight className="w-8 h-8 text-gray-500 animate-pulse" />
        </div>
      )}

      {/* محتوى الصفحة مع تأثير السحب */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateX(${isDragging ? dragOffset * 0.3 : 0}px)` 
        }}
      >
        {currentPage.id === 'home' && (
          <>
            <AdViewer 
              ads={ads} 
              onAdWatched={onAdWatched}
              user={user}
            />
            <AIFloatingButton user={user} />
          </>
        )}
        
        {currentPage.id === 'profile' && (
          <ProfilePage 
            user={user} 
            onLogout={onLogout}
            onNavigate={handleNavigate}
          />
        )}
        
        {currentPage.id === 'advertiser' && (
          <AdvertiserPage 
            onNavigate={handleNavigate}
          />
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {pages.map((page, idx) => {
            const Icon = page.icon;
            const isActive = idx === currentPageIndex;
            return (
              <button
                key={page.id}
                onClick={() => navigateToPage(idx)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                  page.highlight 
                    ? 'text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`nav-${page.id}`}
              >
                <Icon size={page.highlight ? 24 : 22} className={isActive || page.highlight ? 'stroke-[2.5]' : 'stroke-2'} />
                <span className={`text-[10px] ${isActive || page.highlight ? 'font-semibold' : 'font-medium'}`}>
                  {page.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SwipeableApp;
