import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Eye, Sparkles, Gift, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdViewer = ({ ads, onAdWatched, user }) => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [viewersCount, setViewersCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [totalEarnedSession, setTotalEarnedSession] = useState(0);
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartRef = useRef({ y: 0, time: 0 });
  const controlsTimeoutRef = useRef(null);
  const lastTapRef = useRef(0);

  const currentAd = ads[currentIndex];
  const isWatched = user?.watched_ads?.some(w => w.ad_id === currentAd?.id) || false;

  // Confetti animation for points
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#4F46E5', '#10B981']
    });
  };

  // Fetch viewers count
  const fetchViewers = useCallback(async () => {
    if (!currentAd) return;
    try {
      const res = await fetch(`${API_URL}/api/activity/ad-viewers/${currentAd.id}`);
      const data = await res.json();
      setViewersCount(data.viewers || 0);
      setTotalViews(data.total_views || 0);
    } catch {
      setViewersCount(0);
    }
  }, [currentAd]);

  // Start viewing
  const startViewing = useCallback(async () => {
    if (!currentAd || !user) return;
    try {
      const token = localStorage.getItem('user_token');
      await fetch(`${API_URL}/api/activity/ad-view/${currentAd.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  }, [currentAd, user]);

  // Heartbeat
  useEffect(() => {
    const heartbeat = setInterval(async () => {
      try {
        const token = localStorage.getItem('user_token');
        if (token) {
          await fetch(`${API_URL}/api/activity/heartbeat`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch {}
    }, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    fetchViewers();
    startViewing();
    const interval = setInterval(fetchViewers, 10000);
    return () => clearInterval(interval);
  }, [currentAd, fetchViewers, startViewing]);

  // Track last rewarded time to prevent double rewards
  const lastRewardedTimeRef = useRef(0);

  // Watch timer with enhanced points notification
  useEffect(() => {
    if (isPlaying && !isWatched && currentAd) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          
          // Every 60 seconds = 1 point (only if not already rewarded for this minute)
          const currentMinute = Math.floor(newTime / 60);
          const lastRewardedMinute = Math.floor(lastRewardedTimeRef.current / 60);
          
          if (newTime > 0 && newTime % 60 === 0 && newTime <= currentAd.duration && currentMinute > lastRewardedMinute) {
            lastRewardedTimeRef.current = newTime;
            onAdWatched(currentAd.id, newTime)
              .then((response) => {
                if (response && response.points_earned) {
                  // Show beautiful points animation
                  setEarnedPoints(response.points_earned);
                  setTotalEarnedSession(prev => prev + response.points_earned);
                  setShowPointsAnimation(true);
                  triggerConfetti();
                  
                  // Hide animation after 3 seconds
                  setTimeout(() => setShowPointsAnimation(false), 3000);
                }
              })
              .catch(console.error);
          }

          if (newTime >= currentAd.duration) {
            clearInterval(watchTimerRef.current);
            return currentAd.duration;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(watchTimerRef.current);
  }, [isPlaying, currentAd, isWatched, onAdWatched]);

  // Reset on ad change
  useEffect(() => {
    setWatchTime(0);
    lastRewardedTimeRef.current = 0;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, isPlaying]);

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying]);

  // Handle tap to show/hide controls
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - like animation (optional)
      return;
    }
    lastTapRef.current = now;
    
    // Single tap - toggle controls
    setShowControls(prev => !prev);
    
    // Auto-hide after showing
    if (!showControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    }
  };

  const handleVideoClick = (e) => {
    e.stopPropagation();
    handleTap();
  };

  const togglePlayPause = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const navigateAd = (direction) => {
    if (direction === 'next' && currentIndex < ads.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStartRef.current.y - touchEnd;
    const timeDiff = Date.now() - touchStartRef.current.time;

    if (Math.abs(diff) > 80 && timeDiff < 300) {
      if (diff > 0) navigateAd('next');
      else navigateAd('prev');
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY > 30) navigateAd('next');
    else if (e.deltaY < -30) navigateAd('prev');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = currentAd ? (watchTime / currentAd.duration) * 100 : 0;
  const minutesWatched = Math.floor(watchTime / 60);

  if (!currentAd) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center animate-bounce">
            <Play className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl opacity-80">{isRTL ? 'لا توجد إعلانات متاحة' : 'No ads available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      data-testid="ad-viewer"
    >
      {/* Full Screen Video */}
      <div className="absolute inset-0" onClick={handleVideoClick}>
        <video
          ref={videoRef}
          src={currentAd.video_url || currentAd.videoUrl}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          autoPlay
        />
        
        {/* Dark overlay when paused */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`} />
      </div>

      {/* Points Earned Animation - Center Screen */}
      {showPointsAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce-in">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-150" />
              
              {/* Main card */}
              <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1 rounded-3xl shadow-2xl">
                <div className="bg-black/90 backdrop-blur-xl rounded-3xl px-8 py-6 text-center">
                  <div className="text-6xl mb-2">🎉</div>
                  <div className="text-white text-lg font-medium mb-1">
                    {isRTL ? 'مبروك! أكملت دقيقة' : 'Congrats! 1 Minute Complete'}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      +{earnedPoints}
                    </span>
                    <Gift className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-white/60 text-sm mt-2">
                    {isRTL ? 'نقطة مضافة لرصيدك' : 'Points added to your balance'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Earnings Badge - Top Center (Always visible) */}
      {totalEarnedSession > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-full shadow-lg animate-pulse">
            <span className="text-black font-bold text-sm">
              🔥 {isRTL ? 'ربحت اليوم' : "Today's Earnings"}: +{totalEarnedSession}
            </span>
          </div>
        </div>
      )}

      {/* Controls - Animated show/hide */}
      <div className={`transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        
        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Watching Now Badge - Top Right */}
        <div className="absolute top-16 right-4 z-20">
          <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <Eye className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">{viewersCount || 1}</span>
          </div>
        </div>

        {/* Points Badge - Top Left */}
        {!isWatched && (
          <div className="absolute top-16 left-4 z-20">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full shadow-lg">
              <span className="text-white text-sm font-bold flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                +{currentAd.points_per_minute || 1} {isRTL ? 'نقطة/دقيقة' : 'pt/min'}
              </span>
            </div>
          </div>
        )}

        {/* Watched Badge */}
        {isWatched && (
          <div className="absolute top-16 left-4 z-20">
            <div className="bg-green-500/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
              <span className="text-white text-sm font-bold">✓ {isRTL ? 'تمت المشاهدة' : 'Watched'}</span>
            </div>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-40 flex flex-col items-center gap-4 z-20">
          {/* Mute Toggle */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (videoRef.current) videoRef.current.muted = !isMuted;
              setIsMuted(!isMuted); 
            }}
            className="group"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all shadow-lg">
              {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </div>
          </button>

          {/* Play/Pause */}
          <button onClick={togglePlayPause} className="group">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all shadow-lg">
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-5 bg-white rounded-full" />
                  <div className="w-1.5 h-5 bg-white rounded-full" />
                </div>
              ) : (
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              )}
            </div>
          </button>

          {/* Navigation Arrows */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); navigateAd('prev'); }}
              disabled={currentIndex === 0}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ${currentIndex === 0 ? 'opacity-30' : 'hover:bg-white/20'} transition-all`}
            >
              <ChevronUp className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); navigateAd('next'); }}
              disabled={currentIndex === ads.length - 1}
              className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ${currentIndex === ads.length - 1 ? 'opacity-30' : 'hover:bg-white/20'} transition-all`}
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-8 left-0 right-20 px-4 z-20">
          {/* Advertiser */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {(currentAd.advertiser || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">@{currentAd.advertiser || 'advertiser'}</span>
                {currentAd.verified && (
                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </div>
              <span className="text-white/50 text-xs">{totalViews.toLocaleString()} {isRTL ? 'مشاهدة' : 'views'}</span>
            </div>
          </div>

          {/* Title & Description */}
          <h2 className="text-white font-bold text-lg mb-1 drop-shadow-lg">{currentAd.title}</h2>
          <p className="text-white/70 text-sm line-clamp-2 mb-4">{currentAd.description}</p>

          {/* Visit Website Button */}
          {currentAd.website_url && (
            <a
              href={currentAd.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              data-testid="visit-website-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {isRTL ? 'زيارة الموقع' : 'Visit Website'}
            </a>
          )}

          {/* Watch Progress */}
          {!isWatched && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-white/60 text-xs mb-2">
                <span className="flex items-center gap-1">
                  <span className="text-lg">⏱</span> {formatTime(watchTime)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">
                    {minutesWatched} {isRTL ? 'دقيقة' : 'min'}
                  </span>
                  <span>{formatTime(currentAd.duration)}</span>
                </span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ad Counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1">
            {ads.slice(Math.max(0, currentIndex - 2), Math.min(ads.length, currentIndex + 3)).map((_, idx) => {
              const actualIdx = Math.max(0, currentIndex - 2) + idx;
              return (
                <div 
                  key={actualIdx}
                  className={`transition-all duration-300 rounded-full ${
                    actualIdx === currentIndex 
                      ? 'w-6 h-2 bg-white' 
                      : 'w-2 h-2 bg-white/40'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Tap to show controls hint */}
      {!showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="text-white/40 text-xs animate-pulse">
            {isRTL ? 'المس للتحكم' : 'Tap for controls'}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AdViewer;
