/**
 * Spotify Episode Scraper & Parser
 * Fetches F Your Feelings podcast episodes from Spotify API
 * Fallback to RSS feed for critical data
 */

const SpotifyModule = (() => {
  // Spotify API Configuration
  const PODCAST_ID = '08Ms4yr3c3WEE0YSSQlZir'; // F Your Feelings Podcast Spotify ID
  const RSS_FEED_URL = 'https://anchor.fm/s/108379980/podcast/rss';
  const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // CORS proxy for RSS

  // Cache configuration
  const CACHE_KEY = 'fyf_episodes_cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Parse Spotify Web Player embed for episode data
   * Fallback method when API is unavailable
   */
  async function fetchFromSpotify() {
    try {
      // Try to fetch via Spotify Web Player API (embedded player data)
      const spotifyUrl = `https://open.spotify.com/embed/show/${PODCAST_ID}`;

      // Spotify doesn't expose a traditional REST API for public shows anymore,
      // so we'll use the RSS feed as primary source and enhance with Spotify player links
      console.log('Spotify Web API not directly available, using RSS feed');
      return null;
    } catch (error) {
      console.warn('Spotify fetch failed:', error);
      return null;
    }
  }

  /**
   * Fetch and parse RSS feed for episodes
   */
  async function fetchFromRSS() {
    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_FEED_URL));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Failed to parse RSS XML');
      }

      return parseRSSDoc(xmlDoc);
    } catch (error) {
      console.error('RSS fetch failed:', error);
      return null;
    }
  }

  /**
   * Parse RSS XML document into episode array
   */
  function parseRSSDoc(xmlDoc) {
    const items = xmlDoc.querySelectorAll('item');
    const episodes = [];

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent || 'Untitled';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const guid = item.querySelector('guid')?.textContent || `ep-${index}`;
      const link = item.querySelector('link')?.textContent || '';

      // iTunes namespace elements
      const itunesNS = item.querySelector('itunes\\:episode, [name="itunes:episode"]');
      let epNum = itunesNS?.textContent;

      // Fallback: try to extract from title (e.g. "15 - ...")
      if (!epNum) {
        const titleMatch = title.match(/^(\d+)/);
        if (titleMatch) {
          epNum = titleMatch[1];
        } else {
          epNum = `${items.length - index}`;
        }
      }

      // Handle "Part 2" episodes (e.g. "Episode 15 Part 2" -> 15.5)
      // This allows unique mapping in js/youtube.js and prevents ID collision
      if (title.toLowerCase().includes('part 2') && !title.toLowerCase().includes('part 1')) {
        const num = parseFloat(epNum);
        if (!isNaN(num)) {
          epNum = num + 0.5;
        }
      }

      const itinesDuration = item.querySelector('itunes\\:duration, [name="itunes:duration"]');
      const duration = itinesDuration?.textContent || '00:00:00';

      // Get image - try multiple selectors for iTunes image (Anchor/Spotify RSS)
      let coverArt = null;
      const itunesImage = item.querySelector('itunes\\:image') || item.getElementsByTagName('itunes:image')[0];
      if (itunesImage?.getAttribute?.('href')) {
        coverArt = itunesImage.getAttribute('href');
      }

      // Fallback: try to get channel image if episode image missing
      if (!coverArt) {
        const channelImage = xmlDoc.querySelector('channel > itunes\\:image');
        if (channelImage?.getAttribute('href')) {
          coverArt = channelImage.getAttribute('href');
        }
      }

      // Final fallback: dummy image with episode number
      if (!coverArt) {
        coverArt = getDummyCoverURL(epNum);
      }

      const enclosure = item.querySelector('enclosure');
      const audioUrl = enclosure?.getAttribute('url') || '';
      const audioType = enclosure?.getAttribute('type') || 'audio/mpeg';

      const episode = {
        title: cleanTitle(title),
        epNum: parseInt(epNum) || index + 1,
        slug: generateSlug(guid),
        guid,
        coverArt,
        audioUrl,
        audioType,
        duration: formatDuration(duration),
        durationSeconds: durationToSeconds(duration),
        description: cleanHTML(description),
        spotifyLink: `https://open.spotify.com/episode/${guid.split(':').pop()}`,
        pubDate,
        pubDateFormatted: formatDate(pubDate),
        pubDateISO: new Date(pubDate).toISOString().split('T')[0],
      };

      // Debug logging
      console.log(`EP ${episode.epNum}: ${episode.title.substring(0, 40)}... | Image: ${coverArt ? '✓' : '✗'}`);

      episodes.push(episode);
    });

    // Sort by episode number (descending - newest first)
    return episodes.sort((a, b) => b.epNum - a.epNum);
  }

  /**
   * Helper: Clean HTML from description
   */
  function cleanHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  /**
   * Helper: Clean episode title of special characters
   */
  function cleanTitle(title) {
    return title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }

  /**
   * Helper: Generate URL-friendly slug
   */
  function generateSlug(guid) {
    return guid.split(':').pop().substring(0, 12);
  }

  /**
   * Helper: Format duration string
   */
  function formatDuration(duration) {
    // Spotify sometimes returns seconds as integer, other times HH:MM:SS
    if (!duration) return '00:00:00';
    if (!duration.includes(':')) {
      const seconds = parseInt(duration);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return duration;
  }

  /**
   * Helper: Convert duration to seconds
   */
  function durationToSeconds(duration) {
    if (!duration) return 0;
    const parts = duration.split(':');
    if (parts.length === 3) {
      return (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
    } else if (parts.length === 2) {
      return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }
    return 0;
  }

  /**
   * Helper: Format publish date
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  }

  /**
   * Get dummy cover art URL for episodes missing Spotify image
   */
  function getDummyCoverURL(epNum) {
    // Return a solid color placeholder with episode number
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23252525' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='VT323' font-size='48' fill='%2339ff14' text-anchor='middle' dominant-baseline='middle'%3EEP ${epNum}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Get cached episodes or fetch fresh
   */
  async function getEpisodes(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        console.log('Using cached episodes');
        return cached;
      }
    }

    console.log('Fetching fresh episodes from RSS...');

    // Try Spotify first, fallback to RSS
    let episodes = await fetchFromSpotify();
    if (!episodes) {
      episodes = await fetchFromRSS();
    }

    if (episodes && episodes.length > 0) {
      saveToCache(episodes);
      return episodes;
    }

    return [];
  }

  /**
   * Get single episode by number
   */
  async function getEpisodeByNum(epNum) {
    const episodes = await getEpisodes();
    return episodes.find(ep => ep.epNum === epNum) || null;
  }

  /**
   * Get latest episode
   */
  async function getLatest() {
    const episodes = await getEpisodes();
    return episodes[0] || null;
  }

  /**
   * Get featured episode (latest)
   */
  async function getFeatured() {
    return getLatest();
  }

  /**
   * Get episodes grid (latest N episodes)
   */
  async function getGrid(count = 6) {
    const episodes = await getEpisodes();
    return episodes.slice(0, count);
  }

  /**
   * Cache management
   */
  function saveToCache(episodes) {
    try {
      const cacheData = {
        episodes,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache save failed:', error);
    }
  }

  function getFromCache() {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > CACHE_TTL) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }

      return cacheData.episodes;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  }

  function clearCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Render compact episode list item (smaller layout)
   */
  function renderEpisodeCard(episode, featured = false) {
    const episodePageUrl = `episode.html?ep=${encodeURIComponent(episode.guid)}`;
    return `
      <div class="episode-list-item" data-ep-num="${episode.epNum}">
        <a href="${episodePageUrl}" class="episode-list-cover" aria-label="Go to episode ${episode.epNum}: ${episode.title}">
          <img src="${episode.coverArt}" alt="EP ${episode.epNum}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23252525%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-family=%22VT323%22 font-size=%2224%22 fill=%22%2339ff14%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EEP ${episode.epNum}%3C/text%3E%3C/svg%3E'">
        </a>
        <a href="${episodePageUrl}" class="episode-list-info" aria-label="Go to episode ${episode.epNum}">
          <div class="episode-list-number">EPISODE ${episode.epNum}</div>
          <div class="episode-list-title">${episode.title}</div>
          <div class="episode-list-meta">
            <span>${episode.pubDateFormatted}</span>
            <span>⏱ ${episode.duration}</span>
          </div>
        </a>
        <div class="episode-list-actions">
          <button class="episode-play-btn" data-episode="${episode.epNum}" data-audio="${episode.audioUrl}" data-type="${episode.audioType}">▶ PLAY</button>
          
          ${(() => {
        if (typeof FyfYouTube !== 'undefined') {
          const videoId = FyfYouTube.getVideoIdForEpisode(episode.epNum);
          if (videoId) {
            return `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" class="episode-play-btn" style="background: #FF0000; border-color: #FF0000; color: white; text-decoration: none;">📺 Watch</a>`;
          }
        }
        return '';
      })()}

          <a href="${episode.spotifyLink}" target="_blank" rel="noopener" title="Listen on Spotify" class="episode-play-btn" style="background: #1DB954; padding: 8px 12px; text-decoration: none;">🎵 Spotify</a>
        </div>
        
        <!-- Inline Player Container -->
        <div id="player-container-${episode.epNum}" class="inline-player-container"></div>
      </div>
    `;
  }

  /**
   * Render inline audio player
   */
  function renderAudioPlayer(episode) {
    return `
      <div class="audio-player">
        <div class="audio-player-header">▶ NOW PLAYING: Episode ${episode.epNum}</div>
        <audio controls preload="metadata">
          <source src="${episode.audioUrl}" type="${episode.audioType}">
          Your browser does not support the audio element.
        </audio>
        <div class="player-controls">
          <span class="player-time">${episode.duration}</span>
          <div class="player-actions">
            <a href="${episode.spotifyLink}" target="_blank" rel="noopener" class="player-btn">Listen on Spotify</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build JSON-LD schema for episode
   */
  function buildEpisodeSchema(episode) {
    return {
      '@context': 'https://schema.org',
      '@type': 'PodcastEpisode',
      name: episode.title,
      episodeNumber: episode.epNum,
      datePublished: episode.pubDateISO,
      duration: `PT${durationToISO8601(episode.durationSeconds)}`,
      url: `https://fyourfeelingspod.com/episode.html?ep=${encodeURIComponent(episode.guid)}`,
      image: episode.coverArt,
      audio: {
        '@type': 'AudioObject',
        url: episode.audioUrl,
        contentUrl: episode.audioUrl,
        duration: `PT${durationToISO8601(episode.durationSeconds)}`,
      },
      description: episode.description.substring(0, 500),
    };
  }

  /**
   * Helper: Duration to ISO 8601
   */
  function durationToISO8601(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}H${minutes}M${secs}S`;
  }

  // Public API
  return {
    getEpisodes,
    getEpisodeByNum,
    getLatest,
    getFeatured,
    getGrid,
    clearCache,
    renderEpisodeCard,
    renderAudioPlayer,
    buildEpisodeSchema,
  };
})();

// Make available globally
window.SpotifyModule = SpotifyModule;
