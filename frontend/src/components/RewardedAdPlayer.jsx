import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Gift, Play, X, Clock, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const RewardedAdPlayer = ({ onClose, onRewardEarned }) => {
  const [adData, setAdData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canClose, setCanClose] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    loadAd();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadAd = async () => {
    try {
      const res = await axios.get(`${API}/api/rewarded-ads/next`, {
        headers: getAuthHeaders()
      });
      setAdData(res.data);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object') {
        setError(detail.message || 'حدث خطأ');
        if (detail.cooldown) {
          setTimeLeft(detail.cooldown);
        }
      } else {
        setError(detail || 'لا توجد إعلانات متاحة');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startAd = () => {
    setIsPlaying(true);
    const duration = adData?.duration || 30;
    setTimeLeft(duration);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setProgress(((duration - newTime) / duration) * 100);

        if (newTime <= 0) {
          clearInterval(timerRef.current);
          setCanClose(true);
          completeAd();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const completeAd = async () => {
    try {
      const res = await axios.post(`${API}/api/rewarded-ads/complete`, {
        ad_type: adData.ad_type,
        ad_id: adData.ad_id,
        completed: true,
        watch_duration: adData.duration || 30
      }, { headers: getAuthHeaders() });

      if (res.data.success) {
        toast.success(res.data.message);
        if (onRewardEarned) {
          onRewardEarned(res.data.points_earned, res.data.total_points);
        }
      }
    } catch (error) {
      toast.error('فشل تسجيل المكافأة');
    }
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (videoRef.current) videoRef.current.pause();
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>جاري تحميل الإعلان...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">{error}</h3>
            {timeLeft > 0 && (
              <p className="text-gray-500 mb-4">انتظر {timeLeft} ثانية</p>
            )}
            <Button onClick={onClose} variant="outline">
              إغلاق
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-2 text-white">
          <Gift className="w-5 h-5 text-yellow-400" />
          <span className="text-sm">+{adData?.reward_points} نقاط</span>
        </div>
        {canClose ? (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <span className="text-white text-sm bg-white/20 px-3 py-1 rounded-full">
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Ad Content */}
      <div className="flex-1 flex items-center justify-center">
        {!isPlaying ? (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Play className="w-12 h-12 text-white ml-1" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">
              {adData?.title || 'إعلان مكافئ'}
            </h2>
            {adData?.advertiser && (
              <p className="text-gray-400 mb-6">{adData.advertiser}</p>
            )}
            <Button 
              onClick={startAd}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Play className="w-5 h-5 ml-2" />
              شاهد واكسب {adData?.reward_points} نقاط
            </Button>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {adData?.video_url ? (
              <video
                ref={videoRef}
                src={adData.video_url}
                className="w-full h-full object-contain"
                playsInline
                muted={false}
              />
            ) : (
              // Placeholder for network ads
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                <div className="text-center text-white">
                  <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p>جاري عرض الإعلان...</p>
                  <p className="text-2xl font-bold mt-2">{timeLeft}s</p>
                </div>
              </div>
            )}

            {/* Advertiser Info */}
            {adData?.advertiser && isPlaying && (
              <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold">{adData.title}</p>
                <p className="text-gray-300 text-sm">{adData.advertiser}</p>
              </div>
            )}

            {/* Visit Website Button */}
            {adData?.website_url && canClose && (
              <a
                href={adData.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 rounded-lg text-center font-bold"
              >
                زيارة الموقع
              </a>
            )}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {canClose && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">
              🎉 مبروك!
            </h2>
            <p className="text-yellow-400 text-xl mb-6">
              حصلت على {adData?.reward_points} نقاط
            </p>
            <Button 
              onClick={handleClose}
              size="lg"
              className="bg-green-500 hover:bg-green-600"
            >
              استمرار
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Button to trigger rewarded ad
export const WatchAdButton = ({ onRewardEarned, className = '' }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API}/api/rewarded-ads/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReward = (points, total) => {
    loadStats();
    if (onRewardEarned) onRewardEarned(points, total);
  };

  return (
    <>
      <Button
        onClick={() => setShowPlayer(true)}
        className={`bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 ${className}`}
      >
        <Gift className="w-5 h-5 ml-2" />
        شاهد إعلان واكسب نقاط
        {stats && (
          <span className="mr-2 bg-white/20 px-2 py-0.5 rounded text-xs">
            {stats.today.remaining} متبقي
          </span>
        )}
      </Button>

      {showPlayer && (
        <RewardedAdPlayer
          onClose={() => setShowPlayer(false)}
          onRewardEarned={handleReward}
        />
      )}
    </>
  );
};

export default RewardedAdPlayer;
