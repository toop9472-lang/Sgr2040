import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FullScreenAdsViewer = ({ user, onClose, onPointsEarned }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const watchTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);

  const REQUIRED_WATCH_TIME = 30;
  const POINTS_PER_AD = 5;
  const MIN_SWIPE_DISTANCE_Y = 50; // للتنقل بين الإعلانات (أعلى/أسفل)
  const MIN_SWIPE_DISTANCE_X = 80; // للخروج (يمين/يسار)

  // Load ads
  useEffect(() => {
    loadAds();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // Start watching when ad changes
  useEffect(() => {
    if (ads.length > 0) {
      startWatching();
    }
  }, [currentIndex, ads]);

  // Hide controls after 2 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [showControls]);

  const loadAds = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ads`);
      const data = await response.json();
      if (data && data.length > 0) {
        // Shuffle ads for variety
        const shuffled = data.sort(() => Math.random() - 0.5);
        setAds(shuffled);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startWatching = () => {
    setWatchTime(0);
    setIsWatching(true);
    
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    watchTimerRef.current = setInterval(() => {
      setWatchTime(prev => {
        if (prev >= REQUIRED_WATCH_TIME) {
          clearInterval(watchTimerRef.current);
          completeAdWatch();
          return REQUIRED_WATCH_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const completeAdWatch = async () => {
    setIsWatching(false);
    const points = POINTS_PER_AD;
    setEarnedPoints(prev => prev + points);
    
    // Show points animation
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 2000);
    
    // Notify parent
    if (onPointsEarned) {
      onPointsEarned(points);
    }

    // Record view if user is logged in
    const token = localStorage.getItem('user_token') || localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/api/rewarded-ads/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ad_type: 'video',
            ad_id: ads[currentIndex]?.id,
            completed: true,
            watch_duration: REQUIRED_WATCH_TIME
          })
        });
      } catch (e) {
        console.log('Failed to record view');
      }
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    if (!e.targetTouches || !e.targetTouches[0]) return;
    setTouchEndY(null);
    setTouchEndX(null);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches || !e.targetTouches[0]) return;
    setTouchEndY(e.targetTouches[0].clientY);
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartY || !touchStartX) return;
    
    const distanceY = touchStartY - (touchEndY || touchStartY);
    const distanceX = touchStartX - (touchEndX || touchStartX);
    
    // تحديد الاتجاه الرئيسي للسحب
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // سحب أفقي - للخروج
      if (Math.abs(distanceX) > MIN_SWIPE_DISTANCE_X) {
        onClose(); // الخروج يمين أو يسار
      }
    } else {
      // سحب عمودي - للتنقل بين الإعلانات
      const isSwipeUp = distanceY > MIN_SWIPE_DISTANCE_Y;
      const isSwipeDown = distanceY < -MIN_SWIPE_DISTANCE_Y;
      
      if (isSwipeUp && currentIndex < ads.length - 1) {
        goToNext();
      } else if (isSwipeDown && currentIndex > 0) {
        goToPrevious();
      }
    }
    
    // إعادة تعيين
    setTouchStartY(null);
    setTouchStartX(null);
    setTouchEndY(null);
    setTouchEndX(null);
  };

  const goToNext = () => {
    if (transitioning || currentIndex >= ads.length - 1) return;
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    if (transitioning || currentIndex <= 0) return;
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setTransitioning(false);
    }, 300);
  };

  const handleScreenTap = () => {
    setShowControls(true);
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp' || e.key === 'k') {
      goToPrevious();
    } else if (e.key === 'ArrowDown' || e.key === 'j') {
      goToNext();
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'm') {
      setIsMuted(prev => !prev);
    }
  }, [currentIndex, ads.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll wheel support
  const handleWheel = (e) => {
    if (e.deltaY > 50) {
      goToNext();
    } else if (e.deltaY < -50) {
      goToPrevious();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-xl mb-4">لا توجد إعلانات متاحة حالياً</p>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-white/20 rounded-full"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentIndex];
  const progress = (watchTime / REQUIRED_WATCH_TIME) * 100;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onClick={handleScreenTap}
    >
      {/* Video/Ad Content - Full Screen */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {currentAd.video_url ? (
          <video
            ref={videoRef}
            src={currentAd.video_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: currentAd.thumbnail_url 
                ? `url(${currentAd.thumbnail_url})` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {/* Ad content overlay - minimal */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              <div className="absolute bottom-20 left-6 right-6">
                <h2 className="text-white text-xl font-bold mb-1">{currentAd.title}</h2>
                <p className="text-white/70 text-sm line-clamp-2">{currentAd.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar - Top (رفيع جداً) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-10">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* عداد الوقت - يظهر فقط عند اللمس */}
      <div 
        className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          <span className="text-white text-xs font-medium">
            {watchTime >= REQUIRED_WATCH_TIME ? (
              <span className="text-yellow-400">✓ +{POINTS_PER_AD}</span>
            ) : (
              <span>{REQUIRED_WATCH_TIME - watchTime}s</span>
            )}
          </span>
        </div>
      </div>

      {/* زر كتم الصوت - يظهر فقط عند اللمس */}
      <div 
        className={`absolute top-4 left-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* نقاط مكتسبة - تظهر في الوسط عند الإكمال */}
      {showPointsAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="animate-bounce">
            <span className="text-yellow-400 text-5xl font-bold drop-shadow-lg">+{POINTS_PER_AD}</span>
          </div>
        </div>
      )}

      {/* إجمالي النقاط المكتسبة في الجلسة */}
      {earnedPoints > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-yellow-500/90 backdrop-blur-sm rounded-full px-4 py-1.5">
            <span className="text-black font-bold text-sm">
              ⭐ {earnedPoints}
            </span>
          </div>
        </div>
      )}

      {/* مؤشرات التنقل - تظهر فقط عند اللمس */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 top-12 transition-opacity duration-300 ${showControls && currentIndex > 0 ? 'opacity-50' : 'opacity-0'}`}
      >
        <div className="text-white text-xs">⬆</div>
      </div>

      <div 
        className={`absolute left-1/2 -translate-x-1/2 bottom-16 transition-opacity duration-300 ${showControls && currentIndex < ads.length - 1 ? 'opacity-50' : 'opacity-0'}`}
      >
        <div className="text-white text-xs">⬇</div>
      </div>

      {/* تلميح الخروج - يظهر فقط عند اللمس */}
      <div 
        className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${showControls ? 'opacity-30' : 'opacity-0'}`}
      >
        <div className="text-white text-[10px] rotate-90 whitespace-nowrap">
          ← اسحب للخروج
        </div>
      </div>
    </div>
  );
};

export default FullScreenAdsViewer;
