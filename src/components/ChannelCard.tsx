import React, { useState } from 'react';
import { Tv, Heart, Radio } from 'lucide-react';
import { Channel } from '../types/tv';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel, e: React.MouseEvent) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const [imageError, setImageError] = useState(false);

  const countryFlag =
    channel.country === 'Bangladesh'
      ? '🇧🇩'
      : channel.country === 'India'
      ? '🇮🇳'
      : '🌐';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(channel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel);
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer outline-hidden text-left ${
        isActive
          ? 'bg-slate-900 border-red-500 shadow-[0_0_20px_-3px_rgba(239,68,68,0.4)] ring-1 ring-red-500'
          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Top row: Logo, status & favorite button */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Channel Logo / Fallback */}
        <div className="relative w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden shrink-0 group-hover:border-slate-700 transition-colors">
          {!imageError && channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.cleanName}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <Tv className="w-6 h-6 text-slate-500 mb-0.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-full">
                {channel.cleanName.substring(0, 3)}
              </span>
            </div>
          )}

          {/* Active Broadcast Animated Waves on Logo */}
          {isActive && (
            <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(channel, e)}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorite
              ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Channel Title & Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 font-mono">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-xs">{countryFlag}</span>
          )}
          <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-red-400 transition-colors">
            {channel.cleanName}
          </h3>
        </div>

        {/* Metadata: Category & Resolution */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="truncate max-w-[120px]">{channel.category}</span>
          {channel.resolution && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-amber-400/90 font-medium">{channel.resolution}</span>
            </>
          )}
        </div>
      </div>

      {/* Active Equalizer on Bottom if Playing */}
      {isActive && (
        <div className="flex items-end justify-between mt-2.5 pt-2 border-t border-red-500/30">
          <span className="text-[11px] font-medium text-red-400">সম্প্রচার চলছে</span>
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-red-500 rounded-full animate-eq-1" />
            <span className="w-0.5 bg-red-500 rounded-full animate-eq-2" />
            <span className="w-0.5 bg-red-500 rounded-full animate-eq-3" />
            <span className="w-0.5 bg-red-500 rounded-full animate-eq-1" />
          </div>
        </div>
      )}
    </div>
  );
};
