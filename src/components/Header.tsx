import React from 'react';
import { Search, RefreshCw, Plus, Globe2, Trophy, Flame } from 'lucide-react';
import { MainTab } from '../types/tv';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCustomM3U: () => void;
  onRefreshChannels: () => void;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  sportsCount: number;
  bangladeshCount: number;
  indiaCount: number;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenCustomM3U,
  onRefreshChannels,
  lang,
  onToggleLang,
  sportsCount,
  bangladeshCount,
  indiaCount,
  favoritesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#060a16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-amber-500 to-emerald-500 flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-base tracking-wider">D</span>
          </div>
          <button 
            type="button" 
            onClick={() => onTabChange('sports')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white whitespace-nowrap block leading-none">
              {lang === 'bn' ? 'দেশস্ট্রিম টিভি' : 'DeshStream TV'}
            </span>
            <span className="text-[10px] text-amber-400 font-medium tracking-wide">
              {lang === 'bn' ? 'লাইভ স্পোর্টস ও চ্যানেল' : 'LIVE SPORTS & TV'}
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Tabs (Segmented Controls) - Sports highlighted FIRST */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl overflow-x-auto shrink-0">
          {/* Sports LIVE Tab - HIGHLIGHTED FIRST */}
          <button
            onClick={() => onTabChange('sports')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm ${
              activeTab === 'sports'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white ring-1 ring-amber-400'
                : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? 'স্পোর্টস লাইভ' : 'Sports Live'}</span>
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-mono">
              HOT
            </span>
            {sportsCount > 0 && (
              <span className="text-[10px] opacity-80 font-mono">({sportsCount})</span>
            )}
          </button>

          {/* Bangladesh Channels Tab */}
          <button
            onClick={() => onTabChange('bangladesh')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bangladesh'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🇧🇩</span>
            <span>{lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'}</span>
            {bangladeshCount > 0 && (
              <span className="text-[10px] opacity-80 font-mono">({bangladeshCount})</span>
            )}
          </button>

          {/* India Channels Tab */}
          <button
            onClick={() => onTabChange('india')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'india'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🇮🇳</span>
            <span>{lang === 'bn' ? 'ভারত' : 'India'}</span>
            {indiaCount > 0 && (
              <span className="text-[10px] opacity-80 font-mono">({indiaCount})</span>
            )}
          </button>

          {/* Favorites Tab */}
          <button
            onClick={() => onTabChange('favorites')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⭐</span>
            <span>{lang === 'bn' ? 'প্রিয়' : 'Favorites'}</span>
            {favoritesCount > 0 && (
              <span className="text-[10px] opacity-80 font-mono">({favoritesCount})</span>
            )}
          </button>

          {/* Recent Channels Tab */}
          <button
            onClick={() => onTabChange('recent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'recent'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🕒</span>
            <span>{lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}</span>
          </button>

          {/* Custom M3U Tab */}
          <button
            onClick={() => onTabChange('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌐</span>
            <span>{lang === 'bn' ? 'কাস্টম' : 'Custom'}</span>
          </button>
        </nav>

        {/* Zone 3: Search & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Input */}
          <div className="relative w-32 sm:w-48 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'চ্যানেল খুঁজুন...' : 'Search channels...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Streams */}
          <button
            onClick={onRefreshChannels}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title={lang === 'bn' ? 'চ্যানেল রিফ্রেশ করুন' : 'Refresh Channels'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Add custom M3U button */}
          <button
            onClick={onOpenCustomM3U}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>M3U</span>
          </button>

          {/* Language Toggle (Bangla / English) */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-colors"
            title="Toggle Language"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{lang === 'bn' ? 'EN' : 'বাং'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation row - Sports highlighted FIRST */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 border-t border-slate-800/60 mt-2 no-scrollbar">
        {/* Sports LIVE Tab Highlighted First on Mobile */}
        <button
          onClick={() => onTabChange('sports')}
          className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm ${
            activeTab === 'sports'
              ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>🏆 {lang === 'bn' ? 'স্পোর্টস লাইভ' : 'Sports Live'}</span>
          {sportsCount > 0 && <span className="font-mono text-[10px]">({sportsCount})</span>}
        </button>

        {/* 2 Country Categories */}
        <button
          onClick={() => onTabChange('bangladesh')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'bangladesh' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇧🇩 {lang === 'bn' ? 'বাংলাদেশ' : 'BD'}</span>
          {bangladeshCount > 0 && <span className="font-mono text-[10px]">({bangladeshCount})</span>}
        </button>

        <button
          onClick={() => onTabChange('india')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'india' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇮🇳 {lang === 'bn' ? 'ভারত' : 'India'}</span>
          {indiaCount > 0 && <span className="font-mono text-[10px]">({indiaCount})</span>}
        </button>

        <button
          onClick={() => onTabChange('favorites')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'favorites' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>⭐ {lang === 'bn' ? 'প্রিয়' : 'Fav'}</span>
          {favoritesCount > 0 && <span className="font-mono text-[10px]">({favoritesCount})</span>}
        </button>

        <button
          onClick={() => onTabChange('recent')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'recent' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🕒 {lang === 'bn' ? 'সাম্প্রতিক' : 'Recent'}</span>
        </button>

        <button
          onClick={() => onTabChange('custom')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1 ${
            activeTab === 'custom' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌐 M3U</span>
        </button>
      </div>
    </header>
  );
};
