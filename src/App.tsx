import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Tv,
  Heart,
  Flame,
  Search,
  Sparkles,
  Info,
  Trophy,
  Layers
} from 'lucide-react';
import { Channel, CategoryFilter, MainTab } from './types/tv';
import {
  parseM3U,
  CURATED_SPORTS_CHANNELS,
  FALLBACK_BENGALI_CHANNELS,
  FALLBACK_HINDI_CHANNELS
} from './utils/m3uParser';
import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelCard } from './components/ChannelCard';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { CustomM3UModal } from './components/CustomM3UModal';

const BENGALI_M3U_URL = 'https://iptv-org.github.io/iptv/languages/ben.m3u';
const HINDI_M3U_URL = 'https://iptv-org.github.io/iptv/languages/hin.m3u';
const SPORTS_M3U_URL = 'https://iptv-org.github.io/iptv/categories/sports.m3u';

const FAVORITES_STORAGE_KEY = 'deshstream_favorites_v3';
const RECENT_STORAGE_KEY = 'deshstream_recent_v3';
const LAST_CHANNEL_KEY = 'deshstream_last_channel_v3';
const LANG_STORAGE_KEY = 'deshstream_ui_lang_v4';

export default function App() {
  // App state
  const [sportsChannels, setSportsChannels] = useState<Channel[]>(CURATED_SPORTS_CHANNELS);
  const [bangladeshChannels, setBangladeshChannels] = useState<Channel[]>([]);
  const [indiaChannels, setIndiaChannels] = useState<Channel[]>([]);
  const [customChannels, setCustomChannels] = useState<Channel[]>([]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentChannelIds, setRecentChannelIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Main navigation tab - Sports highlighted first
  const [activeTab, setActiveTab] = useState<MainTab>('sports');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(CURATED_SPORTS_CHANNELS[0] || null);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');

  // Loading & UI
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [uiLang, setUiLang] = useState<'bn' | 'en'>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'bn' ? 'bn' : 'en';
  });
  const [loadingStatus, setLoadingStatus] = useState(
    () => (localStorage.getItem(LANG_STORAGE_KEY) === 'bn' ? 'চ্যানেল তালিকা লোড হচ্ছে...' : 'Loading live TV channels...')
  );
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const toggleUiLang = () => {
    const next = uiLang === 'bn' ? 'en' : 'bn';
    setUiLang(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  // Helper to deduplicate channels by stream URL
  const deduplicateChannels = (list: Channel[]): Channel[] => {
    const seen = new Set<string>();
    const result: Channel[] = [];
    for (const ch of list) {
      if (!ch.url || seen.has(ch.url)) continue;
      seen.add(ch.url);
      result.push(ch);
    }
    return result;
  };

  // Load playlists
  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(15);
    setLoadingStatus(uiLang === 'bn' ? 'লাইভ স্পোর্টস চ্যানেল প্রস্তুত করা হচ্ছে...' : 'Loading Live Sports channels...');

    let loadedSports: Channel[] = [...CURATED_SPORTS_CHANNELS];
    let loadedBen: Channel[] = [];
    let loadedHin: Channel[] = [];

    // 1. Fetch Sports
    try {
      const resSports = await fetch(SPORTS_M3U_URL);
      if (resSports.ok) {
        const textSports = await resSports.text();
        const parsedSports = parseM3U(textSports, 'sports');
        const extraSports = parsedSports.filter(
          (s) => !loadedSports.some((c) => c.url === s.url || c.cleanName.toLowerCase() === s.cleanName.toLowerCase())
        );
        loadedSports = deduplicateChannels([...CURATED_SPORTS_CHANNELS, ...extraSports.slice(0, 40)]);
      }
    } catch (err) {
      console.warn('Could not load sports m3u, using curated list', err);
    }
    setSportsChannels(loadedSports);
    setLoadingProgress(45);
    setLoadingStatus(uiLang === 'bn' ? 'বাংলাদেশ ও ভারতের চ্যানেল লোড হচ্ছে...' : 'Loading BD and India TV channels...');

    // 2. Fetch Bengali M3U
    try {
      const resBen = await fetch(BENGALI_M3U_URL);
      if (resBen.ok) {
        const textBen = await resBen.text();
        loadedBen = parseM3U(textBen, 'ben');
      }
    } catch (err) {
      console.warn('Could not load Bengali m3u', err);
    }
    if (!loadedBen || loadedBen.length === 0) {
      loadedBen = FALLBACK_BENGALI_CHANNELS;
    }

    // 3. Fetch Hindi / India M3U
    try {
      const resHin = await fetch(HINDI_M3U_URL);
      if (resHin.ok) {
        const textHin = await resHin.text();
        loadedHin = parseM3U(textHin, 'hin');
      }
    } catch (err) {
      console.warn('Could not load Hindi m3u', err);
    }
    if (!loadedHin || loadedHin.length === 0) {
      loadedHin = FALLBACK_HINDI_CHANNELS;
    }

    // 4. Clean Separation into 2 Country Categories: Bangladesh and India
    const bdChannels = deduplicateChannels(loadedBen.filter((c) => c.country === 'Bangladesh'));
    const inBengaliChannels = loadedBen.filter((c) => c.country === 'India');
    const inTotalChannels = deduplicateChannels([...inBengaliChannels, ...loadedHin]);

    setBangladeshChannels(bdChannels);
    setIndiaChannels(inTotalChannels);

    setLoadingProgress(95);
    setLoadingStatus(uiLang === 'bn' ? 'লাইভ সম্প্রচার প্রস্তুত!' : 'Ready for live streaming!');

    // Default channel
    const savedLastId = localStorage.getItem(LAST_CHANNEL_KEY);
    const allPool = [...loadedSports, ...bdChannels, ...inTotalChannels];
    const initialChan = allPool.find((c) => c.id === savedLastId) || loadedSports[0] || bdChannels[0];

    setCurrentChannel(initialChan || null);
    setLoadingProgress(100);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [uiLang]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  // Channel Selection
  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    localStorage.setItem(LAST_CHANNEL_KEY, channel.id);

    setRecentChannelIds((prev) => {
      const filtered = prev.filter((id) => id !== channel.id);
      const updated = [channel.id, ...filtered].slice(0, 30);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (channel: Channel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(channel.id);
      const updated = exists ? prev.filter((id) => id !== channel.id) : [...prev, channel.id];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Active channel list based on tab
  const tabChannels = useMemo(() => {
    switch (activeTab) {
      case 'sports':
        return sportsChannels;
      case 'bangladesh':
        return bangladeshChannels;
      case 'india':
        return indiaChannels;
      case 'favorites':
        const all = [...sportsChannels, ...bangladeshChannels, ...indiaChannels, ...customChannels];
        return all.filter((c) => favorites.includes(c.id));
      case 'recent':
        const allPool = [...sportsChannels, ...bangladeshChannels, ...indiaChannels, ...customChannels];
        return recentChannelIds
          .map((id) => allPool.find((c) => c.id === id))
          .filter((c): c is Channel => Boolean(c));
      case 'custom':
        return customChannels;
      default:
        return sportsChannels;
    }
  }, [activeTab, sportsChannels, bangladeshChannels, indiaChannels, customChannels, favorites, recentChannelIds]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ch of tabChannels) {
      if (activeTab === 'sports') {
        const sub = ch.subCategory || 'AllSports';
        counts[sub] = (counts[sub] || 0) + 1;
      } else {
        counts[ch.category] = (counts[ch.category] || 0) + 1;
      }
    }
    return counts;
  }, [tabChannels, activeTab]);

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return tabChannels.filter((ch) => {
      if (selectedCategory !== 'all') {
        if (activeTab === 'sports') {
          if (ch.subCategory !== selectedCategory) return false;
        } else {
          if (ch.category !== selectedCategory) return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = ch.name.toLowerCase().includes(query);
        const matchesClean = ch.cleanName.toLowerCase().includes(query);
        const matchesCat = ch.category.toLowerCase().includes(query);
        const matchesSub = (ch.subCategory || '').toLowerCase().includes(query);
        const matchesCountry = (ch.country || '').toLowerCase().includes(query);
        return matchesName || matchesClean || matchesCat || matchesSub || matchesCountry;
      }

      return true;
    });
  }, [tabChannels, selectedCategory, searchQuery, activeTab]);

  // Switching Tab: automatically switch channel & reset category
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setSelectedCategory('all');

    let pool: Channel[] = [];
    if (tab === 'sports') pool = sportsChannels;
    else if (tab === 'bangladesh') pool = bangladeshChannels;
    else if (tab === 'india') pool = indiaChannels;
    else if (tab === 'favorites') pool = tabChannels;

    if (pool.length > 0 && pool[0]) {
      handleSelectChannel(pool[0]);
    }
  };

  // Category click: filter channels & immediately play first matching channel
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Find first channel matching this category
    const matching = tabChannels.filter((ch) => {
      if (category === 'all') return true;
      if (activeTab === 'sports') return ch.subCategory === category;
      return ch.category === category;
    });

    if (matching.length > 0 && matching[0]) {
      handleSelectChannel(matching[0]);
    }

    const gridEl = document.getElementById('channel-grid-section');
    if (gridEl && window.innerWidth < 768) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Trending Channels: DYNAMICALLY ADAPT TO THE CURRENT TAB!
  const topFeaturedChannels = useMemo(() => {
    if (activeTab === 'bangladesh') {
      const picks = ['Jamuna TV', 'Somoy TV', 'Bangla Vision', 'RTV', 'Channel i', 'NTV', 'Ekattor TV', 'Boishakhi TV'];
      return bangladeshChannels.filter((c) => picks.some((p) => c.cleanName.toLowerCase().includes(p.toLowerCase()))).slice(0, 8);
    }
    if (activeTab === 'india') {
      const picks = ['ABP Ananda', 'Aaj Tak', 'NDTV India', 'India TV', 'DD National', 'DD News', 'Aakaash Aath'];
      return indiaChannels.filter((c) => picks.some((p) => c.cleanName.toLowerCase().includes(p.toLowerCase()))).slice(0, 8);
    }
    if (activeTab === 'sports') {
      const picks = ['Cricket Gold', 'FIFA+', 'Real Madrid', 'Red Bull', 'FITE 24/7', 'Al Iraqia', 'Bahrain Sports', 'Racing.com'];
      return sportsChannels.filter((c) => picks.some((p) => c.cleanName.toLowerCase().includes(p.toLowerCase()))).slice(0, 8);
    }
    return tabChannels.slice(0, 8);
  }, [activeTab, bangladeshChannels, indiaChannels, sportsChannels, tabChannels]);

  const handleNextChannel = () => {
    if (!currentChannel || filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex((c) => c.id === currentChannel.id);
    const nextIndex = currentIndex === -1 || currentIndex === filteredChannels.length - 1 ? 0 : currentIndex + 1;
    handleSelectChannel(filteredChannels[nextIndex]);
  };

  const handlePrevChannel = () => {
    if (!currentChannel || filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex((c) => c.id === currentChannel.id);
    const prevIndex = currentIndex <= 0 ? filteredChannels.length - 1 : currentIndex - 1;
    handleSelectChannel(filteredChannels[prevIndex]);
  };

  const handleAddCustomChannels = (newChannels: Channel[]) => {
    setCustomChannels((prev) => deduplicateChannels([...newChannels, ...prev]));
    setActiveTab('custom');
    if (newChannels[0]) {
      handleSelectChannel(newChannels[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen
          progress={loadingProgress}
          statusText={loadingStatus}
          totalChannels={sportsChannels.length + bangladeshChannels.length + indiaChannels.length}
          lang={uiLang}
        />
      )}

      {/* Header with Sports First + Bangladesh and India Categories */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCustomM3U={() => setIsCustomModalOpen(true)}
        onRefreshChannels={loadPlaylists}
        lang={uiLang}
        onToggleLang={toggleUiLang}
        sportsCount={sportsChannels.length}
        bangladeshCount={bangladeshChannels.length}
        indiaCount={indiaChannels.length}
        favoritesCount={favorites.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 sm:space-y-5">
        {/* Cinema Video Player Section */}
        <section className="space-y-2.5">
          <VideoPlayer
            channel={currentChannel}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            isFavorite={currentChannel ? favorites.includes(currentChannel.id) : false}
            onToggleFavorite={handleToggleFavorite}
            lang={uiLang}
            selectedQuality={selectedQuality}
            onSelectQuality={setSelectedQuality}
          />

          {/* Dedicated Video Quality & Resolution Bar (480p, 720p, 1080p, Auto) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/90 text-white font-bold text-[11px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {uiLang === 'bn' ? 'লাইভ স্ট্রিম' : 'LIVE'}
              </span>
              <div className="min-w-0 truncate">
                <span className="text-xs sm:text-sm font-bold text-white truncate block">
                  {currentChannel?.cleanName}
                </span>
              </div>
            </div>

            {/* Quality Selector (480p, 720p, 1080p, Auto) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1 flex items-center gap-1 shrink-0">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{uiLang === 'bn' ? 'রেজোলিউশন:' : 'Quality:'}</span>
              </span>
              {[
                { label: 'Auto', badge: '⚡ Auto', title: 'Adaptive Auto' },
                { label: '1080p', badge: '1080p FHD', title: 'Full High Definition' },
                { label: '720p', badge: '720p HD', title: 'High Definition' },
                { label: '480p', badge: '480p SD', title: 'Standard Definition' },
              ].map((q) => {
                const isAct = selectedQuality === q.label;
                return (
                  <button
                    key={q.label}
                    onClick={() => setSelectedQuality(q.label)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isAct
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                    }`}
                    title={q.title}
                  >
                    {q.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts banner */}
          <div className="hidden md:flex items-center justify-between text-[11px] text-slate-400 px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>{uiLang === 'bn' ? 'কিবোর্ড শর্টকাট:' : 'Keyboard Shortcuts:'}</span>
              </span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Space</kbd> {uiLang === 'bn' ? 'প্লে/পজ' : 'Play/Pause'}</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">F / L</kbd> {uiLang === 'bn' ? 'ফুলস্ক্রিন' : 'Fullscreen'}</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">M</kbd> {uiLang === 'bn' ? 'মিউট' : 'Mute'}</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">← / →</kbd> {uiLang === 'bn' ? 'চ্যানেল পরিবর্তন' : 'Change Channel'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{uiLang === 'bn' ? 'লাইভ HLS সম্প্রচার সক্রিয়' : 'Live HLS Stream Active'}</span>
            </div>
          </div>
        </section>

        {/* Tab-Specific Top Channels (Dynamic per Tab!) */}
        {topFeaturedChannels.length > 0 && !searchQuery && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>
                  {activeTab === 'bangladesh' && (uiLang === 'bn' ? 'বাংলাদেশ শীর্ষ জনপ্রিয় চ্যানেল' : 'Top Bangladesh Channels')}
                  {activeTab === 'india' && (uiLang === 'bn' ? 'ভারত শীর্ষ জনপ্রিয় চ্যানেল' : 'Top India Channels')}
                  {activeTab === 'sports' && (uiLang === 'bn' ? 'টপ লাইভ স্পোর্টস চ্যানেল' : 'Top Live Sports Channels')}
                  {activeTab === 'favorites' && (uiLang === 'bn' ? 'পছন্দের শীর্ষ চ্যানেল' : 'Top Favorite Channels')}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {uiLang === 'bn' ? 'এক ক্লিকে সরাসরি প্লেয়ারে দেখুন' : 'Instant 1-Click Stream'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {topFeaturedChannels.map((ch, idx) => {
                const isSelected = currentChannel?.id === ch.id;
                return (
                  <button
                    key={`featured_${ch.id}_${ch.url}_${idx}`}
                    onClick={() => handleSelectChannel(ch)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all truncate cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500 text-white shadow-xs'
                        : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                      {ch.logo ? (
                        <img
                          src={ch.logo}
                          alt={ch.cleanName}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Tv className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate">{ch.cleanName}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Section Heading & Category Filter Bar */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                {activeTab === 'sports' && (
                  <>
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{uiLang === 'bn' ? 'লাইভ স্পোর্টস চ্যানেল' : 'Live Sports Channels'}</span>
                  </>
                )}
                {activeTab === 'bangladesh' && (
                  <>
                    <span>🇧🇩</span>
                    <span>{uiLang === 'bn' ? 'বাংলাদেশ টিভি চ্যানেল' : 'Bangladesh TV Channels'}</span>
                  </>
                )}
                {activeTab === 'india' && (
                  <>
                    <span>🇮🇳</span>
                    <span>{uiLang === 'bn' ? 'ভারত টিভি চ্যানেল' : 'India TV Channels'}</span>
                  </>
                )}
                {activeTab === 'favorites' && (
                  <>
                    <span>⭐</span>
                    <span>{uiLang === 'bn' ? 'প্রিয় চ্যানেলসমূহ' : 'Favorite Channels'}</span>
                  </>
                )}
                {activeTab === 'recent' && (
                  <>
                    <span>🕒</span>
                    <span>{uiLang === 'bn' ? 'সম্প্রতি দেখা চ্যানেল' : 'Recently Viewed'}</span>
                  </>
                )}
                {activeTab === 'custom' && (
                  <>
                    <span>🌐</span>
                    <span>{uiLang === 'bn' ? 'কাস্টম প্লেলিস্ট' : 'Custom Playlists'}</span>
                  </>
                )}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredChannels.length}
              </span>
            </div>

            {searchQuery && (
              <span className="text-xs text-amber-400 font-medium truncate max-w-[150px] sm:max-w-none">
                {uiLang === 'bn' ? `খোঁজা হচ্ছে: "${searchQuery}"` : `Results for "${searchQuery}"`}
              </span>
            )}
          </div>

          <CategoryFilterBar
            isSportsTab={activeTab === 'sports'}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            categoryCounts={categoryCounts}
            lang={uiLang}
          />
        </section>

        {/* Channel Grid */}
        <section id="channel-grid-section">
          {filteredChannels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredChannels.map((channel, index) => (
                <ChannelCard
                  key={`${channel.id}_${channel.category}_${channel.url}_${index}`}
                  channel={channel}
                  isActive={currentChannel?.id === channel.id || currentChannel?.url === channel.url}
                  isFavorite={favorites.includes(channel.id)}
                  onSelect={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center p-6">
              {activeTab === 'favorites' ? (
                <>
                  <Heart className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    {uiLang === 'bn' ? 'কোনো পছন্দের চ্যানেল নেই' : 'No Favorite Channels Yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    {uiLang === 'bn'
                      ? 'যেকোনো চ্যানেলের হৃদয়ে (Heart) ক্লিক করে সহজেই আপনার প্রিয় তালিকায় যুক্ত করুন।'
                      : 'Click the heart icon on any channel card to pin it to your favorites.'}
                  </p>
                  <button
                    onClick={() => handleTabChange('sports')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {uiLang === 'bn' ? 'স্পোর্টস চ্যানেল দেখুন' : 'Explore Sports Channels'}
                  </button>
                </>
              ) : searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    {uiLang === 'bn' ? 'কোনো চ্যানেল খুঁজে পাওয়া যায়নি' : 'No Matching Channels Found'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    {uiLang === 'bn'
                      ? `"${searchQuery}" এর সাথে মিলে এমন কোনো চ্যানেল নেই। অন্য কোনো বানান দিয়ে চেষ্টা করুন।`
                      : `No channel matched "${searchQuery}". Try a different spelling.`}
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {uiLang === 'bn' ? 'সার্চ মুছুন' : 'Clear Search'}
                  </button>
                </>
              ) : (
                <>
                  <Tv className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    {uiLang === 'bn' ? 'এই ফিল্টারে চ্যানেল নেই' : 'No Channels in this Filter'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    {uiLang === 'bn'
                      ? 'অন্য একটি ক্যাটাগরি বেছে নিন অথবা সব চ্যানেল দেখুন।'
                      : 'Try picking a different category filter above.'}
                  </p>
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    {uiLang === 'bn' ? 'সব দেখুন' : 'Show All'}
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#02050c] pt-8 pb-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-bold text-slate-200 text-sm tracking-wide">DeshStream Live TV</span>
            <span>·</span>
            <span>{uiLang === 'bn' ? 'বাংলাদেশ, ভারত ও গ্লোবাল স্পোর্টস লাইভ সম্প্রচার' : 'Bangladesh, India & Global Sports Live Streaming'}</span>
            <span>·</span>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              {uiLang === 'bn' ? 'কাস্টম M3U যোগ করুন' : 'Add Custom M3U'}
            </button>
          </div>

          {/* Developer Attribution requested by User */}
          <div className="w-full max-w-md mx-auto pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-700/80 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm sm:text-base font-extrabold text-amber-400 tracking-wide font-stylish-english">
                Developer By Ornill Ahmed
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} DeshStream TV. {uiLang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}
          </p>
        </div>
      </footer>

      {/* Custom M3U Playlist Modal */}
      <CustomM3UModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddCustomChannels={handleAddCustomChannels}
        lang={uiLang}
      />
    </div>
  );
}
