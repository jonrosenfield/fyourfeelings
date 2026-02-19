// Mobile menu functionality
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const menuToggle = document.querySelector('.menu-toggle');
    
    mobileNav.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const menuToggle = document.querySelector('.menu-toggle');
    
    mobileNav.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.style.overflow = '';
}

// Scroll progress indicator
function updateScrollProgress() {
    const scrollProgress = document.getElementById('scrollProgress');
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
}

function updateHeaderOnScroll() {
    const header = document.getElementById('header');
    const scrollY = window.scrollY;
    
    header.classList.toggle('scrolled', scrollY > 80);
}

window.addEventListener('scroll', updateHeaderOnScroll);

// Intersection Observer for animations
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
        observer.observe(el);
    });
}

// Smooth scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('header').offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - headerHeight - 15,
                    behavior: 'smooth'
                });
                closeMobileMenu();
            }
        });
    });
}

// Loading animation
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    setTimeout(() => {
        loadingOverlay.classList.add('hidden');
    }, 1200);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initIntersectionObserver();
    initSmoothScrolling();
    hideLoadingOverlay();
    
    let ticking = false;
    function updateOnScroll() {
        updateScrollProgress();
        updateHeaderOnScroll();
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });
    
    document.addEventListener('click', function(event) {
        const mobileNav = document.getElementById('mobileNav');
        const header = document.querySelector('header');
        
        if (!header.contains(event.target) && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
    
    document.querySelectorAll('.btn, .episode-link, .social-link').forEach(element => {
        element.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.click();
            }
        });
    });
});

// Preload fonts
function preloadCriticalResources() {
    const criticalFonts = [
        'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Roboto:wght@400;700&display=swap'
    ];
    
    criticalFonts.forEach(font => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = font;
        link.as = 'style';
        link.onload = function() {
            this.rel = 'stylesheet';
        };
        document.head.appendChild(link);
    });
}

preloadCriticalResources();

// Image error handling
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        this.style.display = 'none';
    });
});

// YouTube Shorts embedding functionality
function initClipEmbeds() {
document.querySelectorAll('.clip-card').forEach(card => {
const videoId = card.getAttribute('data-video-id');
if (!videoId) return;

// Set the thumbnail background image
const placeholder = card.querySelector('.clip-placeholder');
if (placeholder) {
    placeholder.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')`;
    placeholder.setAttribute('data-video-id', videoId);
}

card.addEventListener('click', function() {
    loadYouTubeShort(this, videoId);
});
});
}

function loadYouTubeShort(cardElement, videoId) {
const embedContainer = cardElement.querySelector('.clip-embed-container');
const placeholder = cardElement.querySelector('.clip-placeholder');

// Prevent multiple clicks
if (cardElement.classList.contains('video-loading') || embedContainer.classList.contains('video-loaded')) {
return;
}

// Add loading state
cardElement.classList.add('video-loading');

// Create iframe
const iframe = document.createElement('iframe');
iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0&enablejsapi=1`;
iframe.width = '100%';
iframe.height = '100%';
iframe.frameBorder = '0';
iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
iframe.allowFullscreen = true;
iframe.style.borderRadius = '16px 16px 0 0';
iframe.loading = 'lazy';

// Add loading class for smooth transition
embedContainer.classList.add('loading-video');

// Replace placeholder with iframe
setTimeout(() => {
placeholder.style.opacity = '0';
setTimeout(() => {
    embedContainer.innerHTML = '';
    embedContainer.appendChild(iframe);
    embedContainer.classList.remove('loading-video');
    embedContainer.classList.add('video-loaded');
    cardElement.classList.remove('video-loading');
    
    // Remove click cursor since video is now loaded
    cardElement.style.cursor = 'default';
}, 300);
}, 100);
}

// Alternative function to load video with thumbnail preview
function loadYouTubeShortWithThumbnail(cardElement, videoId) {
const embedContainer = cardElement.querySelector('.clip-embed-container');
const placeholder = cardElement.querySelector('.clip-placeholder');

// Prevent multiple clicks
if (cardElement.classList.contains('video-loading') || embedContainer.classList.contains('video-loaded')) {
return;
}

// Add loading state
cardElement.classList.add('video-loading');

// First, show YouTube thumbnail
const thumbnailImg = document.createElement('img');
thumbnailImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
thumbnailImg.style.width = '100%';
thumbnailImg.style.height = '100%';
thumbnailImg.style.objectFit = 'cover';
thumbnailImg.style.borderRadius = '16px 16px 0 0';

// On thumbnail click, load the actual video
thumbnailImg.addEventListener('click', function() {
loadActualVideo(embedContainer, videoId, cardElement);
});

// Add play button overlay on thumbnail
const playOverlay = document.createElement('div');
playOverlay.innerHTML = `
<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
            background: rgba(200, 16, 46, 0.9); padding: 16px; border-radius: 50%; 
            border: 2px solid white; cursor: pointer;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M8 5v14l11-7z"/>
    </svg>
</div>
`;
playOverlay.style.position = 'absolute';
playOverlay.style.top = '0';
playOverlay.style.left = '0';
playOverlay.style.width = '100%';
playOverlay.style.height = '100%';
playOverlay.style.pointerEvents = 'none';
playOverlay.querySelector('div').style.pointerEvents = 'all';

playOverlay.addEventListener('click', function() {
loadActualVideo(embedContainer, videoId, cardElement);
});

// Replace placeholder with thumbnail
setTimeout(() => {
placeholder.style.opacity = '0';
setTimeout(() => {
    embedContainer.innerHTML = '';
    embedContainer.style.position = 'relative';
    embedContainer.appendChild(thumbnailImg);
    embedContainer.appendChild(playOverlay);
    embedContainer.classList.remove('loading-video');
    cardElement.classList.remove('video-loading');
}, 300);
}, 100);
}

function loadActualVideo(embedContainer, videoId, cardElement) {
// Create iframe
const iframe = document.createElement('iframe');
iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;
iframe.width = '100%';
iframe.height = '100%';
iframe.frameBorder = '0';
iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
iframe.allowFullscreen = true;
iframe.style.borderRadius = '16px 16px 0 0';

// Replace thumbnail with video
embedContainer.innerHTML = '';
embedContainer.appendChild(iframe);
embedContainer.classList.add('video-loaded');
cardElement.style.cursor = 'default';
}

// Utility function to extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url) {
const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
const match = url.match(regex);
return match ? match[1] : null;
}

// Function to update video ID dynamically
function updateClipVideo(cardElement, newVideoId, newTitle, newDuration) {
// Update the data attribute
cardElement.setAttribute('data-video-id', newVideoId);

// Update thumbnail
const placeholder = cardElement.querySelector('.clip-placeholder');
if (placeholder) {
placeholder.style.backgroundImage = `url('https://img.youtube.com/vi/${newVideoId}/maxresdefault.jpg')`;
placeholder.setAttribute('data-video-id', newVideoId);
}

// Update title and duration if provided
if (newTitle) {
const titleElement = cardElement.querySelector('.clip-title');
if (titleElement) titleElement.textContent = newTitle;
}

if (newDuration) {
const durationElement = cardElement.querySelector('.clip-duration');
if (durationElement) durationElement.textContent = newDuration;
}

// Reset the card to placeholder state
resetClipCard(cardElement);
}

// Function to reset a clip card to its original placeholder state
function resetClipCard(cardElement) {
const embedContainer = cardElement.querySelector('.clip-embed-container');
const originalPlaceholder = `
<div class="clip-placeholder">
    <div class="clip-play-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>
    </div>
    <div class="clip-duration">${cardElement.querySelector('.clip-duration')?.textContent || '0:00'}</div>
</div>
`;

embedContainer.innerHTML = originalPlaceholder;
embedContainer.classList.remove('video-loaded', 'loading-video');
cardElement.classList.remove('video-loading');
cardElement.style.cursor = 'pointer';
}

// Function to preload video thumbnails for better UX
function preloadVideoThumbnails() {
document.querySelectorAll('.clip-card').forEach(card => {
const videoId = card.getAttribute('data-video-id');
if (videoId) {
    const img = new Image();
    img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
});
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
initClipEmbeds();
// Uncomment the next line if you want to preload thumbnails
// preloadVideoThumbnails();
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
module.exports = {
initClipEmbeds,
loadYouTubeShort,
loadYouTubeShortWithThumbnail,
extractYouTubeVideoId,
updateClipVideo,
resetClipCard,
preloadVideoThumbnails
};
}

// Focus management for accessibility
function manageFocus() {
    document.addEventListener('focusin', function(event) {
        const mobileNav = document.getElementById('mobileNav');
        if (event.target.closest('.mobile-nav') || !mobileNav.classList.contains('active')) {
            return;
        }
        const firstFocusableElement = mobileNav.querySelector('a');
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
    });
}

let isRecording = false;
let mediaRecorder;
let recordedChunks = [];

function startRecording() {
    const button = event.target;
    
    if (!isRecording) {
        // Start recording
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    mediaRecorder = new MediaRecorder(stream);
                    recordedChunks = [];
                    
                    mediaRecorder.ondataavailable = function(event) {
                        if (event.data.size > 0) {
                            recordedChunks.push(event.data);
                        }
                    };
                    
                    mediaRecorder.onstop = function() {
                        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                        const url = URL.createObjectURL(blob);
                        
                        // Create download link
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'voice-note-for-fyf.webm';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        // Show success message
                        button.innerHTML = '✅ Recording Saved!';
                        button.style.background = 'linear-gradient(135deg, #2e7d32, #1b5e20)';
                        
                        setTimeout(() => {
                            button.innerHTML = '🎙️ Start Recording';
                            button.style.background = 'linear-gradient(135deg, var(--red-primary), var(--red-dark))';
                        }, 3000);
                        
                        // Stop all tracks
                        stream.getTracks().forEach(track => track.stop());
                    };
                    
                    mediaRecorder.start();
                    isRecording = true;
                    
                    button.innerHTML = 'Stop Recording';
                    button.classList.add('recording');
                    button.style.background = 'linear-gradient(135deg, #ff5722, #d84315)';
                    
                })
                .catch(function(error) {
                    console.error('Error accessing microphone:', error);
                    alert('Could not access microphone. Please check your browser permissions.');
                });
        } else {
            alert('Recording not supported in this browser. Try Chrome or Firefox!');
        }
    } else {
        // Stop recording
        mediaRecorder.stop();
        isRecording = false;
        button.classList.remove('recording');
    }
}
// Enhanced dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.querySelector('.nav-dropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // Add click functionality for mobile/touch devices
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Keyboard navigation
    dropdownToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dropdown.classList.toggle('active');
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const firstItem = dropdownMenu.querySelector('.dropdown-item');
            if (firstItem) firstItem.focus();
        }
    });
    
    // Arrow key navigation within dropdown
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach((item, index) => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextItem = dropdownItems[index + 1] || dropdownItems[0];
                nextItem.focus();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevItem = dropdownItems[index - 1] || dropdownItems[dropdownItems.length - 1];
                prevItem.focus();
            }
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
                dropdownToggle.focus();
            }
        });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const toggleIcon = themeToggle.querySelector('.toggle-icon');
    const toggleText = themeToggle.querySelector('.toggle-text');
    
    // Check for saved theme preference or default to 'dark'
    const currentTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);
    updateThemeToggle(currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    });
    
    function updateThemeToggle(theme) {
        if (theme === 'dark') {
            toggleIcon.textContent = '🌙';
            toggleText.textContent = 'Dark';
        } else {
            toggleIcon.textContent = '☀️';
            toggleText.textContent = 'Light';
        }
    }
    
    // Mobile menu functionality
    function toggleMobileMenu() {
        const mobileNav = document.getElementById('mobileNav');
        const menuToggle = document.querySelector('.menu-toggle');
        
        mobileNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        const mobileNav = document.getElementById('mobileNav');
        const menuToggle = document.querySelector('.menu-toggle');
        
        mobileNav.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Scroll progress indicator
    function updateScrollProgress() {
        const scrollProgress = document.getElementById('scrollProgress');
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    }

    // Header scroll effect
    function updateHeaderOnScroll() {
        const header = document.getElementById('header');
        const scrollY = window.scrollY;
        
        header.classList.toggle('scrolled', scrollY > 80);
    }

    // Intersection Observer for animations
    function initIntersectionObserver() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in, .slide-up').forEach(el => {
            observer.observe(el);
        });
    }

    // Smooth scrolling
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const headerHeight = document.querySelector('header').offsetHeight;
                    window.scrollTo({
                        top: target.offsetTop - headerHeight - 15,
                        behavior: 'smooth'
                    });
                    closeMobileMenu();
                }
            });
        });
    }

    // Loading animation
    function hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 1200);
    }

    // Initialize all functions
    initIntersectionObserver();
    initSmoothScrolling();
    hideLoadingOverlay();
    
    // Add mobile menu toggle to hamburger button
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Event listeners for scroll effects
    let ticking = false;
    function updateOnScroll() {
        updateScrollProgress();
        updateHeaderOnScroll();
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const mobileNav = document.getElementById('mobileNav');
        const header = document.querySelector('header');
        
        if (!header.contains(event.target) && mobileNav.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // ESC key closes mobile menu
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });
    
    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
});

// Function to update theme and checkbox state
function updateTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update checkbox states
    const checkboxes = document.querySelectorAll('#theme-switch, #mobile-theme-switch');
    checkboxes.forEach(checkbox => {
        checkbox.checked = newTheme === 'light';
    });
    
    // Dispatch custom event for logo update
    const themeChangeEvent = new Event('themeChange');
    document.dispatchEvent(themeChangeEvent);
}

// Function to toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
}

// Function to update logo images based on theme
function updateLogos() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.logo img').forEach(img => {
        const src = theme === 'light' ? img.dataset.lightSrc : img.getAttribute('src');
        if (src) {
            img.src = src;
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    updateTheme(savedTheme);
    
    // Add event listeners to checkboxes
    const checkboxes = document.querySelectorAll('#theme-switch, #mobile-theme-switch');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const newTheme = checkbox.checked ? 'light' : 'dark';
            updateTheme(newTheme);
        });
    });
});

// Listen for theme changes
document.addEventListener('themeChange', updateLogos);

manageFocus();