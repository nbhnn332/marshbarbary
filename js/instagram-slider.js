/**
 * MARSH BARBARY - INSTAGRAM AUTO-SLIDER (js/instagram-slider.js)
 * Fetches and displays Instagram feed items from @marshbarbary (https://www.instagram.com/marshbarbary/)
 * Featuring smooth automatic sliding, hover-pause, touch-swipe, and dynamic Supabase fallback.
 */

(function () {
  'use strict';

  // Default curated feed items mirroring @marshbarbary
  const DEFAULT_INSTAGRAM_POSTS = [
    {
      id: 'ig-1',
      img: 'assets/images/story-portrait.jpg',
      caption: 'The art of natural draping. Crafted from 100% European flax linen. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '342'
    },
    {
      id: 'ig-2',
      img: 'assets/images/mood-linen.jpg',
      caption: 'Slow tactile textures that breathe with your movement. #SlowFashion #ConsciousClothing',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '419'
    },
    {
      id: 'ig-3',
      img: 'assets/images/prod-aanya.jpg',
      caption: 'Aanya Tiered Maxi Dress — sun-kissed terracotta inspired by coastal horizons. #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '581'
    },
    {
      id: 'ig-4',
      img: 'assets/images/mood-coast.jpg',
      caption: 'Chasing the wild tide. Designed to move with you, not against you. #NatureInspired',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '298'
    },
    {
      id: 'ig-5',
      img: 'assets/images/cat-dresses.jpg',
      caption: 'Clean architectural silhouettes with mindful heart. #TimelessDesign #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '624'
    },
    {
      id: 'ig-6',
      img: 'assets/images/fabric-flowers.jpg',
      caption: 'Botanical dye details and delicate finishing in the atelier. #MindfulCraft #Handmade',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '387'
    },
    {
      id: 'ig-7',
      img: 'assets/images/prod-sienna.jpg',
      caption: 'Understated elegance for quiet days and memorable evenings. #EffortlessLuxury',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '475'
    },
    {
      id: 'ig-8',
      img: 'assets/images/mood-desert.jpg',
      caption: 'Earthy warmth, organic calm. Discover our full story at marshbarbary.com. #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/',
      likes: '512'
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

      this.posts = DEFAULT_INSTAGRAM_POSTS;
      this.currentIndex = 0;
      this.autoSlideInterval = null;
      this.slideDelay = 3500; // 3.5 seconds

      // Touch drag state
      this.isDragging = false;
      this.startX = 0;
      this.currentTranslate = 0;
      this.prevTranslate = 0;

      this.init();
    }

    async init() {
      // 1. Attempt to fetch custom instagram feed from Supabase settings if configured
      await this.fetchRemotePosts();

      // 2. Render cards
      this.renderPosts();

      // 3. Set up event listeners (next, prev, dots, resize, touch)
      this.setupListeners();

      // 4. Start auto slider
      this.startAutoSlide();
    }

    async fetchRemotePosts() {
      try {
        if (window.MB_SUPABASE && typeof window.MB_SUPABASE.fetchSettings === 'function') {
          const settings = await window.MB_SUPABASE.fetchSettings();
          if (settings && Array.isArray(settings.instagram_feed) && settings.instagram_feed.length > 0) {
            this.posts = settings.instagram_feed;
          }
        }
      } catch (err) {
        console.warn('Using curated @marshbarbary Instagram fallback posts:', err.message);
      }
    }

    renderPosts() {
      if (!this.track) return;

      this.track.innerHTML = this.posts.map(post => `
        <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" class="instagram-card" aria-label="View post on Instagram @marshbarbary">
          <img src="${post.img}" alt="${post.caption ? post.caption.substring(0, 50) : 'Marsh Barbary Instagram'}" class="instagram-card-img" loading="lazy" />
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

      // Pause auto slide on hover
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
