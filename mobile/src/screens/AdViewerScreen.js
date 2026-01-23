import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const AdViewerScreen = ({ads, user, onAdWatched}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const flatListRef = useRef(null);
  const watchTimerRef = useRef(null);

  const currentAd = ads[currentIndex];
  const isWatched = user?.watched_ads?.some(w => w.ad_id === currentAd?.id) || false;

  useEffect(() => {
    if (isPlaying && !isWatched) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;

          // Award points every 60 seconds
          if (newTime > 0 && newTime % 60 === 0 && newTime <= currentAd.duration) {
            onAdWatched(currentAd.id, newTime)
              .then(response => {
                Alert.alert(
                  '✨ حصلت على نقاط!',
                  `${response?.points_earned || 1} نقطة جديدة!`,
                );
              })
              .catch(error => {
                console.error('Failed to award points:', error);
              });
          }

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
  }, [isPlaying, currentAd, isWatched]);

  useEffect(() => {
    setWatchTime(0);
    setIsPlaying(false);
  }, [currentIndex]);

  const handleScroll = event => {
    const index = Math.round(event.nativeEvent.contentOffset.y / height);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderAd = ({item, index}) => (
    <View style={styles.adContainer}>
      <Video
        source={{uri: item.video_url}}
        style={styles.video}
        resizeMode="cover"
        repeat
        paused={!isPlaying || index !== currentIndex}
        muted={isMuted}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />

      {/* Top Info */}
      <View style={styles.topInfo}>
        <View style={styles.advertiserInfo}>
          <View style={styles.advertiserAvatar}>
            <Text style={styles.advertiserInitial}>
              {item.advertiser[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.advertiserName}>{item.advertiser}</Text>
            <Text style={styles.sponsoredLabel}>إعلان مدعوم</Text>
          </View>
        </View>
        {isWatched && (
          <View style={styles.watchedBadge}>
            <Text style={styles.watchedText}>✓ تمت المشاهدة</Text>
          </View>
        )}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.adTitle}>{item.title}</Text>
        <Text style={styles.adDescription}>{item.description}</Text>
        <View style={styles.adMeta}>
          <Text style={styles.adMetaText}>🎯 {item.points} نقطة/دقيقة</Text>
          <Text style={styles.adMetaText}> • </Text>
          <Text style={styles.adMetaText}>⏱️ {item.duration / 60} دقيقة</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsPlaying(!isPlaying)}>
          <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setIsMuted(!isMuted)}>
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      {!isWatched && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {Math.floor(watchTime / 60)}:{(watchTime % 60)
              .toString()
              .padStart(2, '0')}{' '}
            / {Math.floor(item.duration / 60)}:00
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ads}
        renderItem={renderAd}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={height}
        decelerationRate="fast"
      />

      {/* Ad indicators */}
      <View style={styles.indicators}>
        {ads.map((ad, index) => {
          const adWatched =
            user?.watched_ads?.some(w => w.ad_id === ad.id) || false;
          return (
            <View
              key={ad.id}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
                adWatched && styles.indicatorWatched,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  adContainer: {
    width,
    height,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  topInfo: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  advertiserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advertiserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  advertiserInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  advertiserName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sponsoredLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  watchedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  watchedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 80,
  },
  adTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 12,
  },
  adMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 150,
    right: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlIcon: {
    fontSize: 24,
  },
  progressContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  indicators: {
    position: 'absolute',
    top: height / 2 - 50,
    right: 20,
  },
  indicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
  },
  indicatorWatched: {
    backgroundColor: '#10B981',
  },
});

export default AdViewerScreen;