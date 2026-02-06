import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, ExternalLink, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FullScreenAdsViewer = ({ user, onClose, onPointsEarned }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [currentAdWatchTime, setCurrentAdWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAdInfo, setShowAdInfo] = useState(true);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [pointsAnimationValue, setPointsAnimationValue] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);
  const [canNavigate, setCanNavigate] = useState(false);
  
  // عداد قابل للسحب
  const [counterPosition, setCounterPosition] = useState({ x: 16, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // سجل الإعلانات المشاهدة بالكامل
  const [watchedAdsSet, setWatchedAdsSet] = useState(new Set());
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const watchTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const infoTimerRef = useRef(null);

  const REQUIRED_WATCH_TIME = 60; // 60 ثانية = دقيقة واحدة للحصول على نقطة
  const POINTS_PER_MINUTE = 1; // نقطة واحدة لكل دقيقة مشاهدة
  const MIN_AD_WATCH_TIME = 30; // يجب مشاهدة 30 ثانية على الأقل للانتقال
  const MIN_SWIPE_DISTANCE_Y = 50;
  const MIN_SWIPE_DISTANCE_X = 80;

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
      // تحقق إذا كان الإعلان الحالي مشاهد مسبقاً
      const currentAdId = ads[currentIndex]?.id;
      if (watchedAdsSet.has(currentAdId)) {
        setCanNavigate(true);
        setAdCompleted(true);
      } else {
        setCanNavigate(false);
        setAdCompleted(false);
      }
    }
  }, [currentIndex, ads]);

  // Auto hide controls
  useEffect(() => {
    if (showControls && !isDragging) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowAdInfo(false);
      }, 4000);
    }
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [showControls, isDragging]);

  const loadAds = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ads`);
      const data = await response.json();
      if (data && data.length > 0) {
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
    setCurrentAdWatchTime(0);
    setIsWatching(true);
    
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    watchTimerRef.current = setInterval(() => {
      setCurrentAdWatchTime(prev => {
        const newTime = prev + 1;
        
        // تحديث إجمالي وقت المشاهدة
        setTotalWatchTime(t => t + 1);
        setWatchTime(w => w + 1);
        
        // السماح بالتنقل بعد مشاهدة الحد الأدنى
        if (newTime >= MIN_AD_WATCH_TIME && !canNavigate) {
          setCanNavigate(true);
          setAdCompleted(true);
          // إضافة الإعلان لقائمة المشاهدة المكتملة
          const currentAdId = ads[currentIndex]?.id;
          if (currentAdId) {
            setWatchedAdsSet(prev => new Set([...prev, currentAdId]));
          }
        }
        
        // كل 60 ثانية = نقطة واحدة
        if (newTime > 0 && newTime % REQUIRED_WATCH_TIME === 0) {
          earnPoint();
        }
        
        return newTime;
      });
    }, 1000);
  };

  const earnPoint = async () => {
    const points = POINTS_PER_MINUTE;
    setEarnedPoints(prev => prev + points);
    setPointsAnimationValue(points);
    
    // Show points animation
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 1500);
    
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
            watch_duration: REQUIRED_WATCH_TIME,
            points_earned: points
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
    if (!touchStartY || !touchStartX || isDragging) return;
    
    const distanceY = touchStartY - (touchEndY || touchStartY);
    const distanceX = touchStartX - (touchEndX || touchStartX);
    
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (Math.abs(distanceX) > MIN_SWIPE_DISTANCE_X) {
        onClose();
      }
    } else {
      const isSwipeUp = distanceY > MIN_SWIPE_DISTANCE_Y;
      const isSwipeDown = distanceY < -MIN_SWIPE_DISTANCE_Y;
      
      if (isSwipeUp && currentIndex < ads.length - 1) {
        goToNext();
      } else if (isSwipeDown && currentIndex > 0) {
        goToPrevious();
      }
    }
    
    setTouchStartY(null);
    setTouchStartX(null);
    setTouchEndY(null);
    setTouchEndX(null);
  };

  // Counter drag handlers
  const handleCounterTouchStart = (e) => {
    e.stopPropagation();
    if (!e.targetTouches || !e.targetTouches[0]) return;
    setIsDragging(true);
    setDragStart({
      x: e.targetTouches[0].clientX - counterPosition.x,
      y: e.targetTouches[0].clientY - counterPosition.y
    });
  };

  const handleCounterTouchMove = (e) => {
    e.stopPropagation();
    if (!isDragging || !e.targetTouches || !e.targetTouches[0]) return;
    
    const newX = Math.max(10, Math.min(window.innerWidth - 150, e.targetTouches[0].clientX - dragStart.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 80, e.targetTouches[0].clientY - dragStart.y));
    
    setCounterPosition({ x: newX, y: newY });
  };

  const handleCounterTouchEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  // Mouse drag handlers for desktop
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 200, e.clientX - dragStart.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragStart.y));
      setCounterPosition({ x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const goToNext = () => {
    if (transitioning || currentIndex >= ads.length - 1) return;
    
    // يجب مشاهدة الإعلان بالكامل للتنقل
    if (!canNavigate && currentAdWatchTime < MIN_AD_WATCH_TIME) {
      // عرض تنبيه أنه يجب إكمال المشاهدة
      return;
    }
    
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setTransitioning(false);
      setCanNavigate(false);
      setAdCompleted(false);
    }, 300);
  };

  const goToPrevious = () => {
    if (transitioning || currentIndex <= 0) return;
    
    // يجب مشاهدة الإعلان بالكامل للتنقل
    if (!canNavigate && currentAdWatchTime < MIN_AD_WATCH_TIME) {
      return;
    }
    
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setTransitioning(false);
      setCanNavigate(false);
      setAdCompleted(false);
    }, 300);
  };

  const handleScreenTap = () => {
    if (!isDragging) {
      setShowControls(true);
      setShowAdInfo(true);
    }
  };

  const handleVisitSite = (e) => {
    e.stopPropagation();
    const currentAd = ads[currentIndex];
    if (currentAd?.website_url) {
      window.open(currentAd.website_url, '_blank');
    }
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

  const handleWheel = (e) => {
    if (e.deltaY > 50) {
      goToNext();
    } else if (e.deltaY < -50) {
      goToPrevious();
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="w-20 h-20 rounded-full bg-[#0a0a0f] border-2 border-[#3b82f6]/30 flex items-center justify-center overflow-hidden mb-4 animate-pulse">
          <img src="/logo_saqr.png" alt="صقر" className="w-16 h-16 object-contain" />
        </div>
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-xl mb-4">لا توجد إعلانات متاحة حالياً</p>
          <button onClick={onClose} className="px-6 py-3 bg-white/20 rounded-full">
            العودة
          </button>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentIndex];
  const progress = ((watchTime % REQUIRED_WATCH_TIME) / REQUIRED_WATCH_TIME) * 100;
  const timeToNextPoint = REQUIRED_WATCH_TIME - (watchTime % REQUIRED_WATCH_TIME);
  const adProgress = Math.min((currentAdWatchTime / MIN_AD_WATCH_TIME) * 100, 100);
  const timeToUnlock = Math.max(0, MIN_AD_WATCH_TIME - currentAdWatchTime);

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
      {/* Video/Ad Content */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
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
          />
        )}
      </div>

      {/* شريط تقدم الإعلان الحالي - يجب إكماله للتنقل */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 z-10">
        <div 
          className={`h-full transition-all duration-1000 ${adCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
          style={{ width: `${adProgress}%` }}
        />
      </div>
      
      {/* شريط تقدم النقطة التالية */}
      <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-white/5 z-10">
        <div 
          className="h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* =================== العداد الثابت القابل للتحريك =================== */}
      <div 
        className="absolute z-30 cursor-move select-none"
        style={{ left: counterPosition.x, top: counterPosition.y }}
        onTouchStart={handleCounterTouchStart}
        onTouchMove={handleCounterTouchMove}
        onTouchEnd={handleCounterTouchEnd}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDragging(true);
          setDragStart({ x: e.clientX - counterPosition.x, y: e.clientY - counterPosition.y });
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-black/80 backdrop-blur-xl rounded-2xl px-4 py-3 border-2 ${isDragging ? 'border-[#3b82f6] scale-105' : 'border-white/10'} transition-all duration-200 shadow-2xl`}>
          {/* أيقونة السحب */}
          <div className="flex justify-center mb-2">
            <GripHorizontal className={`w-5 h-3 ${isDragging ? 'text-[#3b82f6]' : 'text-white/30'}`} />
          </div>
          
          {/* حالة المشاهدة */}
          {!adCompleted && (
            <div className="flex items-center justify-center gap-2 mb-2 px-2 py-1 bg-yellow-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-yellow-400 text-xs font-medium">شاهد {timeToUnlock} ثانية للتنقل</span>
            </div>
          )}
          {adCompleted && (
            <div className="flex items-center justify-center gap-2 mb-2 px-2 py-1 bg-green-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-400 text-xs font-medium">✓ يمكنك التنقل الآن</span>
            </div>
          )}
          
          {/* بيانات المشاهدة */}
          <div className="flex items-center gap-3 text-white">
            <div className="text-center min-w-[60px]">
              <div className="text-[10px] text-white/40 mb-0.5">المشاهدة</div>
              <div className="text-base font-bold text-[#60a5fa]">{formatTime(totalWatchTime)}</div>
            </div>
            
            <div className="w-px h-8 bg-white/10"></div>
            
            <div className="text-center min-w-[60px]">
              <div className="text-[10px] text-white/40 mb-0.5">النقطة التالية</div>
              <div className="text-base font-bold text-yellow-400">{timeToNextPoint}ث</div>
            </div>
            
            <div className="w-px h-8 bg-white/10"></div>
            
            <div className="text-center min-w-[50px]">
              <div className="text-[10px] text-white/40 mb-0.5">النقاط</div>
              <div className="text-base font-bold text-green-400">{earnedPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* زر الإغلاق */}
      <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
        >
          <span className="text-white text-xl font-light">✕</span>
        </button>
      </div>

      {/* زر كتم الصوت */}
      <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* =================== أزرار التنقل بالأقواس البيضاء =================== */}
      {/* زر السابق */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          disabled={!canNavigate}
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${showControls ? (canNavigate ? 'opacity-90 hover:opacity-100 hover:scale-110' : 'opacity-30 cursor-not-allowed') : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ChevronUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white text-2xl font-extralight tracking-widest">(</span>
              <span className="text-white/70 text-xs">{canNavigate ? 'السابق' : 'انتظر'}</span>
              <span className="text-white text-2xl font-extralight tracking-widest">)</span>
            </div>
          </div>
        </button>
      )}

      {/* زر التالي */}
      {currentIndex < ads.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          disabled={!canNavigate}
          className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${showControls ? (canNavigate ? 'opacity-90 hover:opacity-100 hover:scale-110' : 'opacity-30 cursor-not-allowed') : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col items-center gap-2 p-3">
            <div className="flex items-center gap-1">
              <span className="text-white text-2xl font-extralight tracking-widest">(</span>
              <span className="text-white/70 text-xs">{canNavigate ? 'التالي' : 'انتظر'}</span>
              <span className="text-white text-2xl font-extralight tracking-widest">)</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      )}

      {/* =================== بيانات المعلن =================== */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-out ${showAdInfo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-20 pb-8 px-5">
          {/* اسم المعلن */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20">
              {(currentAd.advertiser || currentAd.title)?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">{currentAd.advertiser || 'معلن'}</p>
              <p className="text-white/50 text-xs">إعلان {currentIndex + 1} من {ads.length}</p>
            </div>
          </div>

          {/* عنوان ووصف */}
          <h3 className="text-white font-bold text-lg mb-2">{currentAd.title}</h3>
          <p className="text-white/60 text-sm mb-4 line-clamp-2">{currentAd.description}</p>

          {/* زر زيارة الموقع */}
          {currentAd.website_url && (
            <button
              onClick={handleVisitSite}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
            >
              <ExternalLink className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">زيارة الموقع</span>
            </button>
          )}
        </div>
      </div>

      {/* نقاط مكتسبة - Animation */}
      {showPointsAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="animate-bounce bg-yellow-500/90 rounded-full px-8 py-4 shadow-2xl">
            <span className="text-black text-4xl font-bold">+{pointsAnimationValue} ⭐</span>
          </div>
        </div>
      )}

      {/* مؤشر التنقل الجانبي */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
        {ads.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'h-6 bg-[#3b82f6]' 
                : 'h-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FullScreenAdsViewer;
