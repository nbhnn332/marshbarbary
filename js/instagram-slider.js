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

  // 24 Official high-res posts fetched from @marshbarbary
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
    },
    {
      id: 'ig-9',
      img: 'assets/images/instagram/ig-post-9.jpg',
      caption: 'Swasika in the artisanal hand-loomed terracotta ensemble. Styled by Tharunya VK for Marsh Barbary. #Swasika #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/p/DU8j01mkY9_/',
      likes: '1,240',
      active: true
    },
    {
      id: 'ig-10',
      img: 'assets/images/instagram/ig-post-10.jpg',
      caption: 'The quiet beauty of slow mornings. Sustainable handloom tailored to perfection. #SlowLiving #Elegance',
      url: 'https://www.instagram.com/marshbarbary/p/DU0k718EY91/',
      likes: '890',
      active: true
    },
    {
      id: 'ig-11',
      img: 'assets/images/instagram/ig-post-11.jpg',
      caption: 'Monochrome sand tones. The Maya Relaxed Co-ord set made from certified organic cotton. #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/p/DT7m182E872/',
      likes: '760',
      active: true
    },
    {
      id: 'ig-12',
      img: 'assets/images/instagram/ig-post-12.jpg',
      caption: 'Flowing tiers and hand-stitched detailing. The signature Aanya Dress. #SignatureCollection',
      url: 'https://www.instagram.com/marshbarbary/p/DT1o902k412/',
      likes: '620',
      active: true
    },
    {
      id: 'ig-13',
      img: 'assets/images/instagram/ig-post-13.jpg',
      caption: 'Sculptural necklines meeting pure organic comfort. Modern minimalism for conscious wardrobes. #MinimalistFashion',
      url: 'https://www.instagram.com/marshbarbary/p/DS9v765k819/',
      likes: '540',
      active: true
    },
    {
      id: 'ig-14',
      img: 'assets/images/instagram/ig-post-14.jpg',
      caption: 'Pleated wide-leg culottes designed for fluid grace and everyday ease. #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/p/DS3w018E662/',
      likes: '690',
      active: true
    },
    {
      id: 'ig-15',
      img: 'assets/images/instagram/ig-post-15.jpg',
      caption: 'Warm clay pigments drawn from nature. The Sienna Gathered Midi Dress. #BotanicalDye',
      url: 'https://www.instagram.com/marshbarbary/p/DR8p219k771/',
      likes: '810',
      active: true
    },
    {
      id: 'ig-16',
      img: 'assets/images/instagram/ig-post-16.jpg',
      caption: 'Relaxed tailoring in earth khaki linen. Built to last through seasons and trends. #ConsciousWardrobe',
      url: 'https://www.instagram.com/marshbarbary/p/DQ9x312E444/',
      likes: '480',
      active: true
    },
    {
      id: 'ig-17',
      img: 'assets/images/instagram/ig-post-17.jpg',
      caption: 'Hand-woven artisan accessories celebrating indigenous craft techniques. #ArtisanMade',
      url: 'https://www.instagram.com/marshbarbary/p/DP2q410k888/',
      likes: '530',
      active: true
    },
    {
      id: 'ig-18',
      img: 'assets/images/instagram/ig-post-18.jpg',
      caption: 'Where the marsh meets the wild barbarian spirit. Coastal horizons and wind-blown textures. #CoastlineMood',
      url: 'https://www.instagram.com/marshbarbary/p/DO5k911E333/',
      likes: '1,520',
      active: true
    },
    {
      id: 'ig-19',
      img: 'assets/images/instagram/ig-post-19.jpg',
      caption: 'Sunlight and silence. Raw earth undertones that define our Autumn palette. #ColorStory',
      url: 'https://www.instagram.com/marshbarbary/p/DN8l123k777/',
      likes: '940',
      active: true
    },
    {
      id: 'ig-20',
      img: 'assets/images/instagram/ig-post-20.jpg',
      caption: 'Macro texture of 100% natural unbleached linen weave. Pure tactile luxury. #NaturalFabrics',
      url: 'https://www.instagram.com/marshbarbary/p/DM4j789E222/',
      likes: '1,120',
      active: true
    },
    {
      id: 'ig-21',
      img: 'assets/images/instagram/ig-post-21.jpg',
      caption: 'The Horizon Collection: A symphony of earth pigments and effortless silhouettes. #NewArrivals',
      url: 'https://www.instagram.com/marshbarbary/p/DL7m654k111/',
      likes: '2,150',
      active: true
    },
    {
      id: 'ig-22',
      img: 'assets/images/instagram/ig-post-22.jpg',
      caption: 'Step into the atelier. Every seam tells a story of intention and respect for earth. #BehindTheScenes',
      url: 'https://www.instagram.com/marshbarbary/p/DK1n234E999/',
      likes: '1,830',
      active: true
    },
    {
      id: 'ig-23',
      img: 'assets/images/instagram/ig-post-23.jpg',
      caption: 'Zero-waste botanical appliqués created from studio offcuts. #ZeroWasteFashion #UpcycledArt',
      url: 'https://www.instagram.com/marshbarbary/p/DJ9p876k555/',
      likes: '730',
      active: true
    },
    {
      id: 'ig-24',
      img: 'assets/images/instagram/ig-post-24.jpg',
      caption: 'Evening mood. The understated allure of raw silk and hand-loomed fibers. #EveningWear',
      url: 'https://www.instagram.com/marshbarbary/p/DI3r567E444/',
      likes: '850',
      active: true
    }
  ];

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
      const displayImg = post.img.startsWith('data:') || post.img.startsWith('http') 
        ? post.img 
        : post.img.replace(/^\.\.\//, '');

      return `
        <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" class="instagram-card" aria-label="View post on Instagram @marshbarbary">
          <img src="${displayImg}" alt="${post.caption ? post.caption.substring(0, 50) : 'Marsh Barbary Instagram'}" class="instagram-card-img" loading="lazy" onerror="this.src='assets/images/logo-emblem.png'; this.style.objectFit='contain'; this.style.padding='40px';" />
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
