export interface Channel {
  id: string;
  name: string;
  cleanName: string;
  resolution?: string;
  logo: string;
  category: string;
  subCategory?: string; // e.g. 'Cricket', 'Football', 'Motorsport', 'Combat'
  url: string;
  language: 'ben' | 'hin' | 'sports' | 'custom';
  country?: string; // 'Bangladesh' | 'India' | 'Global'
}

export type CategoryFilter = 
  | 'all'
  | 'Sports'
  | 'News'
  | 'Entertainment'
  | 'Music'
  | 'Movies'
  | 'Religious'
  | 'Kids'
  | 'General';

export type MainTab = 'sports' | 'bangladesh' | 'india' | 'favorites' | 'recent' | 'custom';

export interface StreamQuality {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}
