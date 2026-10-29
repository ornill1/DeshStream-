import React, { useEffect, useState } from 'react';
import { Tv, Radio, Sparkles, Wifi } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  statusText?: string;
  totalChannels?: number;
  onFinish?: () => void;
  lang?: 'bn' | 'en';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  statusText,
  totalChannels = 0,
  lang = 'en',
}) => {
  const displayStatus = statusText || (lang === 'bn' ? 'চ্যানেল লোড হচ্ছে...' : 'Loading live channels...');
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 4);
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040711] overflow-hidden select-none">
      {/* Background ambient radial gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Animated TV Icon with Broadcast Waves */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Pulsing Concentric Radar Rings */}
          <div className="absolute w-36 h-36 rounded-full border border-red-500/20 animate-radar-ping" />
          <div className="absolute w-28 h-28 rounded-full border border-amber-500/30 animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-red-600/20 via-amber-600/10 to-transparent blur-md" />

          {/* Core Central Emblem */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl flex items-center justify-center">
            <Tv className="w-10 h-10 text-red-500 transition-transform duration-500 group-hover:scale-110" />
            
            {/* Live Indicator Dot */}
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse ring-4 ring-red-500/20" />
          </div>
        </div>

        {/* Brand Title */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-amber-400 font-medium mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>{lang === 'bn' ? 'লাইভ টিভি নেটওয়ার্ক' : 'Live TV Network'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-stylish-english">
            {lang === 'bn' ? (
              <>
                দেশস্ট্রিম <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400">লাইভ টিভি</span>
              </>
            ) : (
              <>
                DeshStream <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400">Live TV</span>
              </>
            )}
          </h1>
          <p className="text-sm text-slate-400">
            {lang === 'bn'
              ? 'বাংলা ও ভারতীয় স্যাটেলাইট চ্যানেলের সরাসরি সম্প্রচার'
              : 'Live Streaming Bangladesh, India & World Sports Channels'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-72 sm:w-80 space-y-2 mb-4">
          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
              {displayStatus}
            </span>
            <span className="font-mono text-amber-400 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Dynamic Channel Stats */}
        {totalChannels > 0 && (
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-2 py-1 px-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {lang === 'bn' ? (
                <>
                  <strong className="text-white font-mono">{totalChannels}</strong> টি লাইভ চ্যানেল সংযুক্ত হচ্ছে
                </>
              ) : (
                <>
                  Connecting <strong className="text-white font-mono">{totalChannels}</strong> live channels
                </>
              )}
            </span>
          </div>
        )}

        {/* Audio Equalizer Simulation Waves */}
        <div className="flex items-end justify-center gap-1 mt-6 h-6">
          <span className="w-1 bg-red-500 rounded-full animate-eq-1" />
          <span className="w-1 bg-amber-400 rounded-full animate-eq-2" />
          <span className="w-1 bg-emerald-400 rounded-full animate-eq-3" />
          <span className="w-1 bg-amber-400 rounded-full animate-eq-1" />
          <span className="w-1 bg-red-500 rounded-full animate-eq-2" />
        </div>
      </div>
    </div>
  );
};
