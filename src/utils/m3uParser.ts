import { Channel } from '../types/tv';

export function parseM3U(content: string, defaultSource: 'ben' | 'hin' | 'sports' | 'custom' = 'ben'): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentInfo: Partial<Channel> | null = null;
  const seenUrls = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const infoMatch = line.match(/#EXTINF:([^,]*),(.*)/);
      const attributes = infoMatch ? infoMatch[1] : '';
      const rawName = infoMatch ? infoMatch[2].trim() : line.replace('#EXTINF:', '').trim();

      // Extract attributes
      const idMatch = attributes.match(/tvg-id="([^"]*)"/i);
      const logoMatch = attributes.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = attributes.match(/group-title="([^"]*)"/i);
      const countryMatch = attributes.match(/tvg-country="([^"]*)"/i);

      // Extract resolution from name
      const resMatch = rawName.match(/\((\d{3,4}p|4K|HD|FHD|SD)\)|\[(\d{3,4}p|4K|HD|FHD|SD)\]/i);
      const resolution = resMatch ? (resMatch[1] || resMatch[2]).toUpperCase() : undefined;
      const cleanName = rawName.replace(/\((\d{3,4}p|4K|HD|FHD|SD)\)|\[(\d{3,4}p|4K|HD|FHD|SD)\]/gi, '').trim();

      // Explicit Category classification based on group-title first, then channel name
      const rawGroup = groupMatch ? groupMatch[1].trim() : '';
      const groupLower = rawGroup.toLowerCase();
      const nameLower = rawName.toLowerCase();
      let category = 'General';
      let subCategory: string | undefined = undefined;

      if (
        defaultSource === 'sports' ||
        groupLower.includes('sport') ||
        nameLower.includes('sport') ||
        nameLower.includes('cricket') ||
        nameLower.includes('football')
      ) {
        category = 'Sports';
        if (nameLower.includes('cricket') || groupLower.includes('cricket')) {
          subCategory = 'Cricket';
        } else if (nameLower.includes('foot') || nameLower.includes('fifa') || nameLower.includes('soccer') || nameLower.includes('madrid')) {
          subCategory = 'Football';
        } else if (nameLower.includes('fight') || nameLower.includes('combat') || nameLower.includes('wwe') || nameLower.includes('boxing')) {
          subCategory = 'Combat';
        } else if (nameLower.includes('racing') || nameLower.includes('red bull') || nameLower.includes('speed') || nameLower.includes('motorsport')) {
          subCategory = 'Racing';
        } else {
          subCategory = 'AllSports';
        }
      } else if (
        groupLower.includes('news') ||
        nameLower.includes('news') ||
        nameLower.includes('সংবাদ') ||
        nameLower.includes('khabar') ||
        nameLower.includes('samachar') ||
        nameLower.includes('24 ghanta') ||
        nameLower.includes('time') ||
        nameLower.includes('ekattor')
      ) {
        category = 'News';
      } else if (
        groupLower.includes('music') ||
        nameLower.includes('music') ||
        nameLower.includes('গান') ||
        nameLower.includes('sangeet') ||
        nameLower.includes('jalwa')
      ) {
        category = 'Music';
      } else if (
        groupLower.includes('movie') ||
        nameLower.includes('cinema') ||
        nameLower.includes('movie') ||
        nameLower.includes('film') ||
        nameLower.includes('চলচ্চিত্র')
      ) {
        category = 'Movies';
      } else if (
        groupLower.includes('religious') ||
        nameLower.includes('aastha') ||
        nameLower.includes('islam') ||
        nameLower.includes('quran') ||
        nameLower.includes('azan') ||
        nameLower.includes('bhajan') ||
        nameLower.includes('dharm') ||
        nameLower.includes('ধর্মীয়')
      ) {
        category = 'Religious';
      } else if (
        groupLower.includes('kid') ||
        groupLower.includes('animation') ||
        nameLower.includes('cartoon') ||
        nameLower.includes('kids') ||
        nameLower.includes('কার্টুন')
      ) {
        category = 'Kids';
      } else if (
        groupLower.includes('entertainment') ||
        groupLower.includes('general') ||
        groupLower.includes('series') ||
        groupLower.includes('drama') ||
        nameLower.includes('vision') ||
        nameLower.includes('bangla') ||
        nameLower.includes('ananda')
      ) {
        category = 'Entertainment';
      } else {
        category = 'General';
      }

      // Country identification (Bangladesh vs India vs Global)
      let country = 'Bangladesh';
      const tvgId = idMatch ? idMatch[1] : '';
      const cCode = countryMatch ? countryMatch[1].toUpperCase() : '';

      if (defaultSource === 'sports') {
        country = 'Global';
      } else if (cCode === 'IN' || tvgId.includes('.in@') || defaultSource === 'hin') {
        country = 'India';
      } else if (cCode === 'BD' || tvgId.includes('.bd@')) {
        country = 'Bangladesh';
      } else if (defaultSource === 'ben') {
        if (tvgId.includes('.in@')) {
          country = 'India';
        } else {
          country = 'Bangladesh';
        }
      } else {
        country = 'Global';
      }

      currentInfo = {
        id: tvgId || `chan_${channels.length}_${Math.random().toString(36).substring(2, 6)}`,
        name: rawName,
        cleanName: cleanName || rawName,
        resolution,
        logo: logoMatch ? logoMatch[1] : '',
        category,
        subCategory,
        language: defaultSource,
        country,
      };
    } else if (!line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://'))) {
      if (currentInfo) {
        // Prevent duplicate streams
        if (!seenUrls.has(line)) {
          seenUrls.add(line);
          currentInfo.url = line;
          channels.push(currentInfo as Channel);
        }
        currentInfo = null;
      }
    }
  }

  return channels;
}

// 15+ Top Curated Sports Channels (Cricket, Football, Combat, Extreme & Racing)
export const CURATED_SPORTS_CHANNELS: Channel[] = [
  {
    id: 'CricketGold.au@SD',
    name: 'Cricket Gold HD (Cricket Live)',
    cleanName: 'Cricket Gold HD',
    resolution: '1080P',
    logo: 'https://resources.cricket-australia.pulselive.com/cricket-australia/photo/2025/07/25/836eddae-4329-4542-ad17-dcd37e9d951a/Cricket-Gold-1920x1080_noBG.png',
    category: 'Sports',
    subCategory: 'Cricket',
    url: 'https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'FIFAPlus.uk@English',
    name: 'FIFA+ HD (Official World Football)',
    cleanName: 'FIFA+ Football',
    resolution: '720P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/FIFA%2B_(2025).svg/960px-FIFA%2B_(2025).svg.png',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://jmp2.uk/plu-660c29b5aec9680008f5b4a4.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'RealMadridTV.es@SD',
    name: 'Real Madrid TV (Football Live)',
    cleanName: 'Real Madrid TV',
    resolution: '720P',
    logo: 'https://i.imgur.com/5pMo7dL.png',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://rmtv.akamaized.net/hls/live/2043153/rmtv-es-web/master.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'RedBullTV.at@EUMENA',
    name: 'Red Bull TV HD (Extreme Sports)',
    cleanName: 'Red Bull TV',
    resolution: '1080P',
    logo: 'https://images.pluto.tv/channels/5e7cb84a172a0f0007da69e4/colorLogoPNG.png',
    category: 'Sports',
    subCategory: 'Racing',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'FITE247.us@SD',
    name: 'FITE 24/7 HD (Boxing & MMA)',
    cleanName: 'FITE 24/7 Combat',
    resolution: '1080P',
    logo: 'https://i.imgur.com/ESV6qgH.png',
    category: 'Sports',
    subCategory: 'Combat',
    url: 'https://d3d85c7qkywguj.cloudfront.net/scheduler/scheduleMaster/263.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'AlIraqiaSport.iq@SD',
    name: 'Al Iraqia Sport (Live Football)',
    cleanName: 'Al Iraqia Football',
    resolution: '720P',
    logo: 'https://i.imgur.com/DrrlxTO.png',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://imn-live.esite-lab.com/hls/iraqia-sports-1.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'BahrainSports1.bh@SD',
    name: 'Bahrain Sports 1 (Football & Leagues)',
    cleanName: 'Bahrain Sports 1',
    resolution: '720P',
    logo: 'https://i.imgur.com/fBpLsbC.png',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://5c7b683162943.streamlock.net/live/ngrp:sportsone_all/playlist.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'BahrainSports2.bh@SD',
    name: 'Bahrain Sports 2 HD',
    cleanName: 'Bahrain Sports 2',
    resolution: '720P',
    logo: 'https://i.imgur.com/ZkuZmIo.png',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://5c7b683162943.streamlock.net/live/ngrp:bahrainsportstwo_all/playlist.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'Racingcom.au@SD',
    name: 'Racing.com HD (Live Racing)',
    cleanName: 'Racing.com Live',
    resolution: '720P',
    logo: 'https://i.imgur.com/Q55HX1O.png',
    category: 'Sports',
    subCategory: 'Racing',
    url: 'https://racingvic-i.akamaized.net/hls/live/598695/racingvic/index1500.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'ExtremeSportsChannel.ru@SD',
    name: 'Extreme Sports Channel (Adventure Sports)',
    cleanName: 'Extreme Sports',
    resolution: '576P',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/Extreme_Sports_Channel.svg/960px-Extreme_Sports_Channel.svg.png',
    category: 'Sports',
    subCategory: 'Racing',
    url: 'http://46.32.176.50/extremesport/index.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: '30AGolfKingdom.us@SD',
    name: '30A Golf Kingdom HD',
    cleanName: 'Golf Kingdom',
    resolution: '720P',
    logo: 'https://i.imgur.com/Lv53nh4.png',
    category: 'Sports',
    subCategory: 'AllSports',
    url: 'https://30a-tv.com/feeds/vidaa/golf.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'Africa24Sport.fr@SD',
    name: 'Africa 24 Sport (Football & Athletics)',
    cleanName: 'Africa 24 Sport',
    resolution: '1080P',
    logo: 'https://i0.wp.com/africa24tv.com/wp-content/uploads/2023/12/LOGO-AFRICASPORT-4-HD-sans-fond.png?fit=512%2C107&ssl=1',
    category: 'Sports',
    subCategory: 'Football',
    url: 'https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'ACCDigitalNetwork.us@SD',
    name: 'ACC Digital Sports HD',
    cleanName: 'ACC Sports',
    resolution: '1080P',
    logo: 'https://i.imgur.com/V6Kaqha.png',
    category: 'Sports',
    subCategory: 'AllSports',
    url: 'https://raycom-accdn-firetv.amagi.tv/playlist.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'FloRacing.us@HD',
    name: 'FloRacing HD (Motorsports & Speed)',
    cleanName: 'FloRacing Motors',
    resolution: '1080P',
    logo: 'https://images.fubo.tv/channel-config-ui/station-logos/on-dark/floracing-white.png',
    category: 'Sports',
    subCategory: 'Racing',
    url: 'https://3ea22335.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWdiX1JlZEJ1bGxUVl9ITFM/playlist.m3u8',
    language: 'sports',
    country: 'Global'
  },
  {
    id: 'FightNetwork.ca@SD',
    name: 'Fight Network (Combat & MMA)',
    cleanName: 'Fight Network',
    resolution: '1080P',
    logo: 'https://i.imgur.com/vlKPZHR.png',
    category: 'Sports',
    subCategory: 'Combat',
    url: 'https://d3d85c7qkywguj.cloudfront.net/scheduler/scheduleMaster/263.m3u8',
    language: 'sports',
    country: 'Global'
  }
];

// Fallback curated channels for Bangladesh
export const FALLBACK_BENGALI_CHANNELS: Channel[] = [
  {
    id: 'JamunaTV.bd@SD',
    name: 'Jamuna TV (1080p)',
    cleanName: 'Jamuna TV',
    resolution: '1080P',
    logo: 'https://i.imgur.com/gK9J2xO.png',
    category: 'News',
    url: 'https://live-cdn.jamuna.tv/jamuna/live/tracks-v1a1/mono.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'SomoyTV.bd@SD',
    name: 'Somoy TV (720p)',
    cleanName: 'Somoy TV',
    resolution: '720P',
    logo: 'https://i.imgur.com/kYqK8h4.png',
    category: 'News',
    url: 'https://somoynews.tv/live/somoytv/tracks-v1a1/mono.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'BanglaVision.bd@SD',
    name: 'Bangla Vision (720p)',
    cleanName: 'Bangla Vision',
    resolution: '720P',
    logo: 'https://i.imgur.com/nCWgp38.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynaott.com/banglavision/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'ATNBangla.bd@SD',
    name: 'ATN Bangla (720p)',
    cleanName: 'ATN Bangla',
    resolution: '720P',
    logo: 'https://i.imgur.com/K1HmMRz.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynascope.net/atnbangla/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'BoishakhiTV.bd@SD',
    name: 'Boishakhi TV (720p)',
    cleanName: 'Boishakhi TV',
    resolution: '720P',
    logo: 'https://i.imgur.com/gxL05Y4.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynaott.com/boishakhitv/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'RTV.bd@SD',
    name: 'RTV (720p)',
    cleanName: 'RTV',
    resolution: '720P',
    logo: 'https://i.imgur.com/p6bXF2I.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynaott.com/rtv/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'Channeli.bd@SD',
    name: 'Channel i (720p)',
    cleanName: 'Channel i',
    resolution: '720P',
    logo: 'https://i.imgur.com/lM61jJq.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynaott.com/channeli/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'GaanBangla.bd@SD',
    name: 'Gaan Bangla (720p)',
    cleanName: 'Gaan Bangla',
    resolution: '720P',
    logo: 'https://i.imgur.com/6UuB9gS.png',
    category: 'Music',
    url: 'https://tvsen5.aynaott.com/gaanbangla/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'EkattorTV.bd@SD',
    name: 'Ekattor TV (720p)',
    cleanName: 'Ekattor TV',
    resolution: '720P',
    logo: 'https://i.imgur.com/4q3214w.png',
    category: 'News',
    url: 'https://tvsen5.aynaott.com/ekattortv/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  },
  {
    id: 'NTV.bd@SD',
    name: 'NTV (720p)',
    cleanName: 'NTV',
    resolution: '720P',
    logo: 'https://i.imgur.com/vHq066G.png',
    category: 'Entertainment',
    url: 'https://tvsen5.aynaott.com/ntv/index.m3u8',
    language: 'ben',
    country: 'Bangladesh'
  }
];

// Fallback curated channels for India
export const FALLBACK_HINDI_CHANNELS: Channel[] = [
  {
    id: 'ABPAnanda.in@SD',
    name: 'ABP Ananda (1080p)',
    cleanName: 'ABP Ananda',
    resolution: '1080P',
    logo: 'https://dtil.tmsimg.com/assets/s142518_ld_h15_aa.png?lock=720x540',
    category: 'News',
    url: 'https://d2l4ar6y3mrs4k.cloudfront.net/live-streaming/ananda-livetv/master.m3u8',
    language: 'ben',
    country: 'India'
  },
  {
    id: 'AajTak.in@SD',
    name: 'Aaj Tak (1080p)',
    cleanName: 'Aaj Tak',
    resolution: '1080P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Aaj_tak_logo.png',
    category: 'News',
    url: 'https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8',
    language: 'hin',
    country: 'India'
  },
  {
    id: 'NDTVIndia.in@SD',
    name: 'NDTV India (1080p)',
    cleanName: 'NDTV India',
    resolution: '1080P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/NDTV_India_logo.svg/512px-NDTV_India_logo.svg.png',
    category: 'News',
    url: 'https://ndtvindiaelemarchana.akamaized.net/hls/live/2003679-b/ndtvindia/livefeed/master.m3u8',
    language: 'hin',
    country: 'India'
  },
  {
    id: 'IndiaTV.in@SD',
    name: 'India TV (1080p)',
    cleanName: 'India TV',
    resolution: '1080P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/India_TV_logo.png',
    category: 'News',
    url: 'https://indiatvnews-live.akamaized.net/hls/live/2042570/ITV_Live/master.m3u8',
    language: 'hin',
    country: 'India'
  },
  {
    id: 'DDNational.in@SD',
    name: 'DD National (1080p)',
    cleanName: 'DD National',
    resolution: '1080P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/DD_National_2023.svg/512px-DD_National_2023.svg.png',
    category: 'General',
    url: 'https://linear-1.akamaized.net/hls/live/2041076/ddnational/master.m3u8',
    language: 'hin',
    country: 'India'
  },
  {
    id: 'DDNews.in@SD',
    name: 'DD News (1080p)',
    cleanName: 'DD News',
    resolution: '1080P',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/DD_News_Logo.svg/512px-DD_News_Logo.svg.png',
    category: 'News',
    url: 'https://linear-1.akamaized.net/hls/live/2041077/ddnews/master.m3u8',
    language: 'hin',
    country: 'India'
  },
  {
    id: 'AakaashAath.in@SD',
    name: 'Aakaash Aath (576p)',
    cleanName: 'Aakaash Aath',
    resolution: '576P',
    logo: 'https://dtil.tmsimg.com/assets/s142510_ld_h15_ab.png?lock=720x540',
    category: 'Entertainment',
    url: 'https://tvsen5.aynascope.net/Wm9Lv2RjZGT6/index.m3u8',
    language: 'ben',
    country: 'India'
  }
];
