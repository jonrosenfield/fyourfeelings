/**
 * F Your Feelings - Main Application
 * Handles initialization, navigation, animations, and Spotify integration
 */

const FYF = (() => {
  // State
  let state = {
    episodes: [],
    currentEpisode: null,
    isNavOpen: false,
  };

  /**
   * Initialize entire application
   */
  async function init() {
    console.log('🎙️ F Your Feelings App Initializing...');

    // Setup DOM elements
    setupDOM();

    // Load episodes from Spotify
    await loadEpisodes();

    // Initialize scroll behaviors
    initScrollBehaviors();

    // Initialize intersection observer for animations
    initIntersectionObserver();

    // Setup event listeners
    setupEventListeners();

    // Hide loading screen
    hideLoadingScreen();

    console.log('✨ FYF App Ready!');
  }

  /**
   * Setup and cache DOM elements
   */
  function setupDOM() {
    window.DOM = {
      nav: document.querySelector('nav.nav-links'),
      hamburger: document.querySelector('.nav-hamburger'),
      navDrawer: document.querySelector('.nav-drawer'),
      scrollProgress: document.getElementById('scroll-progress'),
      episodesGrid: document.getElementById('episodes-grid'),
      loadingScreen: document.getElementById('loading-screen'),
      body: document.body,
    };
  }

  /**
   * Load episodes from Spotify/RSS and render
   */
  async function loadEpisodes() {
    try {
      state.episodes = await SpotifyModule.getEpisodes();
      console.log(`✓ Loaded ${state.episodes.length} episodes`);

      // Render featured episode
      const featured = state.episodes[0];
      if (featured) {
        renderFeaturedEpisode(featured);
      }

      // Render episodes grid
      renderEpisodesGrid();

      // Setup play button listeners
      setupPlayButtonListeners();
    } catch (error) {
      console.error('Failed to load episodes:', error);
      renderErrorState();
    }
  }

  /**
   * Render featured episode in hero section
   */
  function renderFeaturedEpisode(episode) {
    const heroSection = document.querySelector('#hero');
    if (!heroSection) return;

    const featuredHTML = `
      <div class="featured-episode-widget">
        ${SpotifyModule.renderAudioPlayer(episode)}
      </div>
    `;

    // Inject after hero content
    const heroContent = heroSection.querySelector('.hero-content');
    if (heroContent) {
      heroContent.insertAdjacentHTML('afterend', featuredHTML);
    }
  }

  /**
   * Render episodes in grid
   */
  function renderEpisodesGrid() {
    const grid = document.getElementById('episodes-grid');
    if (!grid) {
      // Create grid if it doesn't exist
      const episodesSection = document.querySelector('#episodes');
      if (!episodesSection) return;

      const gridHTML = '<div id="episodes-grid" class="episodes-grid"></div>';
      episodesSection.querySelector('.container').insertAdjacentHTML('beforeend', gridHTML);
      grid = document.getElementById('episodes-grid');
    }

    // Clear existing
    grid.innerHTML = '';

    // Render episodes (limit to 12 initially)
    const episodesToShow = state.episodes.slice(0, 12);
    episodesToShow.forEach((episode, index) => {
      const cardHTML = SpotifyModule.renderEpisodeCard(episode, index === 0);
      grid.insertAdjacentHTML('beforeend', cardHTML);

      // Add intersection observer for fade-in
      const card = grid.lastElementChild;
      if (card) {
        card.classList.add('reveal');
        window.observer?.observe(card);
      }
    });

    // Add "Load More" button if more episodes exist
    if (state.episodes.length > 12) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'btn btn-large';
      loadMoreBtn.textContent = 'LOAD MORE EPISODES';
      loadMoreBtn.style.width = '100%';
      loadMoreBtn.style.marginTop = '40px';
      loadMoreBtn.onclick = () => loadMoreEpisodes();
      grid.parentElement.appendChild(loadMoreBtn);
    }
  }

  /**
   * Load and render more episodes
   */
  function loadMoreEpisodes() {
    const grid = document.getElementById('episodes-grid');
    const currentCount = grid.querySelectorAll('.episode-list-item').length;
    const newEpisodes = state.episodes.slice(currentCount, currentCount + 6);

    newEpisodes.forEach((episode) => {
      const cardHTML = SpotifyModule.renderEpisodeCard(episode);
      grid.insertAdjacentHTML('beforeend', cardHTML);

      // Animate in
      const card = grid.lastElementChild;
      if (card) {
        card.classList.add('reveal', 'visible');
      }
    });

    // Update listeners
    setupPlayButtonListeners();

    // Remove load more button if all loaded
    if (grid.querySelectorAll('.episode-list-item').length >= state.episodes.length) {
      const loadMoreBtn = grid.parentElement.querySelector('.btn');
      if (loadMoreBtn) loadMoreBtn.remove();
    }
  }

  /**
   * Setup play button listeners for modal player
   */
  function setupPlayButtonListeners() {
    // Click on play buttons (▶)
    document.querySelectorAll('.episode-play-btn').forEach((btn) => {
      const epNum = btn.getAttribute('data-episode');
      const audioUrl = btn.getAttribute('data-audio');
      const audioType = btn.getAttribute('data-type');

      if (!epNum || !audioUrl) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const container = document.getElementById(`player-container-${epNum}`);
        if (!container) return;

        // If player already exists in this container, toggle it (remove it)
        if (container.innerHTML !== '') {
          container.innerHTML = '';
          btn.textContent = '▶ PLAY';
          return;
        }

        // Stop/Remove other players
        document.querySelectorAll('.inline-player-container').forEach(el => el.innerHTML = '');
        document.querySelectorAll('.episode-play-btn[data-episode]').forEach(b => b.textContent = '▶ PLAY');

        // Inject Player
        container.innerHTML = `
          <div class="audio-player" style="margin-top: 15px; border: 2px solid var(--accent-green); padding: 10px;">
             <div class="audio-player-header" style="font-size: 0.8rem; margin-bottom: 5px;">▶ NOW PLAYING: Episode ${epNum}</div>
             <audio controls autoplay style="width: 100%; height: 30px;">
               <source src="${audioUrl}" type="${audioType || 'audio/mpeg'}">
             </audio>
          </div>
        `;

        btn.textContent = '⏹ STOP';
      });
    });

    // Click on entire episode item to open details (still keep this for navigation)
    document.querySelectorAll('.episode-list-item').forEach((item) => {
      // ... keep existing navigation logic if desired, or remove if causing conflict
      // For now, let's allow clicking the card to go to the episode page
      // which is handled by the <a> tags in the HTML structure
    });
  }

  /**
   * Show episode in fullscreen modal with player
   */
  function showEpisodeModal(episode) {
    state.currentEpisode = episode;

    // Create modal if not exists
    let modal = document.getElementById('episode-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'episode-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }

    // Populate modal content
    const modalContent = `
      <div class="modal-content">
        <button class="modal-close" onclick="FYF.closeModal()">×</button>
        <div style="max-width: 800px; margin: 0 auto;">
          <div class="episode-cover" style="margin-bottom: 30px;">
            <img src="${episode.coverArt}" alt="EP ${episode.epNum}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23252525%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-family=%22VT323%22 font-size=%2248%22 fill=%22%2339ff14%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EEP ${episode.epNum}%3C/text%3E%3C/svg%3E'">
          </div>
          <h2>${episode.title}</h2>
          <div style="margin: 20px 0;">
            <p class="small-text">EPISODE ${episode.epNum} • ${episode.pubDateFormatted} • ${episode.duration}</p>
          </div>
          ${SpotifyModule.renderAudioPlayer(episode)}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed var(--accent-blue);">
            <h3 style="margin-top: 20px; margin-bottom: 15px;">Show Notes:</h3>
            <div style="color: var(--text-secondary); line-height: 1.8;">
              ${episode.description}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    modal.classList.add('active');

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Inject schema
    const schema = SpotifyModule.buildEpisodeSchema(episode);
    let schemaScript = document.querySelector('script[id="episode-schema"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'episode-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);
  }

  /**
   * Close episode modal
   */
  function closeModal() {
    const modal = document.getElementById('episode-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Render error state if episodes fail to load
   */
  function renderErrorState() {
    const grid = document.getElementById('episodes-grid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <h3 style="color: var(--accent-pink); margin-bottom: 15px;">⚠ Load Error</h3>
          <p>Failed to load episodes. Please refresh the page.</p>
          <button class="btn" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Initialize scroll-based behaviors
   */
  function initScrollBehaviors() {
    // Scroll progress bar
    window.addEventListener('scroll', updateScrollProgress);

    // Header shadow on scroll
    window.addEventListener('scroll', updateHeaderOnScroll);
  }

  /**
   * Update scroll progress bar width
   */
  function updateScrollProgress() {
    if (!window.DOM.scrollProgress) return;

    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    window.DOM.scrollProgress.style.width = scrolled + '%';
  }

  /**
   * Update header appearance on scroll
   */
  function updateHeaderOnScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    if (window.scrollY > 50) {
      header.style.boxShadow = '8px 8px 0px rgba(0, 0, 0, 0.9)';
    } else {
      header.style.boxShadow = 'var(--shadow-heavy)';
    }
  }

  /**
   * Setup intersection observer for fade-in animations
   */
  function initIntersectionObserver() {
    const options = {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    };

    window.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    // Observe all reveal elements
    document.querySelectorAll('.reveal').forEach((el) => {
      window.observer.observe(el);
    });
  }

  /**
   * Setup all event listeners
   */
  function setupEventListeners() {
    // Mobile menu toggle
    if (window.DOM.hamburger) {
      window.DOM.hamburger.addEventListener('click', toggleMobileNav);
    }

    // Close mobile nav on link click
    if (window.DOM.nav) {
      window.DOM.nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          closeMobileNav();
        });
      });
    }

    // Close mobile nav on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileNav();
      }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          closeMobileNav();
        }
      });
    });
  }

  /**
   * Toggle mobile navigation
   */
  function toggleMobileNav() {
    if (!window.DOM.hamburger || !window.DOM.nav) return;

    state.isNavOpen = !state.isNavOpen;
    window.DOM.hamburger.classList.toggle('active');
    window.DOM.nav.classList.toggle('active');
  }

  /**
   * Close mobile navigation
   */
  function closeMobileNav() {
    if (!window.DOM.hamburger || !window.DOM.nav) return;

    state.isNavOpen = false;
    window.DOM.hamburger.classList.remove('active');
    window.DOM.nav.classList.remove('active');
  }

  /**
   * Hide loading screen
   */
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.pointerEvents = 'none';
        loadingScreen.style.transition = 'opacity 0.6s ease-out';
      }, 500);
    }
  }

  // Public API
  return {
    init,
    closeModal,
    getState: () => state,
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FYF.init());
} else {
  FYF.init();
}
