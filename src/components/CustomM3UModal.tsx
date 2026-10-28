import React, { useState } from 'react';
import { X, Link2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseM3U } from '../utils/m3uParser';
import { Channel } from '../types/tv';

interface CustomM3UModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomChannels: (channels: Channel[], sourceName: string) => void;
  lang: 'bn' | 'en';
}

export const CustomM3UModal: React.FC<CustomM3UModalProps> = ({
  isOpen,
  onClose,
  onAddCustomChannels,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uText, setM3uText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrl.trim()) return;

    setLoading(true);
    setError('');
    setSuccessCount(null);

    try {
      const response = await fetch(m3uUrl.trim());
      if (!response.ok) {
        throw new Error(`Failed to fetch M3U file (Status: ${response.status})`);
      }
      const text = await response.text();
      const parsed = parseM3U(text, 'custom');
      if (parsed.length === 0) {
        throw new Error(
          lang === 'bn'
            ? 'ফাইলে কোনো কার্যকরী M3U চ্যানেল স্ট্রিম পাওয়া যায়নি।'
            : 'No valid streaming channels found in this M3U file.'
        );
      }
      setSuccessCount(parsed.length);
      setTimeout(() => {
        onAddCustomChannels(parsed, 'Custom Playlist');
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : (lang === 'bn' ? 'প্লেলিস্ট লোড করতে সমস্যা হয়েছে' : 'Failed to load playlist')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleParseText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uText.trim()) return;

    setError('');
    const parsed = parseM3U(m3uText, 'custom');
    if (parsed.length === 0) {
      setError(
        lang === 'bn'
          ? 'কোনো কার্যকরী M3U চ্যানেল ফরম্যাট পাওয়া যায়নি।'
          : 'No valid channel streams found.'
      );
      return;
    }
    setSuccessCount(parsed.length);
    setTimeout(() => {
      onAddCustomChannels(parsed, 'Pasted Playlist');
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'bn' ? 'কাস্টম M3U প্লেলিস্ট যোগ করুন' : 'Add Custom M3U Playlist'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'যেকোনো আইপিটিভি লিঙ্ক বা টেক্সট যোগ করে লাইভ দেখুন'
                : 'Import any IPTV m3u link or raw text to watch live'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl my-4 border border-slate-800">
          <button
            onClick={() => { setActiveTab('url'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'url' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'URL লিঙ্ক' : 'Playlist URL'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('text'); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'text' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'M3U টেক্সট পেস্ট' : 'Paste M3U Text'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successCount} {lang === 'bn' ? 'টি চ্যানেল সফলভাবে যোগ হয়েছে!' : 'channels imported successfully!'}</span>
          </div>
        )}

        {/* URL Form */}
        {activeTab === 'url' ? (
          <form onSubmit={handleFetchUrl} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === 'bn' ? 'M3U প্লেলিস্ট URL' : 'M3U Playlist URL'}
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/playlist.m3u"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {loading
                  ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
                  : (lang === 'bn' ? 'চ্যানেল লোড করুন' : 'Import Channels')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleParseText} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === 'bn' ? 'M3U কোড বা টেক্সট পেস্ট করুন' : 'Paste Raw M3U Content'}
              </label>
              <textarea
                rows={6}
                required
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="..." group-title="News",Channel Name\nhttp://example.com/stream.m3u8`}
                value={m3uText}
                onChange={(e) => setM3uText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
              >
                {lang === 'bn' ? 'সংযুক্ত করুন' : 'Import Playlist'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
