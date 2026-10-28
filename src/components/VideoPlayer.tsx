import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Tv,
  Heart,
  ChevronLeft,
  ChevronRight,
  Radio,
  Clock,
  Layers,
  AlertCircle,
  Check
} from 'lucide-react';
import { Channel, StreamQuality } from '../types/tv';

interface VideoPlayerProps {
  channel: Channel | null;
  onNextChannel: () => void;
  onPrevChannel: () => void;
  isFavorite: boolean;
  onToggleFavorite: (channel: Channel) => void;
  lang: 'bn' | 'en';
  selectedQuality?: string;
  onSelectQuality?: (quality: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  onNextChannel,
  onPrevChannel,
  isFavorite,
  onToggleFavorite,
  lang,
  selectedQuality = 'Auto',
  onSelectQuality,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [qualities, setQualities] = useState<StreamQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = auto
  const [selectedQualityLabel, setSelectedQualityLabel] = useState<string>('Auto');
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [sleepMenuOpen, setSleepMenuOpen] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover'>('contain');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepMinutesLeft, setSleepMinutesLeft] = useState<number | null>(null);
  const [briefFeedback, setBriefFeedback] = useState<'play' | 'pause' | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Auto-hide controls after 3.2 seconds
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setQualityMenuOpen(false);
      setSleepMenuOpen(false);
    }, 3200);
  }, []);

  // Safe Play helper
  const safePlay = useCallback(async (video: HTMLVideoElement, isCancelled?: () => boolean) => {
    if (isCancelled && isCancelled()) return;
    try {
      const promise = video.play();
      playPromiseRef.current = promise;
      await promise;
      if (!isCancelled || !isCancelled()) {
        setIsPlaying(true);
      }
    } catch (err: unknown) {
      if (isCancelled && isCancelled()) return;
      const error = err as { name?: string; message?: string };
      if (
        error?.name === 'AbortError' ||
        error?.message?.includes('interrupted') ||
        error?.message?.includes('pause()')
      ) {
        return;
      }
      if (error?.name === 'NotAllowedError') {
        try {
          video.muted = true;
          setIsMuted(true);
          const mutedPromise = video.play();
          playPromiseRef.current = mutedPromise;
          await mutedPromise;
          if (!isCancelled || !isCancelled()) {
            setIsPlaying(true);
          }
        } catch (mutedErr: unknown) {
          const mErr = mutedErr as { name?: string; message?: string };
          if (mErr?.name !== 'AbortError' && !mErr?.message?.includes('interrupted')) {
            setIsPlaying(false);
          }
        }
      }
    } finally {
      playPromiseRef.current = null;
    }
  }, []);

  // Safe Pause helper
  const safePause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // Ignored
      }
    }

    if (!video.paused) {
      try {
        video.pause();
        setIsPlaying(false);
      } catch {
        // Ignored
      }
    }
  }, []);

  // Setup HLS Stream
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    let isCancelled = false;
    setHasError(false);
    setIsBuffering(true);
    setQualities([]);
    setCurrentQuality(-1);
    setSelectedQualityLabel('Auto');
    resetControlsTimer();

    const video = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 12000,
        fragLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (isCancelled) return;
        setIsBuffering(false);
        const parsedQualities: StreamQuality[] = data.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          bitrate: lvl.bitrate,
          label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
        }));
        setQualities(parsedQualities);

        safePlay(video, () => isCancelled);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (!isCancelled) {
          setCurrentQuality(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (isCancelled) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setHasError(true);
              setErrorMessage(
                lang === 'bn'
                  ? 'চ্যানেলটির লাইভ স্ট্রিম সংযোগে সমস্যা হচ্ছে। পুনরায় চেষ্টা করুন বা অন্য চ্যানেল দেখুন।'
                  : 'Stream signal is currently offline. Please retry or pick another channel.'
              );
              setIsBuffering(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      const onMetadataLoaded = () => {
        if (isCancelled) return;
        setIsBuffering(false);
        safePlay(video, () => isCancelled);
      };
      const onStreamError = () => {
        if (isCancelled) return;
        setHasError(true);
        setErrorMessage(
          lang === 'bn'
            ? 'চ্যানেলটি লোড করা সম্ভব হয়নি।'
            : 'Unable to stream channel signal.'
        );
        setIsBuffering(false);
      };
      video.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
      video.addEventListener('error', onStreamError, { once: true });
    } else {
      setHasError(true);
      setErrorMessage(
        lang === 'bn'
          ? 'আপনার ব্রাউজার HLS লাইভ স্ট্রিমিং সাপোর্ট করে না।'
          : 'Your browser does not support HLS streaming.'
      );
      setIsBuffering(false);
    }

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, lang, safePlay, resetControlsTimer]);

  // Sync isPlaying precisely
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onTimeUpdate = () => {
      if (!video.paused && !isPlaying) {
        setIsPlaying(true);
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [isPlaying]);

  // Sleep Timer countdown
  useEffect(() => {
    if (!sleepTimer) {
      setSleepMinutesLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((sleepTimer - Date.now()) / (60 * 1000)));
      setSleepMinutesLeft(remaining);

      if (Date.now() >= sleepTimer) {
        safePause();
        setSleepTimer(null);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sleepTimer, safePause]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        setIsLandscapeMode(false);
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            // Ignored
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    resetControlsTimer();

    if (video.paused) {
      safePlay(video);
      setBriefFeedback('play');
    } else {
      safePause();
      setBriefFeedback('pause');
    }

    setTimeout(() => {
      setBriefFeedback(null);
    }, 750);
  }, [safePlay, safePause, resetControlsTimer]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimer();
  }, [isMuted, resetControlsTimer]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    resetControlsTimer();

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen().catch(() => {});
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
        setIsFullscreen(true);
        setIsLandscapeMode(true);
      } else {
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch {
            // Ignored
          }
        }
        await document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
        setIsLandscapeMode(false);
      }
    } catch {
      setIsLandscapeMode((prev) => !prev);
    }
  }, [resetControlsTimer]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF' || e.code === 'KeyL') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNextChannel();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrevChannel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextChannel, onPrevChannel, togglePlay, toggleFullscreen, toggleMute]);

  const handleUserActivity = () => {
    resetControlsTimer();
  };

  const handleVideoTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (showControls && isPlaying) {
      setShowControls(false);
      setQualityMenuOpen(false);
      setSleepMenuOpen(false);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      resetControlsTimer();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
    resetControlsTimer();
  };

  const handleReload = () => {
    if (!channel || !videoRef.current) return;
    setHasError(false);
    setIsBuffering(true);
    resetControlsTimer();
    if (hlsRef.current) {
      hlsRef.current.loadSource(channel.url);
      hlsRef.current.startLoad();
    } else {
      videoRef.current.src = channel.url;
      videoRef.current.load();
    }
  };

  // Sync selectedQuality prop with player state
  useEffect(() => {
    if (selectedQuality && selectedQuality !== selectedQualityLabel) {
      setSelectedQualityLabel(selectedQuality);
      if (hlsRef.current) {
        if (selectedQuality === 'Auto') {
          hlsRef.current.currentLevel = -1;
          setCurrentQuality(-1);
        } else {
          const targetHeight = parseInt(selectedQuality, 10);
          if (!isNaN(targetHeight) && hlsRef.current.levels.length > 0) {
            let closestIdx = -1;
            let minDiff = Infinity;
            hlsRef.current.levels.forEach((lvl, idx) => {
              const h = lvl.height || (lvl.bitrate > 3500000 ? 1080 : lvl.bitrate > 1800000 ? 720 : 480);
              const diff = Math.abs(h - targetHeight);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
              }
            });
            if (closestIdx !== -1) {
              hlsRef.current.currentLevel = closestIdx;
              setCurrentQuality(closestIdx);
            }
          }
        }
      }
    }
  }, [selectedQuality, selectedQualityLabel]);

  // Video Quality Selection (Auto, 1080p, 720p, 480p, 360p)
  const handleSelectQuality = (target: string) => {
    setSelectedQualityLabel(target);
    if (onSelectQuality) {
      onSelectQuality(target);
    }
    setQualityMenuOpen(false);
    resetControlsTimer();

    if (!hlsRef.current) return;

    if (target === 'Auto') {
      hlsRef.current.currentLevel = -1;
      setCurrentQuality(-1);
      return;
    }

    const targetHeight = parseInt(target, 10);
    if (!isNaN(targetHeight) && hlsRef.current.levels.length > 0) {
      let closestIdx = -1;
      let minDiff = Infinity;
      hlsRef.current.levels.forEach((lvl, idx) => {
        const h = lvl.height || (lvl.bitrate > 3500000 ? 1080 : lvl.bitrate > 1800000 ? 720 : 480);
        const diff = Math.abs(h - targetHeight);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      if (closestIdx !== -1) {
        hlsRef.current.currentLevel = closestIdx;
        setCurrentQuality(closestIdx);
      }
    }
  };

  const handleSetSleepTimer = (minutes: number) => {
    setSleepMenuOpen(false);
    if (minutes === 0) {
      setSleepTimer(null);
      setSleepMinutesLeft(null);
    } else {
      setSleepTimer(Date.now() + minutes * 60 * 1000);
      setSleepMinutesLeft(minutes);
    }
    resetControlsTimer();
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Tv className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-white mb-2">
          {lang === 'bn' ? 'কোন চ্যানেল নির্বাচন করা হয়নি' : 'No Channel Selected'}
        </h3>
        <p className="text-sm max-w-md text-slate-400">
          {lang === 'bn'
            ? 'লাইভ টিভি দেখতে যেকোনো চ্যানেল বেছে নিন।'
            : 'Select any channel from the list to start streaming immediately.'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={handleUserActivity}
      className={`relative w-full overflow-hidden bg-black border border-slate-800 shadow-2xl group select-none ${
        isLandscapeMode
          ? 'fixed inset-0 z-50 rounded-none h-screen w-screen max-h-none'
          : 'aspect-video max-h-[72vh] rounded-2xl'
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full ${aspectRatio === 'cover' ? 'object-cover' : 'object-contain'} bg-black`}
        playsInline
        onClick={handleVideoTap}
      />

      {/* Brief Tap Feedback Ripple (Play or Pause) */}
      {briefFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/75 border border-white/20 text-white flex items-center justify-center pointer-events-none animate-ping duration-500 z-30">
          {briefFeedback === 'play' ? (
            <Play className="w-8 h-8 ml-1 fill-white text-white" />
          ) : (
            <Pause className="w-8 h-8 text-white" />
          )}
        </div>
      )}

      {/* Buffering Animation Overlay */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="relative flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-2 border-red-500/30 animate-radar-ping absolute" />
            <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center absolute">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            </div>
          </div>
          <p className="text-xs font-semibold text-white tracking-wide">
            {lang === 'bn' ? 'লাইভ ফিড বাফারিং হচ্ছে...' : 'Buffering live stream...'}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5">{channel.cleanName}</span>
        </div>
      )}

      {/* Error State Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 mb-2.5 shadow-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {lang === 'bn' ? 'সিগন্যাল সাময়িক অনুপলব্ধ' : 'Signal Temporarily Offline'}
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mb-5">{errorMessage}</p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg transition-colors shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry Stream'}</span>
            </button>
            <button
              onClick={onNextChannel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পরবর্তী চ্যানেল' : 'Next Channel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Center Play Button: ONLY when Paused and Controls are active */}
      {!isPlaying && !isBuffering && !hasError && showControls && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
          title="Play"
        >
          <Play className="w-8 h-8 ml-1 fill-white" />
        </button>
      )}

      {/* Top Channel Info Bar */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 shadow-xl max-w-[70%] sm:max-w-[75%]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.cleanName}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Tv className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <h2 className="text-xs sm:text-base font-bold text-white tracking-tight truncate">
                {channel.cleanName}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5 truncate">
              <span>
                {channel.country === 'Bangladesh'
                  ? '🇧🇩 বাংলাদেশ'
                  : channel.country === 'India'
                  ? '🇮🇳 ভারত'
                  : '🏆 খেলাধুলা'}
              </span>
              <span>·</span>
              <span className="truncate">{channel.subCategory ? `${channel.subCategory}` : channel.category}</span>
              {channel.resolution && (
                <>
                  <span>·</span>
                  <span className="font-mono text-amber-400 font-semibold">{channel.resolution}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Favorite & Fullscreen Icon Buttons (Strictly Icon Only) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {sleepMinutesLeft !== null && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{sleepMinutesLeft}m</span>
            </div>
          )}

          {/* Fullscreen Icon Button (Icon Only - No Text) */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLandscapeMode || isFullscreen
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => onToggleFavorite(channel)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isFavorite
                ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
            title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={onPrevChannel}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Previous Channel (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={onNextChannel}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Next Channel (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:inline-block w-16 accent-red-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right Stream Options: Video Quality (480, 720, 1080p, Auto), Reload, Aspect, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Stream Reload */}
            <button
              onClick={handleReload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reload Stream"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Robust Interactive Video Quality Selector (480, 720, 1080p, Auto) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQualityMenuOpen((prev) => !prev);
                  setSleepMenuOpen(false);
                  resetControlsTimer();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-slate-100 transition-colors cursor-pointer border border-white/10"
                title="Video Quality / রেজোলিউশন (480p, 720p, 1080p)"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-[11px]">
                  {selectedQualityLabel === 'Auto'
                    ? (currentQuality !== -1 && qualities[currentQuality]?.label ? qualities[currentQuality].label : 'Auto')
                    : selectedQualityLabel}
                </span>
              </button>

              {qualityMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-2 bg-slate-900/98 border border-slate-700 rounded-xl p-1.5 shadow-2xl min-w-[150px] z-50 backdrop-blur-md"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    {lang === 'bn' ? 'ভিডিও রেজোলিউশন' : 'Video Quality'}
                  </div>
                  {[
                    { label: 'Auto', tag: 'Adaptive', bn: 'স্বয়ংক্রিয়' },
                    { label: '1080p', tag: 'Full HD', bn: '১০৮০p (FHD)' },
                    { label: '720p', tag: 'HD', bn: '৭২০p (HD)' },
                    { label: '480p', tag: 'SD', bn: '৪৮০p (SD)' },
                    { label: '360p', tag: 'Data Saver', bn: '৩৬০p' },
                  ].map((item) => {
                    const isQActive = selectedQualityLabel === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleSelectQuality(item.label)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors cursor-pointer ${
                          isQActive
                            ? 'bg-red-600 text-white font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-mono flex items-center gap-1.5">
                          {isQActive && <Check className="w-3 h-3 text-white" />}
                          {item.label}
                        </span>
                        <span className="text-[10px] font-semibold opacity-80">{item.tag}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sleep Timer dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSleepMenuOpen((prev) => !prev);
                  setQualityMenuOpen(false);
                  resetControlsTimer();
                }}
                className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                  sleepTimer ? 'text-amber-400' : ''
                }`}
                title="Sleep Timer"
              >
                <Clock className="w-4 h-4" />
              </button>

              {sleepMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full right-0 mb-2 bg-slate-900/98 border border-slate-700 rounded-xl p-1.5 shadow-2xl min-w-[120px] z-50 text-xs backdrop-blur-md"
                >
                  <span className="block px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    {lang === 'bn' ? 'স্লিপ টাইমার' : 'Sleep Timer'}
                  </span>
                  {[0, 15, 30, 60].map((min) => (
                    <button
                      key={min}
                      onClick={() => handleSetSleepTimer(min)}
                      className="w-full px-2.5 py-1.5 text-left rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                    >
                      {min === 0 ? (lang === 'bn' ? 'বন্ধ (Off)' : 'Off') : `${min} ${lang === 'bn' ? 'মিনিট' : 'min'}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Aspect Ratio Toggle */}
            <button
              onClick={() => {
                setAspectRatio((prev) => (prev === 'contain' ? 'cover' : 'contain'));
                resetControlsTimer();
              }}
              className="hidden sm:inline-flex px-2 py-1 rounded bg-white/10 text-xs text-slate-300 hover:bg-white/20 transition-colors cursor-pointer"
              title="Toggle Aspect Ratio (Fit / Fill)"
            >
              {aspectRatio === 'contain' ? '16:9' : 'Fill'}
            </button>

            {/* Fullscreen Button (Icon Only - No Text) */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-amber-400" /> : <Maximize className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
