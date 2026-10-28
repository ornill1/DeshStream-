import React from 'react';
import { CategoryFilter } from '../types/tv';

interface CategoryFilterBarProps {
  isSportsTab: boolean;
  selectedCategory: CategoryFilter | string;
  onSelectCategory: (category: any) => void;
  categoryCounts: Record<string, number>;
  lang: 'bn' | 'en';
}

const GENERAL_CATEGORIES: { id: CategoryFilter; bn: string; en: string; icon: string }[] = [
  { id: 'all', bn: 'সব চ্যানেল', en: 'All Channels', icon: '📺' },
  { id: 'News', bn: 'সংবাদ', en: 'News', icon: '📰' },
  { id: 'Entertainment', bn: 'বিনোদন', en: 'Entertainment', icon: '🎭' },
  { id: 'Music', bn: 'গান ও সঙ্গীত', en: 'Music', icon: '🎵' },
  { id: 'Sports', bn: 'খেলাধুলা', en: 'Sports', icon: '🏆' },
  { id: 'Movies', bn: 'চলচ্চিত্র', en: 'Movies', icon: '🎬' },
  { id: 'Religious', bn: 'ধর্মীয়', en: 'Religious', icon: '🕌' },
  { id: 'Kids', bn: 'শিশু ও কার্টুন', en: 'Kids', icon: '🧸' },
  { id: 'General', bn: 'সাধারণ টিভি', en: 'General', icon: '📡' },
];

const SPORTS_SUB_CATEGORIES: { id: string; bn: string; en: string; icon: string }[] = [
  { id: 'all', bn: 'সব খেলাধুলা', en: 'All Sports', icon: '🏆' },
  { id: 'Cricket', bn: 'ক্রিকেট লাইভ', en: 'Cricket Live', icon: '🏏' },
  { id: 'Football', bn: 'ফুটবল ম্যাচ', en: 'Football', icon: '⚽' },
  { id: 'Combat', bn: 'ফাইট ও রেসলিং', en: 'Combat / MMA', icon: '🥊' },
  { id: 'Racing', bn: 'রেসিং ও স্পিড', en: 'Racing & Motors', icon: '🏎️' },
];

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  isSportsTab,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  lang,
}) => {
  const categoriesToRender = isSportsTab ? SPORTS_SUB_CATEGORIES : GENERAL_CATEGORIES;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-0.5 no-scrollbar">
      {categoriesToRender.map((cat) => {
        const count =
          cat.id === 'all'
            ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
            : categoryCounts[cat.id] || 0;

        if (cat.id !== 'all' && count === 0) return null;

        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{lang === 'bn' ? cat.bn : cat.en}</span>
            <span className={`text-[10px] font-mono ml-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
};
