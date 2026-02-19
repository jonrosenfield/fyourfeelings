/**
 * player.js — Custom Retro Audio Player Logic
 */
const FyfPlayer = (() => {
    let currentAudio = null;
    let currentBtn = null;

    function init() {
        document.querySelectorAll('.custom-player').forEach(player => {
            if (player.dataset.init === 'true') return;
            setupPlayer(player);
            player.dataset.init = 'true';
        });
    }

    function setupPlayer(container) {
        const audio = container.querySelector('audio');
        const playBtn = container.querySelector('.play-btn');
        const progressBar = container.querySelector('.player-progress-bar');
        const progressContainer = container.querySelector('.player-progress-container');
        const timeDisplay = container.querySelector('.player-time');

        if (!audio || !playBtn) return;

        // Play/Pause Toggle
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay(audio, playBtn);
        });

        // Valid events
        audio.addEventListener('play', () => updatePlayState(playBtn, true));
        audio.addEventListener('pause', () => updatePlayState(playBtn, false));
        audio.addEventListener('ended', () => {
            updatePlayState(playBtn, false);
            progressBar.style.width = '0%';
            currentAudio = null;
        });

        // Time Update
        audio.addEventListener('timeupdate', () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${percent}%`;
            timeDisplay.textContent = formatTime(audio.currentTime);
        });

        // Seek
        progressContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percent = clickX / width;
            if (isFinite(audio.duration)) {
                audio.currentTime = percent * audio.duration;
            }
        });

        // Set initial time
        audio.addEventListener('loadedmetadata', () => {
            timeDisplay.textContent = formatTime(0);
        });
    }

    function togglePlay(audio, btn) {
        if (audio.paused) {
            // Pause currently playing if different
            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
            }
            currentAudio = audio;
            currentBtn = btn;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => console.error('Playback failed:', err));
            }
        } else {
            audio.pause();
        }
    }

    function updatePlayState(btn, isPlaying) {
        if (isPlaying) {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>`; // Pause Icon
            btn.classList.add('playing');

            // Also update the card artwork overlay if exists
            const card = btn.closest('.episode-card');
            if (card) card.classList.add('is-playing');
        } else {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`; // Play Icon
            btn.classList.remove('playing');

            const card = btn.closest('.episode-card');
            if (card) card.classList.remove('is-playing');
        }
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return { init };
})();

// Auto-init availability
window.FyfPlayer = FyfPlayer;
