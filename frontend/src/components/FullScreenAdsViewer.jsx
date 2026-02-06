import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, ExternalLink, ChevronUp, ChevronDown, Timer, Star, Eye } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FullScreenAdsViewer = ({ user, onClose, onPointsEarned }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAdInfo, setShowAdInfo] = useState(true);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  
  // نظام النقاط المحكم
  const [currentAdTime, setCurrentAdTime] = useState(0);
  const [totalValidTime, setTotalValidTime] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsAnimationValue, setPointsAnimationValue] = useState(0);
  const [completedAdsCount, setCompletedAdsCount] = useState(0);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const watchTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const adDurationRef = useRef(30);

  const SECONDS_PER_POINT = 60;
  const MIN_SWIPE_DISTANCE_Y = 50;
  const MIN_SWIPE_DISTANCE_X = 80;

  // تحميل الإعلانات
  useEffect(() => {
    loadAds();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // بدء العد عند تغيير الإعلان
  useEffect(() => {
    if (ads.length > 0) {
      startAdTimer();
    }
  }, [currentIndex, ads]);

  // إخفاء العناصر تلقائياً
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowAdInfo(false);
      }, 4000);
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
        const shuffled = data.sort(() => Math.random() - 0.5);
        setAds(shuffled);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAdTimer = () => {
    setCurrentAdTime(0);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    // استخدام مدة الإعلان الفعلية - بدون تحديد حد أقصى أو أدنى
    const currentAd = ads[currentIndex];
    adDurationRef.current = currentAd?.duration || 30; // المدة الافتراضية 30 ثانية إذا لم تكن محددة
    
    watchTimerRef.current = setInterval(() => {
      setCurrentAdTime(prev => {
        const newTime = prev + 1;
        
        // التحقق من إكمال الإعلان
        if (newTime >= adDurationRef.current) {
          handleAdCompleted(newTime);
        }
        
        return newTime;
      });
    }, 1000);
  };

  const handleAdCompleted = async (watchedTime) => {
    // إيقاف العداد مؤقتاً
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
    
    // حفظ معرف الإعلان الحالي قبل أي تغيير
    const completedAdId = ads[currentIndex]?.id;
    const completedAdDuration = adDurationRef.current;
    
    // إضافة وقت الإعلان المكتمل للوقت الإجمالي
    const newTotalTime = totalValidTime + watchedTime;
    setTotalValidTime(newTotalTime);
    setCompletedAdsCount(prev => prev + 1);
    
    // حساب النقاط
    const previousPoints = Math.floor(totalValidTime / SECONDS_PER_POINT);
    const newPoints = Math.floor(newTotalTime / SECONDS_PER_POINT);
    
    if (newPoints > previousPoints) {
      const pointsEarned = newPoints - previousPoints;
      setEarnedPoints(prev => prev + pointsEarned);
      setPointsAnimationValue(pointsEarned);
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 2000);
      
      // إرسال للخادم
      if (onPointsEarned) onPointsEarned(pointsEarned);
      await recordPointsToServer(pointsEarned, completedAdId, completedAdDuration);
    }
    
    // الانتقال للإعلان التالي تلقائياً بعد ثانية ونصف
    setTimeout(() => {
      if (currentIndex < ads.length - 1) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setTransitioning(false);
        }, 300);
      }
    }, 1500);
  };

  const recordPointsToServer = async (points, adId, duration) => {
    const token = localStorage.getItem('user_token') || localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/rewarded-ads/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_type: 'video',
          ad_id: adId,
          completed: true,
          watch_duration: duration,
          points_earned: points
        })
      });
    } catch (e) {
      console.log('Failed to record points');
    }
  };

  // التنقل - حر بدون قيود (لكن الوقت لا يُحسب إذا لم يكتمل)
  const goToNext = (isAutomatic = false) => {
    if (transitioning || currentIndex >= ads.length - 1) return;
    
    // إذا كان التنقل يدوي والإعلان لم يكتمل - لا يُحسب الوقت
    if (!isAutomatic && currentAdTime < adDurationRef.current) {
      // الوقت لا يُحسب - فقط ننتقل
    }
    
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

  // Touch handlers
  const handleTouchStart = (e) => {
    if (!e.targetTouches?.[0]) return;
    setTouchEndY(null);
    setTouchEndX(null);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches?.[0]) return;
    setTouchEndY(e.targetTouches[0].clientY);
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartY || !touchStartX) return;
    
    const distanceY = touchStartY - (touchEndY || touchStartY);
    const distanceX = touchStartX - (touchEndX || touchStartX);
    
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (Math.abs(distanceX) > MIN_SWIPE_DISTANCE_X) onClose();
    } else {
      if (distanceY > MIN_SWIPE_DISTANCE_Y && currentIndex < ads.length - 1) {
        goToNext(false);
      } else if (distanceY < -MIN_SWIPE_DISTANCE_Y && currentIndex > 0) {
        goToPrevious();
      }
    }
    
    setTouchStartY(null);
    setTouchStartX(null);
  };

  const handleScreenTap = () => {
    setShowControls(true);
    setShowAdInfo(true);
  };

  const handleVisitSite = (e) => {
    e.stopPropagation();
    const currentAd = ads[currentIndex];
    if (currentAd?.website_url) {
      window.open(currentAd.website_url, '_blank');
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp' || e.key === 'k') goToPrevious();
    else if (e.key === 'ArrowDown' || e.key === 'j') goToNext(false);
    else if (e.key === 'Escape') onClose();
    else if (e.key === 'm') setIsMuted(prev => !prev);
  }, [currentIndex, ads.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = (e) => {
    if (e.deltaY > 50) goToNext(false);
    else if (e.deltaY < -50) goToPrevious();
  };

  // دالة تنسيق الوقت
  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}ث`;
  };

  // حساب الأرقام للعرض
  const adDuration = adDurationRef.current;
  const adProgress = Math.min((currentAdTime / adDuration) * 100, 100);
  const adRemaining = Math.max(0, adDuration - currentAdTime);
  const timeToNextPoint = SECONDS_PER_POINT - (totalValidTime % SECONDS_PER_POINT);
  const isAdComplete = currentAdTime >= adDuration;

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
          <button onClick={onClose} className="px-6 py-3 bg-white/20 rounded-full">العودة</button>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

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
      {/* محتوى الإعلان */}
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
                : 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)'
            }}
          />
        )}
      </div>

      {/* شريط تقدم الإعلان الحالي */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
        <div 
          className={`h-full transition-all duration-1000 ${isAdComplete ? 'bg-green-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
          style={{ width: `${adProgress}%` }}
        />
      </div>

      {/* =================== العداد المصغّر - شريط أفقي في الأعلى =================== */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg" dir="rtl">
          <div className="flex items-center gap-4 text-xs">
            
            {/* وقت الإعلان الحالي */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isAdComplete ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className={`font-bold ${isAdComplete ? 'text-green-400' : 'text-amber-400'}`}>
                {formatTime(currentAdTime)}
              </span>
              <span className="text-white/40">/ {formatTime(adDuration)}</span>
            </div>
            
            <div className="w-px h-4 bg-white/20"></div>
            
            {/* الوقت المحتسب */}
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-bold">{formatTime(totalValidTime)}</span>
            </div>
            
            <div className="w-px h-4 bg-white/20"></div>
            
            {/* للنقطة التالية */}
            <div className="flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{formatTime(timeToNextPoint)}</span>
            </div>
            
            <div className="w-px h-4 bg-white/20"></div>
            
            {/* النقاط */}
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-green-400 fill-green-400" />
              <span className="text-green-400 font-bold">{earnedPoints}</span>
            </div>
            
          </div>
        </div>
      </div>

      {/* زر الإغلاق */}
      <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
        >
          <span className="text-white text-xl font-light">✕</span>
        </button>
      </div>

      {/* زر كتم الصوت */}
      <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* أزرار التنقل */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${showControls ? 'opacity-80 hover:opacity-100 hover:scale-110' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col items-center gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ChevronUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/70 text-xs">السابق</span>
          </div>
        </button>
      )}

      {currentIndex < ads.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(false); }}
          className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${showControls ? 'opacity-80 hover:opacity-100 hover:scale-110' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex flex-col items-center gap-2 p-3">
            <span className="text-white/70 text-xs">التالي</span>
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      )}

      {/* بيانات المعلن */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-out ${showAdInfo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-20 pb-8 px-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20">
              {(currentAd.advertiser || currentAd.title)?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">{currentAd.advertiser || 'معلن'}</p>
              <p className="text-white/50 text-xs">إعلان {currentIndex + 1} من {ads.length}</p>
            </div>
          </div>

          <h3 className="text-white font-bold text-lg mb-2">{currentAd.title}</h3>
          <p className="text-white/60 text-sm mb-4 line-clamp-2">{currentAd.description}</p>

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
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl px-8 py-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <Star className="w-10 h-10 text-white fill-white" />
                <span className="text-white text-4xl font-bold">+{pointsAnimationValue}</span>
              </div>
              <p className="text-white/80 text-center text-sm mt-2">نقطة جديدة!</p>
            </div>
          </div>
        </div>
      )}

      {/* مؤشر التقدم الجانبي - شريط رفيع فقط */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <div className="w-0.5 h-24 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b from-white/60 to-white/30 rounded-full transition-all duration-500"
            style={{ height: `${((currentIndex + 1) / ads.length) * 100}%` }}
          />
        </div>
      </div>

      {/* تحذير يجب مشاهدة الإعلان بالكامل */}
      {!isAdComplete && currentAdTime > 3 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-500/20">
            <p className="text-amber-400/90 text-xs text-center">
              ⏱️ أكمل مشاهدة الإعلان ({formatTime(adRemaining)} متبقي) لاحتساب الوقت
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenAdsViewer;
