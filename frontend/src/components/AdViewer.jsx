import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Eye } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdViewer = ({ ads, onAdWatched, user }) => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [viewersCount, setViewersCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [liked, setLiked] = useState(false);
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartRef = useRef({ y: 0, time: 0 });

  const currentAd = ads[currentIndex];
  const isWatched = user?.watched_ads?.some(w => w.ad_id === currentAd?.id) || false;

  // Fetch viewers count (real data)
  const fetchViewers = useCallback(async () => {
    if (!currentAd) return;
    try {
      const res = await fetch(`${API_URL}/api/activity/ad-viewers/${currentAd.id}`);
      const data = await res.json();
      setViewersCount(data.viewers || 0);
      setTotalViews(data.total_views || 0);
    } catch {
      setViewersCount(0);
      setTotalViews(0);
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
    } catch (e) {
      console.log('View tracking error:', e);
    }
  }, [currentAd, user]);

  // Heartbeat for online status
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
      } catch (e) {}
    }, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    fetchViewers();
    startViewing();
    const interval = setInterval(fetchViewers, 10000);
    return () => clearInterval(interval);
  }, [currentAd, fetchViewers, startViewing]);

  // Watch timer for points
  useEffect(() => {
    if (isPlaying && !isWatched && currentAd) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          
          if (newTime > 0 && newTime % 60 === 0 && newTime <= currentAd.duration) {
            onAdWatched(currentAd.id, newTime)
              .then((response) => {
                toast({
                  title: '✨ +' + response.points_earned,
                  description: isRTL 
                    ? `الرصيد: ${response.total_points} نقطة`
                    : `Balance: ${response.total_points} points`,
                });
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
  }, [isPlaying, currentAd, isWatched, onAdWatched, isRTL]);

  // Reset on ad change
  useEffect(() => {
    setWatchTime(0);
    setLiked(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isPlaying) videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, isPlaying]);

  // Auto-play video
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying, currentAd]);

  const handleVideoClick = () => {
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

  if (!currentAd) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <p className="text-xl">{isRTL ? 'لا توجد إعلانات متاحة' : 'No ads available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      data-testid="ad-viewer"
    >
      {/* Full Screen Video - TikTok Style */}
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
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Total Views Badge - Top Right */}
      {totalViews > 0 && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Eye className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-sm">{totalViews} {isRTL ? 'مشاهدة' : 'views'}</span>
          </div>
        </div>
      )}

      {/* Points Badge - Top Left */}
      {!isWatched && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-black text-sm font-bold">
              🎯 +{currentAd.points_per_minute || 1} {isRTL ? 'نقطة/دقيقة' : 'pt/min'}
            </span>
          </div>
        </div>
      )}

      {/* Watched Badge */}
      {isWatched && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-white text-sm font-bold">✓ {isRTL ? 'تمت المشاهدة' : 'Watched'}</span>
          </div>
        </div>
      )}

      {/* Right Side Actions - Minimal */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Watching Now Indicator */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-semibold">{viewersCount || 1}</span>
          <span className="text-white/60 text-[10px]">{isRTL ? 'يشاهد' : 'watching'}</span>
        </div>

        {/* Three Dots Menu - Semi-transparent */}
        <button 
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center opacity-40 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </button>

        {/* Mute Toggle */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (videoRef.current) videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted); 
          }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
          </div>
        </button>
      </div>

      {/* Bottom Content - TikTok Style */}
      <div className="absolute bottom-20 left-0 right-16 px-4 z-20">
        {/* Advertiser */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-base">@{currentAd.advertiser || 'advertiser'}</span>
          {currentAd.verified && <span className="text-blue-400">✓</span>}
        </div>

        {/* Title & Description */}
        <h2 className="text-white font-semibold text-lg mb-1">{currentAd.title}</h2>
        <p className="text-white/80 text-sm line-clamp-2 mb-3">{currentAd.description}</p>

        {/* Visit Website Button */}
        {currentAd.website_url && (
          <a
            href={currentAd.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
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
          <div className="mt-3">
            <div className="flex items-center justify-between text-white/60 text-xs mb-1">
              <span>{formatTime(watchTime)}</span>
              <span>{formatTime(currentAd.duration)}</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${(watchTime / currentAd.duration) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ad Counter - Bottom Center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white/80 text-xs">{currentIndex + 1} / {ads.length}</span>
        </div>
      </div>
    </div>
  );
};

export default AdViewer;
