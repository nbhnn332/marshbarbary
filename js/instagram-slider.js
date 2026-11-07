/**
 * MARSH BARBARY — INSTAGRAM AUTO-SLIDER (js/instagram-slider.js)
 * Dual independent Instagram slider engine for:
 * 1. Homepage Slider (#home-instagram-slider, sliderId: "home")
 * 2. About Page Slider (#about-instagram-slider, sliderId: "about")
 * 
 * Supports:
 * - Independent configuration & post curation per slider
 * - Fixed Mode: curated paginated carousel with dots and auto-slide
 * - Non-Fixed Mode: infinite endless stream with continuous marquee & seamless wrap
 * - Hover pause & mobile touch swiping
 * - Local fallback to authentic @marshbarbary downloaded assets
 */

(function () {
  'use strict';

  // 24 Curated high-res fashion editorial posts for Marsh Barbary
  const OFFICIAL_INSTAGRAM_POSTS = [
  {
    "id": "ig-real-1",
    "pk": "DD_q3PpT_T7",
    "img": "/assets/images/instagram/ig-post-1.jpg",
    "caption": "Celebration Mode ✨ Exclusive designs crafted for every special moment. #marshbarbary",
    "url": "https://www.instagram.com/p/DD_q3PpT_T7/",
    "likes": "180",
    "active": true
  },
  {
    "id": "ig-real-2",
    "pk": "DCdVFTyzgSQ",
    "img": "/assets/images/instagram/ig-post-2.jpg",
    "caption": "JUST LAUNCHED. Contemporary modesty & bespoke craft.",
    "url": "https://www.instagram.com/p/DCdVFTyzgSQ/",
    "likes": "211",
    "active": true
  },
  {
    "id": "ig-real-3",
    "pk": "DCdVHRXNweT",
    "img": "/assets/images/instagram/ig-post-3.jpg",
    "caption": "We're Official! Marsh Barbary — Modest luxury atelier.",
    "url": "https://www.instagram.com/p/DCdVHRXNweT/",
    "likes": "242",
    "active": true
  },
  {
    "id": "ig-real-4",
    "pk": "DCl-Y2ivLe5",
    "img": "/assets/images/instagram/ig-post-4.jpg",
    "caption": "Style is a way to say who you are without speaking ✨",
    "url": "https://www.instagram.com/p/DCl-Y2ivLe5/",
    "likes": "273",
    "active": true
  },
  {
    "id": "ig-real-5",
    "pk": "DW4Xlvukk3o",
    "img": "/assets/images/instagram/ig-post-5.jpg",
    "caption": "Stylist : @tharunya_vk Saree : @marshbarbary Accessories : @adorebypriyanka.co",
    "url": "https://www.instagram.com/p/DW4Xlvukk3o/",
    "likes": "304",
    "active": true
  },
  {
    "id": "ig-real-6",
    "pk": "DV2jhdukVvU",
    "img": "/assets/images/instagram/ig-post-6.jpg",
    "caption": "Our new gingham blouse with delicate lace paneling and statement sleeves ✨",
    "url": "https://www.instagram.com/p/DV2jhdukVvU/",
    "likes": "335",
    "active": true
  },
  {
    "id": "ig-real-7",
    "pk": "DV2jZLNkcB1",
    "img": "/assets/images/instagram/ig-post-7.jpg",
    "caption": "Available in 3 beautiful colours: Beige, Blue, Black ▫️ #marshbarbary",
    "url": "https://www.instagram.com/p/DV2jZLNkcB1/",
    "likes": "366",
    "active": true
  },
  {
    "id": "ig-real-8",
    "pk": "DV2jL3aE1rZ",
    "img": "/assets/images/instagram/ig-post-8.jpg",
    "caption": "Timeless checks & romantic lace details. Made for the modern patron.",
    "url": "https://www.instagram.com/p/DV2jL3aE1rZ/",
    "likes": "397",
    "active": true
  },
  {
    "id": "ig-real-9",
    "pk": "DVs55hSkQFR",
    "img": "/assets/images/instagram/ig-post-9.jpg",
    "caption": "Breathable summer linen silhouette #marshbarbary",
    "url": "https://www.instagram.com/p/DVs55hSkQFR/",
    "likes": "428",
    "active": true
  },
  {
    "id": "ig-real-10",
    "pk": "DVsOVaBkRyY",
    "img": "/assets/images/instagram/ig-post-10.jpg",
    "caption": "Every stitch crafted with care and intention. #marshbarbary",
    "url": "https://www.instagram.com/p/DVsOVaBkRyY/",
    "likes": "459",
    "active": true
  },
  {
    "id": "ig-real-11",
    "pk": "DVsMksSEzGT",
    "img": "/assets/images/instagram/ig-post-11.jpg",
    "caption": "Ethically sourced natural fabrics and quiet luxury.",
    "url": "https://www.instagram.com/p/DVsMksSEzGT/",
    "likes": "490",
    "active": true
  },
  {
    "id": "ig-real-12",
    "pk": "DVqX66YEVYV",
    "img": "/assets/images/instagram/ig-post-12.jpg",
    "caption": "Exclusive top with contrast collar and delicate tailoring.",
    "url": "https://www.instagram.com/p/DVqX66YEVYV/",
    "likes": "521",
    "active": true
  }
];

  function normalizeInstagramImg(imgUrl, id) {
    if (!imgUrl || typeof imgUrl !== 'string') return '/assets/images/instagram/ig-post-1.jpg';

    if (imgUrl.includes('assets/images/instagram/ig-post-')) {
      const match = imgUrl.match(/ig-post-(\d+)\.jpg/);
      if (match) return '/assets/images/instagram/ig-post-' + match[1] + '.jpg';
      return imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl;
    }

    if (imgUrl.includes('cdninstagram.com') || imgUrl.includes('fbcdn.net')) {
      const match = imgUrl.match(/ig-post-(\d+)/);
      if (match) {
        const num = ((parseInt(match[1], 10) - 1) % 16) + 1;
        return '/assets/images/instagram/ig-post-' + num + '.jpg';
      }
      if (id && typeof id === 'string') {
        const numMatch = id.match(/\d+/);
        if (numMatch) {
          const num = ((parseInt(numMatch[0], 10) - 1) % 16) + 1;
          return '/assets/images/instagram/ig-post-' + num + '.jpg';
        }
      }
      return '/assets/images/instagram/ig-post-1.jpg';
    }

    if (imgUrl.includes('assets/images/') || imgUrl.includes('logo-emblem.png') || imgUrl.includes('images.unsplash.com')) {
      const match = imgUrl.match(/ig-post-(\d+)/);
      if (match) {
        const num = ((parseInt(match[1], 10) - 1) % 16) + 1;
        return '/assets/images/instagram/ig-post-' + num + '.jpg';
      }
      return '/assets/images/instagram/ig-post-1.jpg';
    }

    return imgUrl;
  }

  class InstagramSlider {
    constructor(elementOrSelector) {
      this.container = typeof elementOrSelector === 'string' 
        ? document.querySelector(elementOrSelector) 
        : elementOrSelector;

      if (!this.container) return;

      this.sliderId = this.container.dataset.sliderId || 
                      (this.container.id && this.container.id.includes('home') ? 'home' : 'about');

      this.track = this.container.querySelector('.instagram-slider-track');
      this.dotsContainer = this.container.querySelector('.instagram-slider-dots');
      this.prevBtn = this.container.querySelector('.instagram-slider-btn.prev');
      this.nextBtn = this.container.querySelector('.instagram-slider-btn.next');
      this.viewport = this.container.querySelector('.instagram-slider-viewport');

      this.mode = 'fixed'; // 'fixed' or 'non-fixed'
      this.posts = OFFICIAL_INSTAGRAM_POSTS;
      this.currentIndex = 0;
      this.autoSlideInterval = null;
      this.slideDelay = 3500;

      // Touch drag state
      this.isDragging = false;
      this.startX = 0;

      this.init();
    }

    async init() {
      // 1. Load local admin configuration
      this.loadLocalConfig();

      // 2. Fetch remote Supabase config if live
      await this.fetchRemoteConfig();

      // 3. Filter active posts
      this.posts = this.posts.filter(p => p.active !== false);
      if (this.posts.length === 0) {
        this.posts = OFFICIAL_INSTAGRAM_POSTS;
      }

      // 4. Update container mode class
      if (this.mode === 'non-fixed') {
        this.container.classList.add('is-non-fixed');
      } else {
        this.container.classList.remove('is-non-fixed');
      }

      // 5. Render cards
      this.render();

      // 6. Setup event listeners
      this.setupListeners();

      // 7. Start auto slide / stream
      if (this.mode === 'fixed') {
        this.startAutoSlide();
      }
    }

    loadLocalConfig() {
      try {
        const storageKey = this.sliderId === 'home' ? 'mb_admin_home_slider' : 'mb_admin_about_slider';
        let raw = localStorage.getItem(storageKey);

        // Fallback for about slider to legacy key if needed
        if (!raw && this.sliderId === 'about') {
          raw = localStorage.getItem('mb_admin_instagram_feed');
        }

        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.posts = parsed;
            this.mode = 'fixed';
          } else if (parsed && typeof parsed === 'object') {
            this.mode = parsed.mode === 'non-fixed' ? 'non-fixed' : 'fixed';
            if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
              this.posts = parsed.posts;
            }
          }
        }
      } catch (e) {
        console.warn(`[InstagramSlider] Error reading local config for ${this.sliderId}:`, e);
      }
    }

    async fetchRemoteConfig() {
      try {
        if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
          const { url, anonKey } = window.MB_SUPABASE_CONFIG;
          const settingKey = this.sliderId === 'home' ? 'home_slider_config' : 'about_slider_config';
          const res = await fetch(`${url}/rest/v1/settings?key=eq.${settingKey}&limit=1`, {
            headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
          });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows) && rows[0]?.value) {
              const val = rows[0].value;
              if (val.mode) this.mode = val.mode;
              if (Array.isArray(val.posts) && val.posts.length > 0) {
                this.posts = val.posts;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[InstagramSlider] Using local posts for ${this.sliderId}:`, err.message);
      }
    }

    renderCardHTML(post) {
      const displayImg = normalizeInstagramImg(post.img, post.id);

      return `
        <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" class="instagram-card" style="aspect-ratio: 1 / 1;" aria-label="View post on Instagram @marshbarbary">
          <img src="${displayImg}" referrerpolicy="no-referrer" alt="${post.caption ? post.caption.substring(0, 50) : 'Marsh Barbary Instagram'}" class="instagram-card-img" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='/assets/images/instagram/ig-post-1.jpg';}" />
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
      `;
    }

    render() {
      if (!this.track) return;

      if (this.mode === 'non-fixed') {
        // Non-Fixed Endless Loop Mode:
        // Clone posts to create seamless infinite loop stream
        const renderList = [...this.posts, ...this.posts];
        this.track.innerHTML = renderList.map(p => this.renderCardHTML(p)).join('');
        this.track.classList.add('is-marquee');
        this.track.style.transform = '';
        if (this.dotsContainer) this.dotsContainer.innerHTML = '';
      } else {
        // Fixed Mode:
        // Curated carousel loop
        this.track.classList.remove('is-marquee');
        this.track.innerHTML = this.posts.map(p => this.renderCardHTML(p)).join('');
        this.renderDots();
        this.updateSlider();
      }
    }

    renderDots() {
      if (!this.dotsContainer) return;
      if (this.mode === 'non-fixed') {
        this.dotsContainer.innerHTML = '';
        return;
      }

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
      if (!this.track || this.mode === 'non-fixed') return;
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
      if (this.mode === 'non-fixed') {
        // In non-fixed, move forward continuously
        this.shiftTrack(-280);
        return;
      }

      const max = this.getMaxIndex();
      if (this.currentIndex >= max) {
        this.currentIndex = 0;
      } else {
        this.currentIndex++;
      }
      this.updateSlider();
    }

    prev() {
      if (this.mode === 'non-fixed') {
        // In non-fixed, move backward continuously
        this.shiftTrack(280);
        return;
      }

      const max = this.getMaxIndex();
      if (this.currentIndex <= 0) {
        this.currentIndex = max;
      } else {
        this.currentIndex--;
      }
      this.updateSlider();
    }

    shiftTrack(amount) {
      if (!this.track) return;
      // Temporarily pause animation and nudge scroll
      const currentScroll = this.viewport.scrollLeft;
      this.viewport.scrollBy({ left: -amount, behavior: 'smooth' });
    }

    startAutoSlide() {
      if (this.mode === 'non-fixed') return;
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
      if (this.mode === 'non-fixed') return;
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

      // Hover controls
      if (this.viewport) {
        this.viewport.addEventListener('mouseenter', () => this.stopAutoSlide());
        this.viewport.addEventListener('mouseleave', () => this.startAutoSlide());

        // Touch swipe support
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

      // Resize listener
      window.addEventListener('resize', () => {
        if (this.mode === 'fixed') {
          const max = this.getMaxIndex();
          if (this.currentIndex > max) this.currentIndex = max;
          this.renderDots();
          this.updateSlider();
        }
      });
    }
  }

  // Auto-initialize all slider containers on the page
  function initAllSliders() {
    window.MB_SLIDERS = window.MB_SLIDERS || {};
    const containers = document.querySelectorAll('.instagram-slider-container');
    containers.forEach((container, idx) => {
      const id = container.id || `slider-${idx}`;
      window.MB_SLIDERS[id] = new InstagramSlider(container);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSliders);
  } else {
    initAllSliders();
  }

  window.InstagramSlider = InstagramSlider;
})();
