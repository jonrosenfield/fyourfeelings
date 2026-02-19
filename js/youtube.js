/**
 * youtube.js — F Your Feelings YouTube Shorts Integration
 * Fetches latest videos from YouTube RSS via proxy and renders them as shorts.
 */

const FyfYouTube = (() => {
  const CHANNEL_ID = 'UCoaVAK7NqklDQhVaoLjTvrw';
  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  const PROXY_URL = '/api/yt';

  const FALLBACK_SHORTS = [
    // ... (omitting for brevity in thought, but tool will use full content)
    {
      videoId: 'Bv1RVmfe_E0',
      title: "Ski Jumpers Were Injecting Themselves for Olympic Gold",
      thumbnail: 'https://i.ytimg.com/vi/Bv1RVmfe_E0/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/Bv1RVmfe_E0'
    },
    {
      videoId: 'JW41kIP605M',
      title: "The Vasectomy Mystery: Where Does It Go?",
      thumbnail: 'https://i.ytimg.com/vi/JW41kIP605M/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/JW41kIP605M'
    },
    {
      videoId: 'hbrdMRAUWxI',
      title: "This Ad is Absolutely Insane",
      thumbnail: 'https://i.ytimg.com/vi/hbrdMRAUWxI/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/hbrdMRAUWxI'
    },
    {
      videoId: 'S2lBAWdKyUU',
      title: "Will Jordan Be Forgotten? NBA’s 1000 Year Future",
      thumbnail: 'https://i.ytimg.com/vi/S2lBAWdKyUU/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/S2lBAWdKyUU'
    },
    {
      videoId: 'dOzD-uilVk0',
      title: "A Rare Winter Malfunction: Tweaker Geographic",
      thumbnail: 'https://i.ytimg.com/vi/dOzD-uilVk0/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/dOzD-uilVk0'
    },
    {
      videoId: 'AKnSr0tIFEQ',
      title: "The #1 Relationship Deal Breaker?",
      thumbnail: 'https://i.ytimg.com/vi/AKnSr0tIFEQ/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/AKnSr0tIFEQ'
    },
    {
      videoId: 'RAKZw2aNOFA',
      title: "Mansplaining vs. Shelaborating: Which is Worse?",
      thumbnail: 'https://i.ytimg.com/vi/RAKZw2aNOFA/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/RAKZw2aNOFA'
    },
    {
      videoId: 'xUD1nWat8MA',
      title: "Real or AI? The Glitch That Fooled Us",
      thumbnail: 'https://i.ytimg.com/vi/xUD1nWat8MA/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/xUD1nWat8MA'
    },
    {
      videoId: 'IZU2t4o09fA',
      title: "Your Face Is Being Scanned: The Death of Anonymity",
      thumbnail: 'https://i.ytimg.com/vi/IZU2t4o09fA/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/IZU2t4o09fA'
    },
    {
      videoId: 'cefT5-hWlgI',
      title: "Why 1980s Fitness Was Actually Insane",
      thumbnail: 'https://i.ytimg.com/vi/cefT5-hWlgI/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/cefT5-hWlgI'
    },
    {
      videoId: 'm3qPyA_q44Q',
      title: "This Commercial Gets Worse Every Second",
      thumbnail: 'https://i.ytimg.com/vi/m3qPyA_q44Q/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/m3qPyA_q44Q'
    },
    {
      videoId: 'dTpbEu-DaJY',
      title: "I’m Clearly Not Built For This",
      thumbnail: 'https://i.ytimg.com/vi/dTpbEu-DaJY/hqdefault.jpg',
      link: 'https://www.youtube.com/shorts/dTpbEu-DaJY'
    }
  ];

  async function getLatestShorts(limit = 15) {
    try {
      console.log('[FYF YT] Fetching via proxy:', PROXY_URL);
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(RSS_URL)}`);
      if (!response.ok) throw new Error('Proxy fetch failed');

      const xmlText = await response.text();
      if (!xmlText) throw new Error('Empty response from proxy');

      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, 'application/xml');
      const entries = Array.from(xml.getElementsByTagName('entry'));

      if (entries.length === 0) {
        // Double check if proxy wrapped it in JSON (unlikely for current setup but good safety)
        try {
          const json = JSON.parse(xmlText);
          if (json.contents) {
            const xml2 = parser.parseFromString(json.contents, 'application/xml');
            const entries2 = Array.from(xml2.getElementsByTagName('entry'));
            if (entries2.length > 0) return processEntries(entries2, limit);
          }
        } catch (e) { }
        throw new Error('No entries found in RSS');
      }

      return processEntries(entries, limit);
    } catch (err) {
      console.warn('[FYF YT] Live fetch failed. Using fallback shorts.', err);
      return FALLBACK_SHORTS;
    }
  }

  function processEntries(entries, limit) {
    return entries
      .filter(entry => {
        const link = entry.getElementsByTagName('link')[0]?.getAttribute('href') || '';
        return link.includes('/shorts/');
      })
      .slice(0, limit)
      .map(entry => {
        const videoId = entry.getElementsByTagName('yt:videoId')[0]?.textContent ||
          entry.getElementsByTagName('videoId')[0]?.textContent;
        const title = entry.getElementsByTagName('title')[0]?.textContent;
        const thumbnail = entry.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const link = `https://www.youtube.com/shorts/${videoId}`;

        return { videoId, title, thumbnail, link };
      });
  }

  function renderShortCard(short) {
    return `
            <div class="clip-card" data-video-id="${short.videoId}">
                <div class="clip-card__media">
                    <img src="${short.thumbnail}" class="clip-card__thumbnail" alt="${FyfRSS.escapeHtml(short.title)}" loading="lazy">
                    <div class="clip-card__play-btn">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
                <div class="clip-card__body">
                    <div class="clip-card__label">SHORTS</div>
                    <h3 class="clip-card__title">${FyfRSS.escapeHtml(short.title)}</h3>
                </div>
            </div>
        `;
  }

  function openModal(videoId) {
    const overlay = document.getElementById('youtube-overlay');
    const iframe = document.getElementById('youtube-iframe');
    if (!overlay || !iframe) return;

    // Reset src first to ensure fresh load
    iframe.src = 'about:blank';
    setTimeout(() => {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent scroll
    }, 10);
  }

  function closeModal() {
    const overlay = document.getElementById('youtube-overlay');
    const iframe = document.getElementById('youtube-iframe');
    if (!overlay || !iframe) return;

    overlay.classList.remove('open');
    iframe.src = 'about:blank'; // Stop video properly
    document.body.style.overflow = ''; // Restore scroll
  }

  async function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Set up modal listeners
    const closeBtn = document.getElementById('youtube-modal-close');
    const overlay = document.getElementById('youtube-overlay');

    // Remove old listeners if any (simple way is re-cloning but usually not needed here)
    closeBtn?.replaceWith(closeBtn.cloneNode(true));
    const newCloseBtn = document.getElementById('youtube-modal-close');
    newCloseBtn?.addEventListener('click', closeModal);

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    const shorts = await getLatestShorts();

    if (shorts && shorts.length > 0) {
      container.innerHTML = shorts.map(renderShortCard).join('');
      console.log(`[FYF YT] Successfully rendered ${shorts.length} items core.`);

      // Touch-aware tap vs swipe detection
      let touchStartX = 0;
      let touchStartY = 0;
      let isTouchDevice = false;
      const SWIPE_THRESHOLD = 10;

      container.addEventListener('touchstart', (e) => {
        isTouchDevice = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);

        // Only open modal on clean taps (minimal finger movement)
        if (dx < SWIPE_THRESHOLD && dy < SWIPE_THRESHOLD) {
          const card = (touch.target.closest && touch.target.closest('.clip-card')) || touch.target;
          const videoId = card?.dataset?.videoId;
          if (videoId) openModal(videoId);
        }
      }, { passive: true });

      // Desktop: use click. On touch devices the touchend handler above covers it.
      container.addEventListener('click', (e) => {
        if (isTouchDevice) return;
        const card = e.target.closest('.clip-card');
        if (card?.dataset.videoId) openModal(card.dataset.videoId);
      });

    } else {
      container.innerHTML = '<p style="color:var(--text-muted);font-family:var(--font-mono);padding:2rem;">>> NO CLIPS DETECTED</p>';
    }
  }

  // ─── EPISODE MAPPING LOGIC ───────────────────────────────────────────

  // Episode number to YouTube video ID mapping
  // IDs fetched from FYF YouTube Playlist
  const EPISODE_VIDEOS = {
    18: '6PQlaIsVCU8', // Olympics PENISGATE
    17: 'CdysTeU55mM', // NIL Deal
    16: 'tK1YM-ZDS4I', // Elon Musk AI
    15: 'mxQ7-OqcMsI', // Indiana (Part 1)
    14: 'ZxA2lV91Cb0', // You've Been Doing It Wrong
    13: 'xJC-tnep94c', // Britney Spears Shirt
    12: 'DLHQ5I2ppLU', // Miami Hurricanes
    11: 'LD5asGZWdyc', // Eric's Post-Surgery
    10: 'qIjrst55TWs', // Roach
    9: 'ZBji3T1Awws', // Intimacy
    8: '-gPnE4DE6pA', // Gun in Mercedes
    7: 'uja0PtTPzqg', // Shower After Intimacy
    6: '1HdHIJcLoDc', // Fertility Clinic
    5: 'SkpWhT5OBGQ', // Toilet Seat
    4: 'V3Jf6koa96Q', // Hygiene
    3: 'GpX-IJn9GNM', // Cigarette Freedom
    2: 'LRgvhrMiIdo', // Childhood Confessions
    1: 'SIiZjncgPog', // Dolphins Disaster
  };

  // GUID-based mapping for split episodes (e.g. Episode 15 Part 2)
  // This handles cases where multiple RSS entries share the same epNum
  const GUID_VIDEOS = {
    'af893f6c-739c-4e51-ab23-3e4e8293c92f': 'qt84o9dXIPk', // Ep 15 Part 2 — Britney Spirals
  };

  function getVideoIdForEpisode(episodeNum, guid) {
    // Check GUID first (handles split episodes)
    if (guid && GUID_VIDEOS[guid]) return GUID_VIDEOS[guid];
    const num = Number(episodeNum);
    return EPISODE_VIDEOS[num] || null;
  }

  function buildYouTubeEmbed(videoData) {
    if (!videoData) return '';
    const videoId = typeof videoData === 'object' ? videoData.id : videoData;
    const startParam = (typeof videoData === 'object' && videoData.start) ? `&start=${videoData.start}` : '';

    return `<div class="youtube-embed-container"><iframe width="100%" height="600" src="https://www.youtube.com/embed/${videoId}?rel=0${startParam}" title="F Your Feelings Episode" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  }

  function buildYouTubeButton(videoData) {
    if (!videoData) return '';
    const videoId = typeof videoData === 'object' ? videoData.id : videoData;
    const timeParam = (typeof videoData === 'object' && videoData.start) ? `&t=${videoData.start}s` : '';

    return `<a href="https://www.youtube.com/watch?v=${videoId}${timeParam}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="color:#FF0000;border-color:#FF0000;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:6px;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>Watch on YouTube</a>`;
  }

  // ─── EXPORTS ──────────────────────────────────────────────────────────
  return {
    init,
    openModal,
    closeModal,
    getVideoIdForEpisode,
    buildYouTubeEmbed,
    buildYouTubeButton
  };
})();
