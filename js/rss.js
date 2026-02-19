/**
 * rss.js — F Your Feelings Podcast RSS Feed Module
 */

const FyfRSS = (() => {
  const FEED_URL = 'https://anchor.fm/s/108379980/podcast/rss';
  const PROXY_URL = '/api/rss';
  const CACHE_KEY = 'fyf_rss_cache_v5';
  const CACHE_TTL = 5 * 60 * 1000;

  function parseRSS(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'application/xml');
    const parseError = xml.querySelector('parsererror');
    if (parseError) throw new Error('RSS parse error: ' + parseError.textContent);

    const channel = xml.querySelector('channel');
    const channelImage = channel.querySelector('image > url')?.textContent ||
      getAttr(channel, 'itunes\\:image', 'href') ||
      channel.querySelector('[name="itunes:image"]')?.getAttribute('href') || '';

    const items = Array.from(xml.querySelectorAll('item'));

    return items.map((item) => {
      const getText = (sel) => {
        const el = item.querySelector(sel);
        return el ? (el.textContent || el.innerHTML || '').trim() : '';
      };

      const rawTitle = getText('title');

      let epNum = getText('itunes\\:episode');
      if (!epNum) {
        const match = rawTitle.match(/^(\d+)/);
        epNum = match ? match[1] : '';
      }

      let coverArt = channelImage;
      const itunesImage = item.querySelector('itunes\\:image') || item.getElementsByTagName('itunes:image')[0];
      if (itunesImage?.getAttribute?.('href')) {
        coverArt = itunesImage.getAttribute('href');
      }
      if (!coverArt || coverArt.trim() === '') {
        coverArt = getDummyCoverURL(epNum || '0');
      }

      let audioUrl = '';
      let audioLength = '';
      let audioType = '';
      const enclosure = item.querySelector('enclosure');
      if (enclosure) {
        audioUrl = enclosure.getAttribute('url') || '';
        audioLength = enclosure.getAttribute('length') || '';
        audioType = enclosure.getAttribute('type') || '';
      }

      const duration = getText('itunes\\:duration');
      const guid = getText('guid');
      const slug = slugify(rawTitle) || guid.split('-')[0];

      const descEl = item.querySelector('description');
      let description = '';
      if (descEl) {
        description = descEl.textContent || descEl.innerHTML || '';
        description = decodeHTMLEntities(description);
      }

      const spotifyLink = getText('link');
      const pubDateRaw = getText('pubDate');
      const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;

      return {
        title: rawTitle,
        epNum: epNum ? parseInt(epNum, 10) : null,
        slug, guid, coverArt,
        audioUrl,
        audioLength: parseInt(audioLength, 10) || 0,
        audioType, duration, description, spotifyLink,
        pubDate,
        pubDateFormatted: pubDate ? formatDate(pubDate) : '',
        pubDateISO: pubDate ? pubDate.toISOString() : '',
      };
    });
  }

  function getAttr(parent, selectors, attr) {
    for (const sel of selectors.split(',')) {
      const el = parent.querySelector(sel.trim());
      if (el) return el.getAttribute(attr) || '';
    }
    return '';
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
  }

  function getDummyCoverURL(epNum) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23252525' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='VT323' font-size='48' fill='%2339ff14' text-anchor='middle' dominant-baseline='middle'%3EEP ${epNum}%3C/text%3E%3C/svg%3E`;
  }

  function decodeHTMLEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatDuration(dur) {
    if (!dur) return '';
    const parts = dur.split(':').map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m ${s}s`;
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return `${m}m ${s}s`;
    }
    return dur;
  }

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return null;
      return data;
    } catch { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { }
  }

  async function getEpisodes() {
    const cached = readCache();
    if (cached) {
      console.log('[FYF RSS] Serving from cache —', cached.length, 'episodes');
      return cached;
    }
    console.log('[FYF RSS] Fetching live feed via proxy…');
    const response = await fetch(PROXY_URL, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
    const xmlText = await response.text();
    const episodes = parseRSS(xmlText);
    console.log('[FYF RSS] Feed parsed —', episodes.length, 'episodes');
    episodes.slice(0, 3).forEach((ep, i) => {
      console.log(`  ${i + 1}. "${ep.title}" [Aud: ${ep.audioUrl ? 'Yes' : 'No'}]`);
    });
    writeCache(episodes);
    updateEpisodeCount(episodes.length);
    return episodes;
  }

  function updateEpisodeCount(count) {
    const el = document.getElementById('episode-count-stat');
    if (el) {
      el.textContent = `${count}`;
      console.log(`[FYF RSS] Updated DOM episode count: ${count}`);
    }
  }

  async function getEpisodeByNum(num) {
    const episodes = await getEpisodes();
    return episodes.find((ep) => ep.epNum === Number(num)) || null;
  }

  async function getLatest() {
    const episodes = await getEpisodes();
    return episodes[0] || null;
  }

  function renderEpisodeCard(ep, featured = false, allEpisodes = []) {
    const epLabel = ep.epNum ? `EP. ${ep.epNum}` : 'EP';
    const dur = formatDuration(ep.duration);

    // Use GUID as the URL key if another episode shares the same epNum (split episodes)
    const isDuplicate = ep.epNum && allEpisodes.filter(e => e.epNum === ep.epNum).length > 1;
    const epKey = isDuplicate ? encodeURIComponent(ep.guid) : encodeURIComponent(ep.epNum || ep.guid);

    return `
    <article class="episode-card" data-ep="${ep.epNum || ''}" role="listitem">
      <a href="episode.html?ep=${epKey}"
         class="episode-card__link"
         aria-label="Go to episode: ${escapeHtml(ep.title)}">
        <div class="episode-card__artwork">
          <img src="${ep.coverArt}" alt="${escapeHtml(ep.title)}" loading="lazy" decoding="async" width="100" height="100" data-fallback="${escapeHtml(getDummyCoverURL(ep.epNum || '0'))}" onerror="if(this.dataset.fallback){this.onerror=null;this.src=this.dataset.fallback}"/>
          <div class="episode-card__play-overlay" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="episode-card__body">
          <div class="episode-card__meta">
            <span class="episode-card__ep-label">${epLabel}</span>
            ${dur ? `<span class="episode-card__duration">${dur}</span>` : ''}
            <time class="episode-card__date" datetime="${ep.pubDateISO}">${ep.pubDateFormatted}</time>
          </div>
          <h3 class="episode-card__title">${escapeHtml(ep.title)}</h3>
        </div>
      </a>
      ${ep.audioUrl ? `
      <div class="custom-player" data-duration="${ep.duration || ''}">
        <audio preload="none" src="${ep.audioUrl}" type="${ep.audioType || 'audio/mpeg'}"></audio>
        <button class="player-btn play-btn" aria-label="Play Episode">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="player-progress-container">
          <div class="player-progress-bar"></div>
        </div>
        <div class="player-time">00:00</div>
      </div>` : ''}
    </article>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildEpisodeSchema(ep) {
    return {
      '@context': 'https://schema.org',
      '@type': 'PodcastEpisode',
      name: ep.title,
      url: `https://fyourfeelingspod.com/episode.html?ep=${ep.epNum}`,
      datePublished: ep.pubDateISO,
      description: ep.description.replace(/<[^>]*>/g, '').slice(0, 500),
      associatedMedia: {
        '@type': 'MediaObject',
        contentUrl: ep.audioUrl,
        encodingFormat: ep.audioType,
        contentSize: ep.audioLength,
      },
      partOfSeries: {
        '@type': 'PodcastSeries',
        name: 'F Your Feelings Podcast',
        url: 'https://fyourfeelingspod.com',
      },
      image: ep.coverArt,
      episodeNumber: ep.epNum,
    };
  }

  return { getEpisodes, getEpisodeByNum, getLatest, renderEpisodeCard, buildEpisodeSchema, formatDuration, escapeHtml, slugify };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FyfRSS };
} else {
  window.FyfRSS = FyfRSS;
}
