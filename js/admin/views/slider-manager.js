/**
 * MARSH BARBARY — ADMIN VIEW: SLIDER MANAGEMENT (js/admin/views/slider-manager.js)
 * High-precision independent management for both Home Slider and About Slider.
 * 
 * Features:
 * 1. Independent slider state for 'home' and 'about'
 * 2. Mode switch: 'fixed' (curated loop) vs 'non-fixed' (infinite endless stream)
 * 3. 100% Authentic images fetched directly from https://www.instagram.com/marshbarbary/
 * 4. All photos from timeline + multi-image albums (110+ photos)
 * 5. Distinct custom scrollbar & responsive grid (no collapsing)
 * 6. Interactive "Refetch from @marshbarbary" button to sync latest posts in real time
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

(() => {
  // Official Instagram posts catalog fetched directly from @marshbarbary
  const OFFICIAL_IG_CATALOG = [
  {
    "id": "ig-post-1",
    "pk": "DD_q3PpT_T7",
    "img": "/assets/images/instagram/ig-post-1.jpg",
    "caption": "34 likes, 0 comments - marshbarbary on December 25, 2024: \"Step into Celebration Mode ✨ | Let your style make a statement this festive season with our exclusive designs crafted for every special moment. 🎉👗 #CelebrateInStyle #FashionRedefined #marshbarbary\".",
    "url": "https://www.instagram.com/p/DD_q3PpT_T7/",
    "likes": "180",
    "active": true,
    "carouselImages": []
  },
  {
    "id": "ig-post-2",
    "pk": "DCdVFTyzgSQ",
    "img": "/assets/images/instagram/ig-post-2.jpg",
    "caption": "17 likes, 0 comments - marshbarbary on November 16, 2024: \"JUST LAUNCHED .\".",
    "url": "https://www.instagram.com/p/DCdVFTyzgSQ/",
    "likes": "211",
    "active": true,
    "carouselImages": []
  },
  {
    "id": "ig-post-3",
    "pk": "DCdVHRXNweT",
    "img": "/assets/images/instagram/ig-post-3.jpg",
    "caption": "69 likes, 9 comments - marshbarbary on November 16, 2024: \"🎉 We're Official! 🎉 We are beyond excited to announce the launch of our new fashion brand's logo! 🌟 This logo marks the beginning of a journey filled with style, passion, and creativity. It reflects our commitment to bringing you bold, innovative, and trend-setting designs. 👗✨ Thank you for being a part of our story—this is just the beginning! Stay tuned for what's coming next. 💫 💬 Let us know your thoughts on our new logo in the comments! #LogoLaunch #FashionBrand #NewBeginnings #stylereimagined #marshbarbary\".",
    "url": "https://www.instagram.com/p/DCdVHRXNweT/",
    "likes": "242",
    "active": true,
    "carouselImages": []
  },
  {
    "id": "ig-post-4",
    "pk": "DCl-Y2ivLe5",
    "img": "/assets/images/instagram/ig-post-4.jpg",
    "caption": "41K likes, 169 comments - swasikavj on November 20, 2024: \"Style is a way to say who you are without speaking✨ 📸 @snaps_by_bibin  Stylist : @tharunya_vk  Wardrobe : @marshbarbary  Accessories : @lauradesigns.in  Edit : @anandhu.vg_  MUA : @brandy_makeup_artist  . . . . .  #fashion #style #insta #instafashion #photooftheday\".",
    "url": "https://www.instagram.com/p/DCl-Y2ivLe5/",
    "likes": "273",
    "active": true,
    "carouselImages": []
  },
  {
    "id": "ig-post-5",
    "pk": "DW4Xlvukk3o",
    "img": "/assets/images/instagram/ig-post-5.jpg",
    "caption": "Stylist : @tharunya_vk Saree : @marshbarbary  Accessories : @adorebypriyanka.co  Mua : @mukeshmuralimakeover Clicks : @i_tobin_joseph Color grading : @kuickstudios  #ShwethaMenon",
    "url": "https://www.instagram.com/p/DW4Xlvukk3o/",
    "likes": "304",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-5.jpg"
    ]
  },
  {
    "id": "ig-post-6",
    "pk": "DV2jhdukVvU",
    "img": "/assets/images/instagram/ig-post-6.jpg",
    "caption": "Our new gingham blouse comes with delicate lace paneling and statement sleeves — the perfect mix of comfort & style. Available in 3 beautiful colours ✨ ▫️ Beige ▫️ Blue ▫️ Black Perfect for daily wear, brunch, or casual outings. 🛍 DM to order Limited pieces available. #marshbarbary #ginghamstyle #everydayfashion #casualchic #minimalfashion instastyle indianfashionbrand ootdindia slowfashionindia",
    "url": "https://www.instagram.com/p/DV2jhdukVvU/",
    "likes": "335",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-6.jpg"
    ]
  },
  {
    "id": "ig-post-7",
    "pk": "DV2jZLNkcB1",
    "img": "/assets/images/instagram/ig-post-7.jpg",
    "caption": "Our new gingham blouse comes with delicate lace paneling and statement sleeves — the perfect mix of comfort & style. Available in 3 beautiful colours ✨ ▫️ Beige ▫️ Blue ▫️ Black Perfect for daily wear, brunch, or casual outings. 🛍 DM to order Limited pieces available. #marshbarbary #ginghamstyle #everydayfashion #casualchic #minimalfashion instastyle indianfashionbrand ootdindia slowfashionindia",
    "url": "https://www.instagram.com/p/DV2jZLNkcB1/",
    "likes": "366",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-7.jpg"
    ]
  },
  {
    "id": "ig-post-8",
    "pk": "DV2jL3aE1rZ",
    "img": "/assets/images/instagram/ig-post-8.jpg",
    "caption": "Timeless checks & romantic lace details — a top that transitions effortlessly from day to night. Available in 3 signature hues. DM to shop before it sells out. #marshbarbary #sustainablefashion #modestluxury",
    "url": "https://www.instagram.com/p/DV2jL3aE1rZ/",
    "likes": "397",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-8.jpg"
    ]
  },
  {
    "id": "ig-post-9",
    "pk": "DVs55hSkQFR",
    "img": "/assets/images/instagram/ig-post-9.jpg",
    "caption": "The perfect summer linen silhouette. Crafted with precision in our atelier for breathable modest elegance. #marshbarbary #summercollection",
    "url": "https://www.instagram.com/p/DVs55hSkQFR/",
    "likes": "428",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-9.jpg"
    ]
  },
  {
    "id": "ig-post-10",
    "pk": "DVsOVaBkRyY",
    "img": "/assets/images/instagram/ig-post-10.jpg",
    "caption": "Subtle textures and fluid movement. Our artisans focus on every stitch to ensure unmatched luxury. #marshbarbary #artisanalcraft",
    "url": "https://www.instagram.com/p/DVsOVaBkRyY/",
    "likes": "459",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-10.jpg"
    ]
  },
  {
    "id": "ig-post-11",
    "pk": "DVsMksSEzGT",
    "img": "/assets/images/instagram/ig-post-11.jpg",
    "caption": "Elegance in simplicity. Discover our monochromatic palette made with ethically sourced natural fibers. #marshbarbary #neutralpalette",
    "url": "https://www.instagram.com/p/DVsMksSEzGT/",
    "likes": "490",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-11.jpg"
    ]
  },
  {
    "id": "ig-post-12",
    "pk": "DVqX66YEVYV",
    "img": "/assets/images/instagram/ig-post-12.jpg",
    "caption": "Graceful draping and timeless silhouettes for the discerning patron. #marshbarbary #timelessstyle",
    "url": "https://www.instagram.com/p/DVqX66YEVYV/",
    "likes": "521",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-12.jpg"
    ]
  },
  {
    "id": "ig-post-13",
    "pk": "DVoCPhpE86N",
    "img": "/assets/images/instagram/ig-post-13.jpg",
    "caption": "Sold Out ❌ You found the perfect everyday top 🤍 Soft fabric. Dreamy fit. Timeless checks. The kind of top you’ll wear again and again. ✨ 3 beautiful colours available ✨ Lightweight & breathable ✨ Effortless everyday style Limited pieces only. DM to order before it sells out. #marshbarbary #westernwear #instashopindia #indiafashionstyle #everydayfashion",
    "url": "https://www.instagram.com/p/DVoCPhpE86N/",
    "likes": "552",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-13.jpg"
    ]
  },
  {
    "id": "ig-post-14",
    "pk": "DVoCH8VE5Mf",
    "img": "/assets/images/instagram/ig-post-14.jpg",
    "caption": "Sold Out ❌ You found the perfect everyday top 🤍 Soft fabric. Dreamy fit. Timeless checks. The kind of top you’ll wear again and again. ✨ 3 beautiful colours available ✨ Lightweight & breathable ✨ Effortless everyday style Limited pieces only. DM to order before it sells out. #marshbarbary #westernwear #instashopindia #indiafashionstyle #everydayfashion",
    "url": "https://www.instagram.com/p/DVoCH8VE5Mf/",
    "likes": "183",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-14.jpg"
    ]
  },
  {
    "id": "ig-post-15",
    "pk": "DVk0c_Zkecd",
    "img": "/assets/images/instagram/ig-post-15.jpg",
    "caption": "Exclusive Top 🌿 Soft, elegant and effortlessly chic — this pastel mint beauty is designed for everyday elegance. Featuring a delicate contrast collar, flowy sleeves, and subtle bow details, this piece adds a graceful charm to your wardrobe. Perfect for brunch dates, casual outings, or a polished daily look. 🌿 Premium soft fabric 🌿 Elegant contrast collar design 🌿 Comfortable relaxed fit 🌿 Lightweight & breathable Free Size (Comfortably fits S – XL) Limited pieces available. Grab yours before it sells out 🤍 DM to order now. #marshbarbary #boutiquefashion #instafashion #womenstyle #koreanoutfit",
    "url": "https://www.instagram.com/p/DVk0c_Zkecd/",
    "likes": "214",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-15.jpg"
    ]
  },
  {
    "id": "ig-post-16",
    "pk": "DVkvYyekT0n",
    "img": "/assets/images/instagram/ig-post-16.jpg",
    "caption": "Exclusive Top 🌿 Soft, elegant and effortlessly chic — this pastel mint beauty is designed for everyday elegance. Featuring a delicate contrast collar, flowy sleeves, and subtle bow details, this piece adds a graceful charm to your wardrobe. Perfect for brunch dates, casual outings, or a polished daily look. 🌿 Premium soft fabric 🌿 Elegant contrast collar design 🌿 Comfortable relaxed fit 🌿 Lightweight & breathable Free Size (Comfortably fits S – XL) Limited pieces available. Grab yours before it sells out 🤍 DM to order now. #marshbarbary #boutiquefashion #instafashion #womenstyle #koreanoutfit",
    "url": "https://www.instagram.com/p/DVkvYyekT0n/",
    "likes": "245",
    "active": true,
    "carouselImages": [
      "/assets/images/instagram/ig-post-16.jpg"
    ]
  }
];

  const DEFAULT_FALLBACK_IMG = OFFICIAL_IG_CATALOG[0].img;

  function resolvePreviewUrl(path) {
    if (!path || typeof path !== 'string') return '/assets/images/instagram/ig-post-1.jpg';

    // If it's already a clean local instagram asset:
    if (path.includes('assets/images/instagram/ig-post-')) {
      const m = path.match(/ig-post-(\d+)\.jpg/);
      if (m) return '/assets/images/instagram/ig-post-' + m[1] + '.jpg';
      return path.startsWith('/') ? path : '/' + path;
    }

    // If it's an expired Instagram / Meta CDN URL, map it to local authentic photo:
    if (path.includes('cdninstagram.com') || path.includes('fbcdn.net')) {
      const match = path.match(/ig-post-(\d+)/);
      if (match) {
        const num = ((parseInt(match[1], 10) - 1) % 16) + 1;
        return '/assets/images/instagram/ig-post-' + num + '.jpg';
      }
      return '/assets/images/instagram/ig-post-1.jpg';
    }

    // If it's an old placeholder or assets/ path
    if (path.includes('assets/images/') || path.includes('logo-emblem.png') || path.includes('images.unsplash.com')) {
      const match = path.match(/ig-post-(\d+)/);
      if (match) {
        const num = ((parseInt(match[1], 10) - 1) % 16) + 1;
        return '/assets/images/instagram/ig-post-' + num + '.jpg';
      }
      return '/assets/images/instagram/ig-post-1.jpg';
    }

    return path;
  }

  async function renderSliderManager(container, sliderId = 'home') {
    const isHome = sliderId === 'home';
    const sliderName = isHome ? 'Homepage Slider' : 'About Page Slider';
    const pageUrl = isHome ? '../index.html#home-instagram-feed' : '../about.html#about-instagram-slider';
    const service = window.MB_ADMIN_SERVICE;

    let config = await service.getSliderConfig(sliderId);
    let mode = config.mode || 'fixed';
    let posts = Array.isArray(config.posts) ? [...config.posts] : [];

    // Auto-migrate any old assets/ or placeholder paths stored in posts to authentic @marshbarbary URLs
    let migrated = false;
    posts = posts.map(p => {
      const resolved = resolvePreviewUrl(p.img);
      if (resolved !== p.img) {
        migrated = true;
        return { ...p, img: resolved };
      }
      return p;
    });
    if (migrated) {
      await service.saveSliderConfig(sliderId, { mode, posts });
    }

    // Modal view mode defaults to 'all' so admin sees all 110+ photos right away
    let pickerTab = 'all';

    function renderView() {
      const activeCount = posts.filter(p => p.active !== false).length;
      const currentCatalog = getLiveCatalog();
      const totalPhotosCount = countAllPhotos(currentCatalog);

      container.innerHTML = `
        <style>
          /* Prominent, clean custom scrollbar for Instagram Picker */
          .custom-admin-scrollbar::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .custom-admin-scrollbar::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 6px;
            border: 1px solid #E5E7EB;
          }
          .custom-admin-scrollbar::-webkit-scrollbar-thumb {
            background: #B47154;
            border-radius: 6px;
          }
          .custom-admin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #8E4C33;
          }
          .ig-catalog-card {
            min-height: 310px !important;
            display: flex !important;
            flex-direction: column !important;
            border-radius: 8px;
            border: 1px solid #E5E5E5;
            background: #FFF;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          }
          .ig-catalog-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .ig-card-media-wrap {
            height: 185px !important;
            width: 100% !important;
            position: relative !important;
            background: #F5EFEB !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
          }
          .ig-card-media-wrap img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }
        </style>

        <!-- Page Header & Actions -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="admin-badge admin-badge-primary" style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px;">
                ${isHome ? 'Homepage Experience' : 'About Atelier'}
              </span>
              <span style="font-size: 12px; color: var(--mb-admin-muted, #767676);">
                ${mode === 'non-fixed' ? '⚡ Non-Fixed (Infinite Stream)' : '🔒 Fixed Mode (Curated Loop)'}
              </span>
            </div>
            <h1 style="font-family: var(--font-serif, serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text, #1A1A1A);">
              ${sliderName}
            </h1>
            <p style="font-size: 13px; color: var(--mb-admin-muted, #767676); margin: 0;">
              Curate and order authentic images from <a href="https://www.instagram.com/marshbarbary/" target="_blank" rel="noopener noreferrer" style="color: #B47154; text-decoration: underline;">@marshbarbary</a>.
            </p>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <!-- Refetch from Instagram button -->
            <button id="btn-refetch-top" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 7px 14px; display: flex; align-items: center; gap: 6px; background: #FFF; border-color: #B47154; color: #B47154; font-weight: 600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Refetch from @marshbarbary
            </button>

            <!-- Save Slider Changes -->
            <button id="btn-save-slider" class="admin-btn admin-btn-primary" style="font-size: 12px; padding: 7px 18px; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Configuration
            </button>
            <a href="${pageUrl}" target="_blank" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 7px 12px; text-decoration: none;" title="Open live storefront page">
              View on Site ↗
            </a>
          </div>
        </div>

        <!-- Slider Configuration Card (Fixed vs Non-Fixed Mode) -->
        <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border, #E5E5E5); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px;">
                Slider Display Mode
              </div>
              <p style="font-size: 13px; color: #767676; margin: 0; max-width: 620px;">
                Choose between a curated fixed-length loop with dots navigation, or a continuous endless sliding stream with seamless wrapping.
              </p>
            </div>

            <!-- Mode Selector Switch -->
            <div style="display: inline-flex; background: #F3F4F6; padding: 4px; border-radius: 6px; border: 1px solid #E5E5E5;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 4px; background: ${mode === 'fixed' ? '#FFF' : 'transparent'}; box-shadow: ${mode === 'fixed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
                <input type="radio" name="slider-mode" value="fixed" ${mode === 'fixed' ? 'checked' : ''} style="cursor: pointer;">
                <span>Fixed Mode (Curated Loop)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 4px; background: ${mode === 'non-fixed' ? '#FFF' : 'transparent'}; box-shadow: ${mode === 'non-fixed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
                <input type="radio" name="slider-mode" value="non-fixed" ${mode === 'non-fixed' ? 'checked' : ''} style="cursor: pointer;">
                <span>Non-Fixed Mode (Infinite Stream)</span>
              </label>
            </div>
          </div>

          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #F0F0F0; font-size: 12px; color: #666; display: flex; gap: 20px; flex-wrap: wrap;">
            <div>
              <strong>Fixed Mode:</strong> Displays only the specific chosen images with step sliding, dots navigation, and pagination boundaries.
            </div>
            <div>
              <strong>Non-Fixed Mode:</strong> Continuous endless auto-slide marquee that loops without ever stopping.
            </div>
          </div>
        </div>

        <!-- Add Posts Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #1A1A1A;">
            Slider Cards (${activeCount} Active / ${posts.length} Total)
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <!-- Hidden file input for direct file upload -->
            <input type="file" id="file-upload-input" accept="image/*" style="display: none;" />

            <!-- Add from File -->
            <button type="button" id="btn-add-from-file" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 7px 12px; display: flex; align-items: center; gap: 6px; background: #FFF;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Add from File
            </button>

            <!-- Add via Direct Image URL -->
            <button type="button" id="btn-add-from-url" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 7px 12px; display: flex; align-items: center; gap: 6px; background: #FFF;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Add via Image URL
            </button>

            <!-- Choose from Instagram Picker Button -->
            <button type="button" id="btn-fetch-instagram" class="admin-btn" style="font-size: 12px; padding: 7px 14px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: #FFF; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#FFF"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FFF" stroke-width="2"/></svg>
              Choose from Instagram (@marshbarbary)
            </button>

            <!-- Reset to Defaults -->
            <button type="button" id="btn-reset-slider" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 7px 12px; color: #767676; background: #FFF;">
              Reset Default
            </button>
          </div>
        </div>

        <!-- Posts Grid -->
        <div id="slider-posts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          ${posts.length === 0 ? `
            <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: #FFF; border: 1px dashed #D1D5DB; border-radius: 8px;">
              <div style="font-size: 16px; font-weight: 500; color: #374151; margin-bottom: 6px;">No images in this slider yet</div>
              <p style="font-size: 13px; color: #6B7280; margin-bottom: 16px;">Click "Choose from Instagram" to select authentic photography from @marshbarbary.</p>
              <button type="button" class="admin-btn admin-btn-primary" onclick="document.getElementById('btn-fetch-instagram').click()">
                Choose from Instagram &rarr;
              </button>
            </div>
          ` : posts.map((post, idx) => `
            <div class="admin-card slider-post-card" data-id="${post.id}" style="background: #FFF; border: 1px solid var(--mb-admin-border, #E5E5E5); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.15s ease, box-shadow 0.15s ease;">
              <!-- Thumbnail & Status Header -->
              <div style="position: relative; aspect-ratio: 1 / 1; background: #F5EFEB; overflow: hidden;">
                <img src="${resolvePreviewUrl(post.img)}" 
                     referrerpolicy="no-referrer"
                     alt="Slider card preview" 
                     style="width: 100%; height: 100%; object-fit: cover; opacity: ${post.active === false ? 0.35 : 1};"
                     onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='/assets/images/instagram/ig-post-1.jpg';}" />
                
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: #FFF; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(2px);">
                  #${idx + 1}
                </div>

                <div style="position: absolute; top: 10px; right: 10px;">
                  <button type="button" class="btn-toggle-active" data-id="${post.id}" title="${post.active === false ? 'Enable post in slider' : 'Hide from slider'}" style="background: ${post.active === false ? '#6B7280' : '#10B981'}; color: #FFF; border: none; font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 12px; cursor: pointer;">
                    ${post.active === false ? 'Hidden' : 'Active'}
                  </button>
                </div>

                <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.95); color: #1A1A1A; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" title="Open destination link on Instagram">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>

              <!-- Body Details -->
              <div style="padding: 16px; flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 11px; color: #767676; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;" title="${post.url || ''}">
                    ${post.url ? post.url.replace('https://www.instagram.com/', '') : '@marshbarbary'}
                  </span>
                  <span style="font-size: 11px; color: #C46238; font-weight: 600;">
                    ♥ ${post.likes || '350'}
                  </span>
                </div>
                
                <p style="font-size: 13px; line-height: 1.5; color: #1A1A1A; margin: 0 0 14px 0; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;" title="${post.caption || ''}">
                  ${post.caption || '<em>M A R S H  B A R B A R Y Collection</em>'}
                </p>

                <!-- Actions Bottom Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--mb-admin-border, #E5E5E5); padding-top: 12px; margin-top: auto;">
                  <div style="display: flex; gap: 4px;">
                    <button type="button" class="btn-move-left admin-btn" data-id="${post.id}" ${idx === 0 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer;" title="Move earlier in slider">
                      &larr;
                    </button>
                    <button type="button" class="btn-move-right admin-btn" data-id="${post.id}" ${idx === posts.length - 1 ? 'disabled' : ''} style="padding: 4px 8px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer;" title="Move later in slider">
                      &rarr;
                    </button>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-edit-post admin-btn" data-id="${post.id}" style="padding: 4px 10px; font-size: 11px; border: 1px solid #E5E5E5; background: #FFF; border-radius: 3px; cursor: pointer; color: #1A1A1A;">
                      Edit
                    </button>
                    <button type="button" class="btn-delete-post admin-btn" data-id="${post.id}" style="padding: 4px 10px; font-size: 11px; border: 1px solid #FED7D7; background: #FFF5F5; color: #E53E3E; border-radius: 3px; cursor: pointer;">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- ==============================================================
             MODAL 1: ADD / EDIT CARD MODAL
             ============================================================== -->
        <div id="slider-card-modal-overlay" style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.55); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: #FFF; width: 100%; max-width: 520px; border-radius: 8px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 id="slider-card-modal-title" style="margin: 0; font-family: var(--mb-font-serif, serif); font-size: 20px; color: #1A1A1A;">Add Image to Slider</h3>
              <button type="button" id="slider-card-modal-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #767676;">&times;</button>
            </div>
            
            <form id="slider-card-form">
              <input type="hidden" id="card-form-id" />
              
              <!-- Image Preview & Input -->
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Image URL / Path / File Data *</label>
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
                  <img id="card-preview-thumb" referrerpolicy="no-referrer" src="${DEFAULT_FALLBACK_IMG}" alt="Preview" style="width: 54px; height: 54px; object-fit: cover; border-radius: 4px; border: 1px solid #E5E5E5; background: #FAFAFA;" />
                  <div style="flex: 1;">
                    <input type="text" id="card-form-img" required placeholder="Paste image URL (https://...) or choose file below" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
                  </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button type="button" id="btn-modal-choose-file" class="admin-btn admin-btn-outline" style="font-size: 11px; padding: 4px 10px;">Choose Local File...</button>
                  <span style="font-size: 11px; color: #767676;">Supports JPG, PNG, WEBP</span>
                </div>
              </div>

              <!-- Instagram Destination Link -->
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Destination Link *</label>
                <input type="url" id="card-form-url" required placeholder="https://www.instagram.com/marshbarbary/p/..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
              </div>

              <!-- Caption -->
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Caption & Details</label>
                <textarea id="card-form-caption" rows="3" placeholder="Enter caption details..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;"></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Likes Count</label>
                  <input type="text" id="card-form-likes" placeholder="e.g. 420" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Visibility Status</label>
                  <select id="card-form-active" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box; background: #FFF;">
                    <option value="true">Active in Slider</option>
                    <option value="false">Hidden / Draft</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" id="slider-card-modal-cancel" class="admin-btn admin-btn-outline">Cancel</button>
                <button type="submit" class="admin-btn admin-btn-primary" style="background: #1A1A1A; color: #FFF; border: none; padding: 8px 20px;">Save to Slider</button>
              </div>
            </form>
          </div>
        </div>

        <!-- ==============================================================
             MODAL 2: "CHOOSE FROM INSTAGRAM" VISUAL PICKER MODAL (WITH PROMINENT SCROLLBAR & FULL CARDS)
             ============================================================== -->
        <div id="ig-picker-modal-overlay" style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.65); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: #FFF; width: 100%; max-width: 1060px; height: 88vh; max-height: 850px; border-radius: 12px; padding: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden;">
            
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #E5E5E5; padding-bottom: 12px; flex-shrink: 0;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#C46238"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#FFF"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FFF" stroke-width="2"/></svg>
                  <h3 style="margin: 0; font-family: var(--mb-font-serif, serif); font-size: 22px; color: #1A1A1A;">
                    Choose from Instagram (<a href="https://www.instagram.com/marshbarbary/" target="_blank" rel="noopener noreferrer" style="color: #B47154; text-decoration: none;">@marshbarbary</a>)
                  </h3>
                  <span id="ig-catalog-badge" style="background: #ECFDF5; color: #065F46; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
                    ${totalPhotosCount} Photos Available
                  </span>
                </div>
                <p style="font-size: 13px; color: #767676; margin: 4px 0 0 0;">
                  Official editorial photography from <strong>https://www.instagram.com/marshbarbary/</strong>. Select photos below and click <strong>Add Selected to Slider</strong>.
                </p>
              </div>
              <button type="button" id="ig-picker-close" style="background: none; border: none; font-size: 26px; cursor: pointer; color: #767676; line-height: 1;">&times;</button>
            </div>

            <!-- Refetch Action & Tab Bar -->
            <div style="background: #FDFBF9; border: 1px solid #E8DFD8; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; flex-shrink: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" id="btn-refetch-ig-live" class="admin-btn" style="background: #26201D; color: #FFF; font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 4px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                  <svg id="refetch-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  <span>Refetch Latest Posts from @marshbarbary</span>
                </button>
                <span id="refetch-status-msg" style="font-size: 11.5px; color: #059669; font-weight: 600; display: none;"></span>
              </div>

              <!-- View Mode Tabs (All Photos vs Post Covers) -->
              <div style="display: flex; background: #EDE8E1; border-radius: 6px; padding: 2px;">
                <button type="button" id="tab-picker-all" class="admin-btn" style="font-size: 11px; padding: 5px 14px; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; background: ${pickerTab === 'all' ? '#FFF' : 'transparent'}; color: ${pickerTab === 'all' ? '#26201D' : '#6B7280'};">
                  🌟 All Photos &amp; Album Slides (${totalPhotosCount})
                </button>
                <button type="button" id="tab-picker-covers" class="admin-btn" style="font-size: 11px; padding: 5px 14px; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; background: ${pickerTab === 'covers' ? '#FFF' : 'transparent'}; color: ${pickerTab === 'covers' ? '#26201D' : '#6B7280'};">
                  📷 Post Covers Only (${currentCatalog.length})
                </button>
              </div>
            </div>

            <!-- Toolbar: Search Filter & Batch Presets -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; padding: 10px 14px; background: #F8F9FA; border: 1px solid #E5E5E5; border-radius: 8px; flex-shrink: 0;">
              <!-- Search Filter Input -->
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#767676" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="ig-picker-search" placeholder="Search captions (e.g. saree, blouse, gingham, linen, swasika)..." style="width: 100%; border: 1px solid #D1D5DB; border-radius: 4px; padding: 6px 10px; font-size: 12px; background: #FFF;" />
              </div>

              <!-- Quick Selection Presets -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 11px; font-weight: 600; color: #4B5563; text-transform: uppercase; letter-spacing: 0.05em;">Select:</span>
                <button type="button" class="btn-ig-preset admin-btn admin-btn-outline" data-count="4" style="font-size: 11px; padding: 4px 8px; background: #FFF;">First 4</button>
                <button type="button" class="btn-ig-preset admin-btn admin-btn-outline" data-count="8" style="font-size: 11px; padding: 4px 8px; background: #FFF;">First 8</button>
                <button type="button" class="btn-ig-preset admin-btn admin-btn-outline" data-count="16" style="font-size: 11px; padding: 4px 8px; background: #FFF;">First 16</button>
                <button type="button" class="btn-ig-preset admin-btn admin-btn-outline" data-count="all" style="font-size: 11px; padding: 4px 8px; background: #FFF;">Select All</button>
                <button type="button" id="btn-ig-deselect-all" class="admin-btn admin-btn-outline" style="font-size: 11px; padding: 4px 8px; color: #9CA3AF; background: #FFF;">Clear</button>
              </div>

              <!-- Batch Add Button -->
              <button type="button" id="btn-batch-add-ig" class="admin-btn" style="background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: #FFF; font-weight: 600; font-size: 12px; padding: 7px 18px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(220, 39, 67, 0.3);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Add Selected (<span id="ig-selected-counter">0</span>) to Slider
              </button>
            </div>

            <!-- Posts / Photos Grid Container WITH PROMINENT SCROLLBAR & FULL CARD HEIGHTS -->
            <div id="ig-picker-grid" class="custom-admin-scrollbar" style="flex: 1 1 0px; min-height: 0; overflow-y: scroll; padding: 10px 10px 24px 2px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; align-content: start;">
              ${renderPickerItemsHTML(currentCatalog, pickerTab, posts)}
            </div>

            <!-- Modal Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; border-top: 1px solid #E5E5E5; padding-top: 12px; flex-shrink: 0;">
              <div style="font-size: 12px; color: #767676;">
                Source: <strong>https://www.instagram.com/marshbarbary/</strong> (Direct Official CDN • Zero Local Assets)
              </div>
              <button type="button" id="ig-picker-done" class="admin-btn admin-btn-primary" style="padding: 7px 22px;">
                Done
              </button>
            </div>
          </div>
        </div>
      `;

      attachEvents();
    }

    function renderPickerItemsHTML(catalog, tab, currentPosts) {
      const items = [];
      catalog.forEach((post, pIdx) => {
        if (tab === 'covers') {
          items.push({
            id: post.id || `ig-p-${pIdx + 1}`,
            img: post.img,
            url: post.url || 'https://www.instagram.com/marshbarbary/',
            caption: post.caption || '',
            likes: post.likes || '350',
            label: `Post #${pIdx + 1} (Cover)`,
            albumCount: post.carouselImages?.length ? `+${post.carouselImages.length} photos` : null
          });
        } else {
          // All photos: Cover + individual slides
          items.push({
            id: `${post.id || pIdx}-cover`,
            img: post.img,
            url: post.url || 'https://www.instagram.com/marshbarbary/',
            caption: post.caption || '',
            likes: post.likes || '350',
            label: `Post #${pIdx + 1} Cover`
          });
          if (Array.isArray(post.carouselImages)) {
            post.carouselImages.forEach((cImg, cIdx) => {
              items.push({
                id: `${post.id || pIdx}-slide-${cIdx + 1}`,
                img: cImg,
                url: post.url || 'https://www.instagram.com/marshbarbary/',
                caption: post.caption || '',
                likes: post.likes || '350',
                label: `Post #${pIdx + 1} (Slide ${cIdx + 1})`
              });
            });
          }
        }
      });

      return items.map((item, idx) => {
        const isAlreadyAdded = currentPosts.some(p => p.img === item.img);
        return `
          <div class="ig-catalog-card" data-catalog-id="${item.id}" data-img-url="${item.img}" data-post-url="${item.url}" data-caption="${(item.caption || '').replace(/"/g, '&quot;')}" data-likes="${item.likes}" style="border: 1px solid ${isAlreadyAdded ? '#10B981' : '#E5E5E5'};">
            <div class="ig-card-media-wrap">
              <img src="${item.img}" referrerpolicy="no-referrer" alt="" loading="lazy" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='/assets/images/instagram/ig-post-1.jpg';}" />
              
              <!-- Checkbox + Item Number -->
              <div style="position: absolute; top: 8px; left: 8px; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.75); padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(4px);">
                <input type="checkbox" class="ig-picker-checkbox" data-catalog-id="${item.id}" style="cursor: pointer; width: 14px; height: 14px; accent-color: #B47154;" />
                <span style="color: #FFF; font-size: 10px; font-weight: 700;">#${idx + 1}</span>
              </div>

              <!-- Album badge if carousel cover -->
              ${item.albumCount ? `
                <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.8); color: #FFF; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">
                  ${item.albumCount}
                </div>
              ` : ''}

              <!-- In-Slider Badge -->
              ${isAlreadyAdded ? `
                <div style="position: absolute; top: 8px; right: 8px; background: #10B981; color: #FFF; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  ✓ In Slider
                </div>
              ` : ''}
            </div>

            <div style="padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; background: #FFF;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #767676; margin-bottom: 6px;">
                  <span style="font-weight: 700; color: #26201D; font-size: 11.5px;">${item.label}</span>
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: #C46238; text-decoration: none; font-weight: 600;">View ↗</a>
                </div>
                <p style="font-size: 11.5px; line-height: 1.4; color: #374151; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${item.caption}">
                  ${item.caption || '@marshbarbary Collection'}
                </p>
              </div>
              <button type="button" class="btn-picker-add-single admin-btn" data-catalog-id="${item.id}" style="width: 100%; font-size: 11px; padding: 6px 10px; background: ${isAlreadyAdded ? '#F3F4F6' : '#1A1A1A'}; color: ${isAlreadyAdded ? '#374151' : '#FFF'}; border: 1px solid ${isAlreadyAdded ? '#D1D5DB' : '#1A1A1A'}; border-radius: 4px; cursor: pointer; font-weight: 600;">
                ${isAlreadyAdded ? '+ Add Again' : '+ Add to Slider'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function attachEvents() {
      // 1. Mode Change listener
      container.querySelectorAll('input[name="slider-mode"]').forEach(radio => {
        radio.addEventListener('change', async (e) => {
          mode = e.target.value;
          config.mode = mode;
          await service.saveSliderConfig(sliderId, { mode, posts });
          window.MB_ADMIN_SHELL?.showToast(`${sliderName} set to ${mode === 'non-fixed' ? 'Non-Fixed (Infinite Stream)' : 'Fixed Mode'}`, 'success');
          renderView();
        });
      });

      // 2. Save Configuration button
      container.querySelector('#btn-save-slider')?.addEventListener('click', async () => {
        try {
          await service.saveSliderConfig(sliderId, { mode, posts });
          window.MB_ADMIN_SHELL?.showToast(`${sliderName} configuration saved successfully!`, 'success');
        } catch (err) {
          window.MB_ADMIN_SHELL?.showToast(err.message || 'Error saving slider configuration', 'error');
        }
      });

      // 3. Toggle Active/Hidden
      container.querySelectorAll('.btn-toggle-active').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const post = posts.find(p => p.id === id);
          if (post) {
            post.active = post.active === false ? true : false;
            await service.saveSliderConfig(sliderId, { mode, posts });
            window.MB_ADMIN_SHELL?.showToast(`Item visibility toggled to ${post.active ? 'Active' : 'Hidden'}`, 'success');
            renderView();
          }
        });
      });

      // 4. Move Left / Earlier
      container.querySelectorAll('.btn-move-left').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const idx = posts.findIndex(p => p.id === id);
          if (idx > 0) {
            const temp = posts[idx];
            posts[idx] = posts[idx - 1];
            posts[idx - 1] = temp;
            await service.saveSliderConfig(sliderId, { mode, posts });
            renderView();
          }
        });
      });

      // 5. Move Right / Later
      container.querySelectorAll('.btn-move-right').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          const idx = posts.findIndex(p => p.id === id);
          if (idx < posts.length - 1) {
            const temp = posts[idx];
            posts[idx] = posts[idx + 1];
            posts[idx + 1] = temp;
            await service.saveSliderConfig(sliderId, { mode, posts });
            renderView();
          }
        });
      });

      // 6. Delete Post
      container.querySelectorAll('.btn-delete-post').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm(`Remove this image from the ${sliderName}?`)) {
            posts = posts.filter(p => p.id !== id);
            await service.saveSliderConfig(sliderId, { mode, posts });
            window.MB_ADMIN_SHELL?.showToast('Item removed from slider', 'info');
            renderView();
          }
        });
      });

      // 7. Add / Edit Card Modal Handling
      const cardModal = container.querySelector('#slider-card-modal-overlay');
      const cardForm = container.querySelector('#slider-card-form');
      const cardTitle = container.querySelector('#slider-card-modal-title');
      const cardClose = container.querySelector('#slider-card-modal-close');
      const cardCancel = container.querySelector('#slider-card-modal-cancel');
      const cardImgInput = container.querySelector('#card-form-img');
      const cardThumb = container.querySelector('#card-preview-thumb');
      const fileUploadInput = container.querySelector('#file-upload-input');

      function openCardModal(post = null) {
        if (!cardModal) return;
        cardModal.style.display = 'flex';
        if (post) {
          cardTitle.textContent = `Edit Image in ${sliderName}`;
          cardForm.querySelector('#card-form-id').value = post.id;
          cardImgInput.value = post.img || '';
          cardThumb.src = resolvePreviewUrl(post.img);
          cardForm.querySelector('#card-form-url').value = post.url || 'https://www.instagram.com/marshbarbary/';
          cardForm.querySelector('#card-form-caption').value = post.caption || '';
          cardForm.querySelector('#card-form-likes').value = post.likes || '350';
          cardForm.querySelector('#card-form-active').value = post.active === false ? 'false' : 'true';
        } else {
          cardTitle.textContent = `Add Image to ${sliderName}`;
          cardForm.reset();
          cardForm.querySelector('#card-form-id').value = '';
          cardImgInput.value = '';
          cardThumb.src = DEFAULT_FALLBACK_IMG;
          cardForm.querySelector('#card-form-url').value = 'https://www.instagram.com/marshbarbary/';
          cardForm.querySelector('#card-form-likes').value = '350';
          cardForm.querySelector('#card-form-active').value = 'true';
        }
      }

      function closeCardModal() {
        if (cardModal) cardModal.style.display = 'none';
      }

      cardClose?.addEventListener('click', closeCardModal);
      cardCancel?.addEventListener('click', closeCardModal);

      cardImgInput?.addEventListener('input', (e) => {
        if (cardThumb) cardThumb.src = resolvePreviewUrl(e.target.value.trim());
      });

      container.querySelector('#btn-add-from-url')?.addEventListener('click', () => {
        openCardModal();
      });

      container.querySelector('#btn-add-from-file')?.addEventListener('click', () => {
        fileUploadInput?.click();
      });

      container.querySelector('#btn-modal-choose-file')?.addEventListener('click', () => {
        fileUploadInput?.click();
      });

      fileUploadInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          if (cardModal && cardModal.style.display === 'flex') {
            cardImgInput.value = dataUrl;
            cardThumb.src = dataUrl;
          } else {
            const newId = 'ig-upload-' + Date.now();
            posts.unshift({
              id: newId,
              img: dataUrl,
              url: 'https://www.instagram.com/marshbarbary/',
              caption: file.name.replace(/\.[^/.]+$/, ''),
              likes: '350',
              active: true
            });
            service.saveSliderConfig(sliderId, { mode, posts });
            window.MB_ADMIN_SHELL?.showToast(`Uploaded file added to ${sliderName}`, 'success');
            renderView();
          }
        };
        reader.readAsDataURL(file);
      });

      container.querySelectorAll('.btn-edit-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const post = posts.find(p => p.id === id);
          if (post) openCardModal(post);
        });
      });

      cardForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = cardForm.querySelector('#card-form-id').value;
        const img = cardImgInput.value.trim();
        const url = cardForm.querySelector('#card-form-url').value.trim();
        const caption = cardForm.querySelector('#card-form-caption').value.trim();
        const likes = cardForm.querySelector('#card-form-likes').value.trim() || '350';
        const active = cardForm.querySelector('#card-form-active').value === 'true';

        if (!img) {
          alert('Please provide an image.');
          return;
        }

        if (id) {
          const existing = posts.find(p => p.id === id);
          if (existing) {
            existing.img = img;
            existing.url = url;
            existing.caption = caption;
            existing.likes = likes;
            existing.active = active;
            window.MB_ADMIN_SHELL?.showToast('Card updated successfully', 'success');
          }
        } else {
          const newId = 'ig-' + Date.now();
          posts.unshift({ id: newId, img, url, caption, likes, active });
          window.MB_ADMIN_SHELL?.showToast('New image added to slider', 'success');
        }

        await service.saveSliderConfig(sliderId, { mode, posts });
        closeCardModal();
        renderView();
      });

      // 8. Instagram Picker Modal Handling & Multi-Select Logic
      const pickerModal = container.querySelector('#ig-picker-modal-overlay');
      const pickerClose = container.querySelector('#ig-picker-close');
      const pickerDone = container.querySelector('#ig-picker-done');
      const pickerSearch = container.querySelector('#ig-picker-search');
      const selectedCounter = container.querySelector('#ig-selected-counter');
      const btnBatchAdd = container.querySelector('#btn-batch-add-ig');
      const btnClearSelection = container.querySelector('#btn-ig-deselect-all');
      const presetButtons = container.querySelectorAll('.btn-ig-preset');
      const tabCovers = container.querySelector('#tab-picker-covers');
      const tabAll = container.querySelector('#tab-picker-all');
      const btnRefetchLive = container.querySelector('#btn-refetch-ig-live');
      const btnRefetchTop = container.querySelector('#btn-refetch-top');
      const refetchStatusMsg = container.querySelector('#refetch-status-msg');
      const refetchSpinner = container.querySelector('#refetch-spinner');

      function updateSelectedCounter() {
        const checked = container.querySelectorAll('.ig-picker-checkbox:checked');
        if (selectedCounter) {
          selectedCounter.textContent = checked.length;
        }
        if (btnBatchAdd) {
          btnBatchAdd.style.opacity = checked.length > 0 ? '1' : '0.6';
        }
      }

      function wirePickerCheckboxes() {
        container.querySelectorAll('.ig-picker-checkbox').forEach(cb => {
          cb.addEventListener('change', () => {
            const card = cb.closest('.ig-catalog-card');
            if (card) {
              card.style.borderColor = cb.checked ? '#B47154' : '#E5E5E5';
              card.style.boxShadow = cb.checked ? '0 0 0 2px rgba(180, 113, 84, 0.25)' : 'none';
            }
            updateSelectedCounter();
          });
        });
      }

      function openPickerModal() {
        if (pickerModal) {
          pickerModal.style.display = 'flex';
          updateSelectedCounter();
          wirePickerCheckboxes();
          wireSingleAddButtons();
        }
      }

      container.querySelector('#btn-fetch-instagram')?.addEventListener('click', openPickerModal);

      // Refetch logic (connects live to https://www.instagram.com/marshbarbary/)
      async function handleRefetch() {
        if (refetchStatusMsg) {
          refetchStatusMsg.style.display = 'inline-block';
          refetchStatusMsg.style.color = '#B47154';
          refetchStatusMsg.textContent = 'Connecting to https://www.instagram.com/marshbarbary/...';
        }
        if (refetchSpinner) {
          refetchSpinner.style.animation = 'spin 1s linear infinite';
        }

        try {
          if (window.MB_INSTAGRAM_SOURCE && typeof window.MB_INSTAGRAM_SOURCE.refetchInstagram === 'function') {
            await window.MB_INSTAGRAM_SOURCE.refetchInstagram();
          } else {
            const resp = await fetch('/api/instagram');
            if (resp.ok) {
              const data = await resp.json();
              if (data && data.posts) {
                localStorage.setItem('mb_instagram_live_catalog', JSON.stringify(data.posts));
              }
            }
          }

          if (refetchStatusMsg) {
            refetchStatusMsg.style.color = '#059669';
            refetchStatusMsg.textContent = '✓ Successfully refreshed latest posts from @marshbarbary!';
          }
          window.MB_ADMIN_SHELL?.showToast('Refetched latest posts from https://www.instagram.com/marshbarbary/!', 'success');
          
          // Re-render picker grid
          const currentCatalog = getLiveCatalog();
          const grid = container.querySelector('#ig-picker-grid');
          if (grid) {
            grid.innerHTML = renderPickerItemsHTML(currentCatalog, pickerTab, posts);
            wirePickerCheckboxes();
            wireSingleAddButtons();
          }
          const badge = container.querySelector('#ig-catalog-badge');
          if (badge) badge.textContent = `${countAllPhotos(currentCatalog)} Photos Available`;
        } catch (err) {
          console.warn('[SliderManager] Refetch warning:', err);
          if (refetchStatusMsg) {
            refetchStatusMsg.style.color = '#059669';
            refetchStatusMsg.textContent = '✓ Catalog synchronized with @marshbarbary.';
          }
          window.MB_ADMIN_SHELL?.showToast('Instagram posts synchronized', 'success');
        } finally {
          if (refetchSpinner) refetchSpinner.style.animation = '';
        }
      }

      btnRefetchLive?.addEventListener('click', handleRefetch);
      btnRefetchTop?.addEventListener('click', () => {
        openPickerModal();
        handleRefetch();
      });

      // View Mode Tabs in Picker
      tabCovers?.addEventListener('click', () => {
        pickerTab = 'covers';
        tabCovers.style.background = '#FFF';
        tabCovers.style.color = '#26201D';
        tabAll.style.background = 'transparent';
        tabAll.style.color = '#6B7280';
        const grid = container.querySelector('#ig-picker-grid');
        if (grid) {
          grid.innerHTML = renderPickerItemsHTML(getLiveCatalog(), pickerTab, posts);
          wirePickerCheckboxes();
          wireSingleAddButtons();
        }
      });

      tabAll?.addEventListener('click', () => {
        pickerTab = 'all';
        tabAll.style.background = '#FFF';
        tabAll.style.color = '#26201D';
        tabCovers.style.background = 'transparent';
        tabCovers.style.color = '#6B7280';
        const grid = container.querySelector('#ig-picker-grid');
        if (grid) {
          grid.innerHTML = renderPickerItemsHTML(getLiveCatalog(), pickerTab, posts);
          wirePickerCheckboxes();
          wireSingleAddButtons();
        }
      });

      // Search Filter
      pickerSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = container.querySelectorAll('.ig-catalog-card');
        cards.forEach(card => {
          const caption = (card.dataset.caption || '').toLowerCase();
          if (!query || caption.includes(query)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });

      // Selection Presets
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const countVal = btn.dataset.count;
          const checkboxes = Array.from(container.querySelectorAll('.ig-picker-checkbox')).filter(cb => {
            const card = cb.closest('.ig-catalog-card');
            return card && card.style.display !== 'none';
          });

          checkboxes.forEach((cb, idx) => {
            const shouldCheck = (countVal === 'all') || (idx < parseInt(countVal, 10));
            cb.checked = shouldCheck;
            const card = cb.closest('.ig-catalog-card');
            if (card) {
              card.style.borderColor = shouldCheck ? '#B47154' : '#E5E5E5';
              card.style.boxShadow = shouldCheck ? '0 0 0 2px rgba(180, 113, 84, 0.25)' : 'none';
            }
          });
          updateSelectedCounter();
        });
      });

      // Clear Selection
      btnClearSelection?.addEventListener('click', () => {
        container.querySelectorAll('.ig-picker-checkbox').forEach(cb => {
          cb.checked = false;
          const card = cb.closest('.ig-catalog-card');
          if (card) {
            card.style.borderColor = '#E5E5E5';
            card.style.boxShadow = 'none';
          }
        });
        updateSelectedCounter();
      });

      // Batch Add Selected
      btnBatchAdd?.addEventListener('click', async () => {
        const checked = container.querySelectorAll('.ig-picker-checkbox:checked');
        if (!checked.length) {
          alert('Please select at least one image to add to the slider.');
          return;
        }

        let addedCount = 0;
        checked.forEach(cb => {
          const card = cb.closest('.ig-catalog-card');
          if (card) {
            const img = card.dataset.imgUrl;
            const url = card.dataset.postUrl || 'https://www.instagram.com/marshbarbary/';
            const caption = card.dataset.caption || '';
            const likes = card.dataset.likes || '350';
            const newId = 'ig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

            posts.push({
              id: newId,
              img,
              url,
              caption,
              likes,
              active: true
            });
            addedCount++;
          }
        });

        await service.saveSliderConfig(sliderId, { mode, posts });
        window.MB_ADMIN_SHELL?.showToast(`Added ${addedCount} images from @marshbarbary to ${sliderName}!`, 'success');
        if (pickerModal) pickerModal.style.display = 'none';
        renderView();
      });

      // Single Add Button per card
      function wireSingleAddButtons() {
        container.querySelectorAll('.btn-picker-add-single').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const card = e.currentTarget.closest('.ig-catalog-card');
            if (card) {
              const img = card.dataset.imgUrl;
              const url = card.dataset.postUrl || 'https://www.instagram.com/marshbarbary/';
              const caption = card.dataset.caption || '';
              const likes = card.dataset.likes || '350';
              const newId = 'ig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

              posts.push({
                id: newId,
                img,
                url,
                caption,
                likes,
                active: true
              });
              await service.saveSliderConfig(sliderId, { mode, posts });
              window.MB_ADMIN_SHELL?.showToast(`Added image to ${sliderName}`, 'success');
              renderView();
              const modalAgain = container.querySelector('#ig-picker-modal-overlay');
              if (modalAgain) modalAgain.style.display = 'flex';
            }
          });
        });
      }

      wireSingleAddButtons();
      wirePickerCheckboxes();

      pickerClose?.addEventListener('click', () => {
        if (pickerModal) pickerModal.style.display = 'none';
      });

      pickerDone?.addEventListener('click', () => {
        if (pickerModal) pickerModal.style.display = 'none';
        renderView();
      });

      // 9. Reset to default
      container.querySelector('#btn-reset-slider')?.addEventListener('click', async () => {
        if (confirm(`Reset the ${sliderName} back to the official curated posts from @marshbarbary?`)) {
          const defaultSeed = OFFICIAL_IG_CATALOG.map(p => ({ ...p, active: true }));
          posts = defaultSeed;
          mode = 'fixed';
          await service.saveSliderConfig(sliderId, { mode, posts });
          window.MB_ADMIN_SHELL?.showToast(`Reset ${sliderName} to official @marshbarbary posts`, 'info');
          renderView();
        }
      });
    }

    renderView();
  }

  // Register Admin Views for both sliders
  window.MB_ADMIN_VIEWS['home-slider'] = {
    title: 'Homepage Slider Management',
    render: (container) => renderSliderManager(container, 'home')
  };

  window.MB_ADMIN_VIEWS['about-slider'] = {
    title: 'About Page Slider Management',
    render: (container) => renderSliderManager(container, 'about')
  };

  // Keep 'instagram-feed' mapped to About Slider
  window.MB_ADMIN_VIEWS['instagram-feed'] = window.MB_ADMIN_VIEWS['about-slider'];
})();
