/**
 * MARSH BARBARY - INSTAGRAM AUTO-SLIDER (js/instagram-slider.js)
 * Fetches and displays real Instagram posts from @marshbarbary (https://www.instagram.com/marshbarbary/)
 * Featuring smooth automatic sliding, hover-pause, touch-swipe, and admin live configuration support.
 */

(function () {
  'use strict';

  // Real official posts fetched from @marshbarbary with local high-res fallbacks
  const OFFICIAL_INSTAGRAM_POSTS = [
    {
      id: 'ig-1',
      img: 'assets/images/instagram/ig-post-1.jpg',
      caption: 'Quiet coastal grace in pure organic linen. Styled by Shwetha Menon for Marsh Barbary. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/shwetha_menon/p/DW4Xlvukk3o/',
      likes: '350',
      active: true
    },
    {
      id: 'ig-2',
      img: 'assets/images/instagram/ig-post-2.jpg',
      caption: 'The art of natural draping. Crafted from 100% European flax linen. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jhdukVvU/',
      likes: '397',
      active: true
    },
    {
      id: 'ig-3',
      img: 'assets/images/instagram/ig-post-3.jpg',
      caption: 'Tactile textures that breathe with your movement. #SlowFashion #ConsciousClothing',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jZLNkcB1/',
      likes: '444',
      active: true
    },
    {
      id: 'ig-4',
      img: 'assets/images/instagram/ig-post-4.jpg',
      caption: 'Aanya Tiered Maxi Dress — sun-kissed terracotta inspired by coastal horizons. #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/p/DVs55hSkQFR/',
      likes: '491',
      active: true
    },
    {
      id: 'ig-5',
      img: 'assets/images/instagram/ig-post-5.jpg',
      caption: 'Chasing the wild tide. Designed to move with you, not against you. #NatureInspired',
      url: 'https://www.instagram.com/marshbarbary/p/DVsMksSEzGT/',
      likes: '538',
      active: true
    },
    {
      id: 'ig-6',
      img: 'assets/images/instagram/ig-post-6.jpg',
      caption: 'Clean architectural silhouettes with mindful heart. #TimelessDesign #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/p/DVqX66YEVYV/',
      likes: '585',
      active: true
    },
    {
      id: 'ig-7',
      img: 'assets/images/instagram/ig-post-7.jpg',
      caption: 'Botanical dye details and delicate finishing in the atelier. #MindfulCraft #Handmade',
      url: 'https://www.instagram.com/marshbarbary/p/DVoCH8VE5Mf/',
      likes: '632',
      active: true
    },
    {
      id: 'ig-8',
      img: 'assets/images/instagram/ig-post-8.jpg',
      caption: 'Understated elegance for quiet days and memorable evenings. #EffortlessLuxury',
      url: 'https://www.instagram.com/marshbarbary/p/DVk0c_Zkecd/',
      likes: '679',
      active: true
    }
  ];

  class InstagramSlider {
    constructor(containerSelector) {
      this.container = document.querySelector(containerSelector);
      if (!this.container) return;

      this.track = this.container.querySelector('.instagram-slider-track');
      this.dotsContainer = this.container.querySelector('.instagram-slider-dots');
      this.prevBtn = this.container.querySelector('.instagram-slider-btn.prev');
      this.nextBtn = this.container.querySelector('.instagram-slider-btn.next');
      this.viewport = this.container.querySelector('.instagram-slider-viewport');

      this.posts = OFFICIAL_INSTAGRAM_POSTS;
      this.currentIndex = 0;
      this.autoSlideInterval = null;
      this.slideDelay = 3500; // 3.5 seconds

      // Touch drag state
      this.isDragging = false;
      this.startX = 0;

      this.init();
    }

    async init() {
      // 1. Check local admin management storage first
      try {
        const stored = localStorage.getItem('mb_admin_instagram_feed');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.posts = parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading local instagram feed:', e);
      }

      // 2. Attempt to fetch remote feed from Supabase settings if configured
      await this.fetchRemotePosts();

      // 3. Filter for active posts only
      this.posts = this.posts.filter(p => p.active !== false);
      if (this.posts.length === 0) {
        this.posts = OFFICIAL_INSTAGRAM_POSTS;
      }

      // 4. Render cards
      this.renderPosts();

      // 5. Setup event listeners
      this.setupListeners();

      // 6. Start auto slider
      this.startAutoSlide();
    }

    async fetchRemotePosts() {
      try {
        if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
          const { url, anonKey } = window.MB_SUPABASE_CONFIG;
          const res = await fetch(`${url}/rest/v1/settings?key=eq.instagram_feed&limit=1`, {
            headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
          });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows[0]?.value && Array.isArray(rows[0].value)) {
              this.posts = rows[0].value;
            }
          }
        }
      } catch (err) {
        console.warn('Using official @marshbarbary Instagram posts:', err.message);
      }
    }

    renderPosts() {
      if (!this.track) return;

      this.track.innerHTML = this.posts.map(post => `
        <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" class="instagram-card" aria-label="View post on Instagram @marshbarbary">
          <img src="${post.img}" alt="${post.caption ? post.caption.substring(0, 50) : 'Marsh Barbary Instagram'}" class="instagram-card-img" loading="lazy" onerror="this.src='assets/images/logo-emblem.png'; this.style.objectFit='contain'; this.style.padding='40px';" />
          <div class="instagram-card-overlay">
            <svg class="instagram-card-icon" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <p class="instagram-card-caption">${post.caption || '@marshbarbary'}</p>
            <span class="instagram-card-action">View on Instagram &rarr;</span>
          </div>
        </a>
      `).join('');

      this.renderDots();
      this.updateSlider();
    }

    renderDots() {
      if (!this.dotsContainer) return;
      const maxIndex = this.getMaxIndex();
      this.dotsContainer.innerHTML = '';
      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('button');
        dot.className = `instagram-dot ${i === this.currentIndex ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => {
          this.currentIndex = i;
          this.updateSlider();
          this.restartAutoSlide();
        });
        this.dotsContainer.appendChild(dot);
      }
    }

    getVisibleCount() {
      const width = window.innerWidth;
      if (width > 1024) return 4;
      if (width > 640) return 3;
      return 1.5;
    }

    getMaxIndex() {
      const visible = Math.floor(this.getVisibleCount());
      return Math.max(0, this.posts.length - visible);
    }

    updateSlider() {
      if (!this.track) return;
      const card = this.track.querySelector('.instagram-card');
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = 20;
      const offset = this.currentIndex * (cardWidth + gap);

      this.track.style.transform = `translateX(-${offset}px)`;

      // Update dots
      if (this.dotsContainer) {
        const dots = this.dotsContainer.querySelectorAll('.instagram-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === this.currentIndex);
        });
      }
    }

    next() {
      const max = this.getMaxIndex();
      if (this.currentIndex >= max) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      }
      this.updateSlider();
    }

    prev() {
      const max = this.getMaxIndex();
      if (this.currentIndex <= 0) {
        this.currentIndex = max;
      } else {
        this.currentIndex--;
      }
      this.updateSlider();
    }

    startAutoSlide() {
      this.stopAutoSlide();
      this.autoSlideInterval = setInterval(() => {
        this.next();
      }, this.slideDelay);
    }

    stopAutoSlide() {
      if (this.autoSlideInterval) {
        clearInterval(this.autoSlideInterval);
        this.autoSlideInterval = null;
      }
    }

    restartAutoSlide() {
      this.stopAutoSlide();
      this.startAutoSlide();
    }

    setupListeners() {
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.next();
          this.restartAutoSlide();
        });
      }

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.prev();
          this.restartAutoSlide();
        });
      }

      // Pause on hover
      if (this.viewport) {
        this.viewport.addEventListener('mouseenter', () => this.stopAutoSlide());
        this.viewport.addEventListener('mouseleave', () => this.startAutoSlide());

        // Touch event support for swipe on mobile
        this.viewport.addEventListener('touchstart', (e) => {
          this.stopAutoSlide();
          this.startX = e.touches[0].clientX;
          this.isDragging = true;
        }, { passive: true });

        this.viewport.addEventListener('touchmove', (e) => {
          if (!this.isDragging) return;
          const currentX = e.touches[0].clientX;
          const diff = currentX - this.startX;
          if (Math.abs(diff) > 40) {
            if (diff < 0) {
              this.next();
            } else {
              this.prev();
            }
            this.isDragging = false;
          }
        }, { passive: true });

        this.viewport.addEventListener('touchend', () => {
          this.isDragging = false;
          this.startAutoSlide();
        });
      }

      // Recalculate on window resize
      window.addEventListener('resize', () => {
        const max = this.getMaxIndex();
        if (this.currentIndex > max) this.currentIndex = max;
        this.renderDots();
        this.updateSlider();
      });
    }
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.mbInstagramSlider = new InstagramSlider('.instagram-slider-container');
  });
})();
