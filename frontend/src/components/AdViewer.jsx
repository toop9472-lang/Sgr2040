import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const AdViewer = ({ ads, onAdWatched, user }) => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartRef = useRef(0);

  const currentAd = ads[currentIndex];
  
  // Check if ad was watched based on user data from backend
  const isWatched = user?.watched_ads?.some(w => w.ad_id === currentAd?.id) || false;

  useEffect(() => {
    if (isPlaying && !isWatched && currentAd) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;
          const progress = (newTime / currentAd.duration) * 100;
          setWatchProgress(progress);

          // Award points every 60 seconds (1 minute)
          if (newTime > 0 && newTime % 60 === 0 && newTime <= currentAd.duration) {
            onAdWatched(currentAd.id, newTime)
              .then((response) => {
                toast({
                  title: '✨ ' + t('earnedPoint'),
                  description: isRTL 
                    ? `${response.points_earned} نقطة جديدة! الرصيد: ${response.total_points}`
                    : `${response.points_earned} new points! Balance: ${response.total_points}`,
                });
              })
              .catch((error) => {
                console.error('Failed to award points:', error);
              });
          }

          // Stop at duration
          if (newTime >= currentAd.duration) {
            clearInterval(watchTimerRef.current);
            return currentAd.duration;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
    }

    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
    };
  }, [isPlaying, currentAd, isWatched, onAdWatched, t, isRTL]);

  useEffect(() => {
    // Reset watch time when ad changes
    setWatchTime(0);
    setWatchProgress(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const navigateAd = (direction) => {
    if (direction === 'next' && currentIndex < ads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateAd('next');
      } else {
        navigateAd('prev');
      }
    }
  };

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      navigateAd('next');
    } else {
      navigateAd('prev');
    }
  };

  if (!currentAd) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <p>{t('noAds')}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Language Switcher - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={currentAd.video_url || currentAd.videoUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      {/* Top Info */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-16 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {currentAd.advertiser?.[0] || 'A'}
            </div>
            <div>
              <p className="text-white font-semibold">{currentAd.advertiser}</p>
              <p className="text-white/80 text-sm">
                {isRTL ? 'إعلان مدعوم' : 'Sponsored Ad'}
              </p>
            </div>
          </div>
          {isWatched && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              ✓ {isRTL ? 'تمت المشاهدة' : 'Watched'}
            </div>
          )}
        </div>
      </div>

      {/* Watch Progress Bar */}
      {!isWatched && (
        <div className="absolute top-28 left-0 right-0 px-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">
                {isRTL ? 'وقت المشاهدة' : 'Watch Time'}
              </span>
              <span className="text-white text-sm font-bold">
                {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, '0')} / {Math.floor(currentAd.duration / 60)}:00
              </span>
            </div>
            <Progress value={watchProgress} className="h-2" />
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-24">
        <h2 className="text-white text-2xl font-bold mb-2">{currentAd.title}</h2>
        <p className="text-white/90 text-base mb-4">{currentAd.description}</p>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span>🎯 {currentAd.points || 1} {isRTL ? 'نقطة/دقيقة' : 'point/min'}</span>
          <span>•</span>
          <span>⏱️ {currentAd.duration / 60} {isRTL ? 'دقيقة' : 'min'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} bottom-32 flex flex-col gap-4`}>
        <Button
          onClick={handlePlayPause}
          size="icon"
          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
        >
          {isPlaying ? <Pause className="text-white" /> : <Play className="text-white" />}
        </Button>
        <Button
          onClick={handleMuteToggle}
          size="icon"
          className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
        >
          {isMuted ? <VolumeX className="text-white" /> : <Volume2 className="text-white" />}
        </Button>
      </div>

      {/* Navigation Hints */}
      {currentIndex > 0 && (
        <button
          onClick={() => navigateAd('prev')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] text-white/50 hover:text-white transition-colors"
        >
          <ChevronUp size={32} />
        </button>
      )}
      {currentIndex < ads.length - 1 && (
        <button
          onClick={() => navigateAd('next')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[200%] text-white/50 hover:text-white transition-colors"
        >
          <ChevronDown size={32} />
        </button>
      )}

      {/* Ad Counter */}
      <div className={`absolute top-1/2 ${isRTL ? 'left-4' : 'right-4'} -translate-y-1/2 flex flex-col gap-2`}>
        {ads.map((ad, index) => {
          const adWatched = user?.watched_ads?.some(w => w.ad_id === ad.id) || false;
          return (
            <div
              key={ad.id}
              className={`w-1 h-12 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white'
                  : adWatched
                  ? 'bg-green-500'
                  : 'bg-white/30'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AdViewer;
