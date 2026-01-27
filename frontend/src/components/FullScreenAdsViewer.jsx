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
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > MIN_SWIPE_DISTANCE;
    const isSwipeDown = distance < -MIN_SWIPE_DISTANCE;
    
    if (isSwipeUp && currentIndex < ads.length - 1) {
      goToNext();
    } else if (isSwipeDown && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Horizontal swipe to close
  const handleHorizontalSwipe = (e) => {
    const startX = e.changedTouches?.[0]?.clientX || 0;
    
    const handleEnd = (endEvent) => {
      const endX = endEvent.changedTouches?.[0]?.clientX || 0;
      if (endX - startX > 100) {
        onClose();
      }
    };
    
    document.addEventListener('touchend', handleEnd, { once: true });
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
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleHorizontalSwipe(e);
      }}
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
            {/* Ad content overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40">
              <div className="absolute bottom-32 left-6 right-20">
                <h2 className="text-white text-2xl font-bold mb-2">{currentAd.title}</h2>
                <p className="text-white/80 text-sm line-clamp-2">{currentAd.description}</p>
                {currentAd.advertiser && (
                  <p className="text-white/60 text-xs mt-2">@{currentAd.advertiser}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar - Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Close Button - Swipe hint */}
      <div 
        className={`absolute top-12 left-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
        {/* Viewer Count */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">{viewerCount}</span>
        </div>

        {/* Points */}
        <div className="flex flex-col items-center relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            watchTime >= REQUIRED_WATCH_TIME 
              ? 'bg-yellow-500 scale-110' 
              : 'bg-black/50 backdrop-blur-sm'
          }`}>
            <Star className={`w-6 h-6 ${watchTime >= REQUIRED_WATCH_TIME ? 'text-white' : 'text-yellow-400'}`} />
          </div>
          <span className="text-white text-xs mt-1 font-medium">+{POINTS_PER_AD}</span>
          
          {/* Points Animation */}
          {showPointsAnimation && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
              <span className="text-yellow-400 text-lg font-bold">+{POINTS_PER_AD}</span>
            </div>
          )}
        </div>

        {/* Mute Toggle */}
        <div className="flex flex-col items-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div 
        className={`absolute top-12 right-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="text-white text-sm font-medium">
            {watchTime >= REQUIRED_WATCH_TIME ? (
              <span className="text-yellow-400">✓ مكتمل</span>
            ) : (
              <span>{REQUIRED_WATCH_TIME - watchTime}s</span>
            )}
          </span>
        </div>
      </div>

      {/* Swipe Indicators */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ top: '15%' }}
      >
        {currentIndex > 0 && (
          <div className="flex flex-col items-center animate-bounce">
            <ChevronUp className="w-6 h-6 text-white/50" />
            <span className="text-white/50 text-xs">السابق</span>
          </div>
        )}
      </div>

      <div 
        className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ bottom: '15%' }}
      >
        {currentIndex < ads.length - 1 && (
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-white/50 text-xs">التالي</span>
            <ChevronDown className="w-6 h-6 text-white/50" />
          </div>
        )}
      </div>

      {/* Ad Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1">
          {ads.slice(0, Math.min(ads.length, 5)).map((_, idx) => (
            <div 
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex % 5 ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Total Points Earned */}
      {earnedPoints > 0 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-yellow-500/90 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-black font-bold text-sm">
              ⭐ {earnedPoints} نقطة
            </span>
          </div>
        </div>
      )}

      {/* Swipe to close hint */}
      <div 
        className={`absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="text-white/30 text-xs writing-vertical">
          ← اسحب للخروج
        </div>
      </div>
    </div>
  );
};

export default FullScreenAdsViewer;
