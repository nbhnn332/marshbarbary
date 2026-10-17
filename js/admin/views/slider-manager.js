/**
 * MARSH BARBARY — ADMIN VIEW: SLIDER MANAGEMENT (js/admin/views/slider-manager.js)
 * High-precision independent management for both Home Slider and About Slider.
 * 
 * Features:
 * 1. Independent slider state for 'home' and 'about'
 * 2. Mode switch: 'fixed' (curated loop) vs 'non-fixed' (infinite endless stream)
 * 3. Add Image manually from local files (via FileReader Base64 data URL)
 * 4. Add Image manually via direct URL
 * 5. "Fetch from Instagram" visual picker modal to select posts directly from @marshbarbary
 * 6. Full reordering, visibility toggle, editing, and deletion
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

(() => {
  // Official Instagram posts repository for the Instagram Picker
  const OFFICIAL_IG_CATALOG = [
    {
      id: 'ig-1',
      img: 'assets/images/instagram/ig-post-1.jpg',
      caption: 'Quiet coastal grace in pure organic linen. Styled by Shwetha Menon for Marsh Barbary. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/shwetha_menon/p/DW4Xlvukk3o/',
      likes: '350'
    },
    {
      id: 'ig-2',
      img: 'assets/images/instagram/ig-post-2.jpg',
      caption: 'The art of natural draping. Crafted from 100% European flax linen. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jhdukVvU/',
      likes: '397'
    },
    {
      id: 'ig-3',
      img: 'assets/images/instagram/ig-post-3.jpg',
      caption: 'Tactile textures that breathe with your movement. #SlowFashion #ConsciousClothing',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jZLNkcB1/',
      likes: '444'
    },
    {
      id: 'ig-4',
      img: 'assets/images/instagram/ig-post-4.jpg',
      caption: 'Aanya Tiered Maxi Dress — sun-kissed terracotta inspired by coastal horizons. #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/p/DVs55hSkQFR/',
      likes: '491'
    },
    {
      id: 'ig-5',
      img: 'assets/images/instagram/ig-post-5.jpg',
      caption: 'Chasing the wild tide. Designed to move with you, not against you. #NatureInspired',
      url: 'https://www.instagram.com/marshbarbary/p/DVsMksSEzGT/',
      likes: '538'
    },
    {
      id: 'ig-6',
      img: 'assets/images/instagram/ig-post-6.jpg',
      caption: 'Clean architectural silhouettes with mindful heart. #TimelessDesign #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/p/DVqX66YEVYV/',
      likes: '585'
    },
    {
      id: 'ig-7',
      img: 'assets/images/instagram/ig-post-7.jpg',
      caption: 'Botanical dye details and delicate finishing in the atelier. #MindfulCraft #Handmade',
      url: 'https://www.instagram.com/marshbarbary/p/DVoCH8VE5Mf/',
      likes: '632'
    },
    {
      id: 'ig-8',
      img: 'assets/images/instagram/ig-post-8.jpg',
      caption: 'Understated elegance for quiet days and memorable evenings. #EffortlessLuxury',
      url: 'https://www.instagram.com/marshbarbary/p/DVk0c_Zkecd/',
      likes: '679'
    }
  ];

  function resolvePreviewUrl(path) {
    if (!path) return '../assets/images/logo-emblem.png';
    if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return '../' + path.replace(/^\.\.\//, '');
  }

  async function renderSliderManager(container, sliderId = 'home') {
    const isHome = sliderId === 'home';
    const sliderName = isHome ? 'Homepage Slider' : 'About Page Slider';
    const pageUrl = isHome ? '../index.html#home-instagram-feed' : '../about.html#about-instagram-slider';
    const service = window.MB_ADMIN_SERVICE;

    let config = await service.getSliderConfig(sliderId);
    let mode = config.mode || 'fixed';
    let posts = Array.isArray(config.posts) ? [...config.posts] : [];

    function renderView() {
      const activeCount = posts.filter(p => p.active !== false).length;

      container.innerHTML = `
        <!-- View Topbar Header -->
        <div class="admin-view-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 8px; border-radius: 4px; background: ${isHome ? '#EBF5FF; color: #1E40AF;' : '#FEF3C7; color: #92400E;'}">
                ${isHome ? 'Homepage Feed' : 'About Page Feed'}
              </span>
              <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: ${mode === 'non-fixed' ? '#F3E8FF; color: #6B21A8;' : '#ECFDF5; color: #065F46;'}">
                ${mode === 'non-fixed' ? '⚡ Non-Fixed (Infinite Stream)' : '✓ Fixed (Curated)'}
              </span>
            </div>
            <h1 class="admin-page-title" style="font-family: var(--mb-font-serif, serif); font-size: 26px; font-weight: 500; color: var(--mb-admin-dark, #1A1A1A); margin: 0 0 6px 0;">
              ${sliderName} Management
            </h1>
            <p style="font-size: 13px; color: var(--mb-admin-muted, #767676); margin: 0;">
              Separate, independent slider engine for 
              <a href="${pageUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--mb-admin-accent, #C46238); text-decoration: none; font-weight: 600;">
                ${isHome ? 'index.html (Home)' : 'about.html (About)'} &rarr;
              </a>
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <a href="${pageUrl}" target="_blank" class="admin-btn admin-btn-outline" style="font-size: 12px; padding: 8px 14px; text-decoration: none;">
              View Live Slider &rarr;
            </a>
            <button type="button" id="btn-save-slider" class="admin-btn admin-btn-primary" style="font-size: 12px; padding: 8px 18px; background: var(--mb-admin-dark, #1A1A1A); color: #FFF; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Save Configuration
            </button>
          </div>
        </div>

        <!-- Mode Configuration Banner (Fixed vs Non-Fixed) -->
        <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border, #E5E5E5); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="font-family: var(--mb-font-serif, serif); font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px;">
                Slider Mode: Fixed vs. Non-Fixed Stream
              </div>
              <p style="font-size: 13px; color: #666; margin: 0; max-width: 680px;">
                Choose how this specific slider functions on the customer storefront.
              </p>
            </div>
            <div style="display: flex; gap: 12px; align-items: center; background: #F8F9FA; padding: 6px; border-radius: 6px; border: 1px solid #E5E5E5;">
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
              <strong>Fixed Mode:</strong> Displays the selected images below with smooth slide steps, dots navigation, and pagination limits.
            </div>
            <div>
              <strong>Non-Fixed Mode:</strong> Continuous endless sliding stream with seamless wrapping so there is no end to the slider.
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

            <!-- Fetch from Instagram Picker -->
            <button type="button" id="btn-fetch-instagram" class="admin-btn" style="font-size: 12px; padding: 7px 14px; background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color: #FFF; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#FFF"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FFF" stroke-width="2"/></svg>
              Fetch from Instagram
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
              <p style="font-size: 13px; color: #6B7280; margin-bottom: 16px;">Add images manually from your files, paste a URL, or click "Fetch from Instagram" to curate posts.</p>
              <button type="button" class="admin-btn admin-btn-primary" onclick="document.getElementById('btn-fetch-instagram').click()">
                Fetch from Instagram &rarr;
              </button>
            </div>
          ` : posts.map((post, idx) => `
            <div class="admin-card slider-post-card" data-id="${post.id}" style="background: #FFF; border: 1px solid var(--mb-admin-border, #E5E5E5); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.15s ease, box-shadow 0.15s ease;">
              <!-- Thumbnail & Status Header -->
              <div style="position: relative; aspect-ratio: 1 / 1; background: #F5F5F5; overflow: hidden;">
                <img src="${resolvePreviewUrl(post.img)}" 
                     alt="Slider card preview" 
                     style="width: 100%; height: 100%; object-fit: cover; opacity: ${post.active === false ? 0.35 : 1};"
                     onerror="this.src='../assets/images/logo-emblem.png'; this.style.objectFit='contain'; this.style.padding='40px';" />
                
                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: #FFF; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(2px);">
                  #${idx + 1}
                </div>

                <div style="position: absolute; top: 10px; right: 10px;">
                  <button type="button" class="btn-toggle-active" data-id="${post.id}" title="${post.active === false ? 'Enable post in slider' : 'Hide from slider'}" style="background: ${post.active === false ? '#6B7280' : '#10B981'}; color: #FFF; border: none; font-size: 10px; font-weight: 600; padding: 4px 10px; border-radius: 12px; cursor: pointer;">
                    ${post.active === false ? 'Hidden' : 'Active'}
                  </button>
                </div>

                <a href="${post.url || 'https://www.instagram.com/marshbarbary/'}" target="_blank" rel="noopener noreferrer" style="position: absolute; bottom: 10px; right: 10px; background: rgba(255,255,255,0.95); color: #1A1A1A; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" title="Open destination link">
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
                  ${post.caption || '<em>No caption</em>'}
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
                  <img id="card-preview-thumb" src="../assets/images/logo-emblem.png" alt="Preview" style="width: 54px; height: 54px; object-fit: cover; border-radius: 4px; border: 1px solid #E5E5E5; background: #FAFAFA;" />
                  <div style="flex: 1;">
                    <input type="text" id="card-form-img" required placeholder="e.g. assets/images/instagram/ig-post-1.jpg or https://..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
                  </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <button type="button" id="btn-modal-choose-file" class="admin-btn admin-btn-outline" style="font-size: 11px; padding: 4px 10px;">Choose Local File...</button>
                  <span style="font-size: 11px; color: #767676;">Supports JPG, PNG, WEBP files</span>
                </div>
              </div>

              <!-- Instagram Destination Link -->
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Destination Link *</label>
                <input type="url" id="card-form-url" required placeholder="https://www.instagram.com/marshbarbary/p/..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;" />
              </div>

              <!-- Caption -->
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #1A1A1A;">Caption & Styling Notes</label>
                <textarea id="card-form-caption" rows="3" placeholder="Enter caption text or styling details..." style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5E5E5; border-radius: 4px; box-sizing: border-box;"></textarea>
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
             MODAL 2: "FETCH FROM INSTAGRAM" VISUAL PICKER MODAL
             ============================================================== -->
        <div id="ig-picker-modal-overlay" style="display: none; position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: #FFF; width: 100%; max-width: 860px; max-height: 88vh; border-radius: 10px; padding: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column;">
            
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #E5E5E5; padding-bottom: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#C46238"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#FFF"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="#FFF" stroke-width="2"/></svg>
                  <h3 style="margin: 0; font-family: var(--mb-font-serif, serif); font-size: 22px; color: #1A1A1A;">
                    Select Posts from @marshbarbary
                  </h3>
                </div>
                <p style="font-size: 13px; color: #767676; margin: 4px 0 0 0;">
                  Click <strong>"Add to Slider"</strong> on any official Instagram post to insert it into the <strong>${sliderName}</strong>.
                </p>
              </div>
              <button type="button" id="ig-picker-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #767676;">&times;</button>
            </div>

            <!-- Posts Grid -->
            <div style="flex: 1; overflow-y: auto; padding-right: 6px; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;">
              ${OFFICIAL_IG_CATALOG.map((igItem, idx) => {
                const isAlreadyAdded = posts.some(p => p.url === igItem.url || p.img === igItem.img);
                return `
                  <div style="border: 1px solid ${isAlreadyAdded ? '#10B981' : '#E5E5E5'}; border-radius: 6px; overflow: hidden; background: #FFF; display: flex; flex-direction: column;">
                    <div style="position: relative; aspect-ratio: 1 / 1; background: #000;">
                      <img src="${resolvePreviewUrl(igItem.img)}" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
                      <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.65); color: #FFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px;">
                        Post #${idx + 1}
                      </div>
                      ${isAlreadyAdded ? `
                        <div style="position: absolute; top: 8px; right: 8px; background: #10B981; color: #FFF; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px;">
                          ✓ in Slider
                        </div>
                      ` : ''}
                    </div>
                    <div style="padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                      <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #767676; margin-bottom: 6px;">
                          <span>♥ ${igItem.likes} likes</span>
                          <a href="${igItem.url}" target="_blank" rel="noopener noreferrer" style="color: #C46238; text-decoration: none;">View ↗</a>
                        </div>
                        <p style="font-size: 12px; line-height: 1.4; color: #374151; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                          ${igItem.caption}
                        </p>
                      </div>
                      <button type="button" class="btn-picker-add admin-btn" data-catalog-id="${igItem.id}" style="width: 100%; font-size: 11px; padding: 6px 10px; background: ${isAlreadyAdded ? '#F3F4F6' : '#1A1A1A'}; color: ${isAlreadyAdded ? '#374151' : '#FFF'}; border: 1px solid ${isAlreadyAdded ? '#D1D5DB' : '#1A1A1A'}; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        ${isAlreadyAdded ? '+ Add Again' : '+ Add to Slider'}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Modal Footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; pt: 12px; border-top: 1px solid #E5E5E5;">
              <span style="font-size: 12px; color: #767676;">Showing all 8 authentic Instagram posts from @marshbarbary</span>
              <button type="button" id="ig-picker-done" class="admin-btn admin-btn-primary" style="padding: 6px 16px; font-size: 12px;">Done</button>
            </div>
          </div>
        </div>
      `;

      attachEvents();
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
          cardThumb.src = '../assets/images/logo-emblem.png';
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

      // Button "Add via Image URL"
      container.querySelector('#btn-add-from-url')?.addEventListener('click', () => {
        openCardModal();
      });

      // Button "Add from File" (Triggers file input)
      container.querySelector('#btn-add-from-file')?.addEventListener('click', () => {
        fileUploadInput.click();
      });

      // Button "Choose Local File" inside modal
      container.querySelector('#btn-modal-choose-file')?.addEventListener('click', () => {
        fileUploadInput.click();
      });

      fileUploadInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          openCardModal();
          cardImgInput.value = dataUrl;
          if (cardThumb) cardThumb.src = dataUrl;
          cardForm.querySelector('#card-form-caption').value = `Uploaded from file: ${file.name.replace(/\.[^/.]+$/, '')}`;
          window.MB_ADMIN_SHELL?.showToast(`File "${file.name}" loaded successfully`, 'info');
        };
        reader.readAsDataURL(file);
      });

      // Edit Post Button on Card
      container.querySelectorAll('.btn-edit-post').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const post = posts.find(p => p.id === id);
          if (post) openCardModal(post);
        });
      });

      // Save Form Submit
      cardForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = cardForm.querySelector('#card-form-id').value;
        const img = cardImgInput.value.trim();
        const url = cardForm.querySelector('#card-form-url').value.trim();
        const caption = cardForm.querySelector('#card-form-caption').value.trim();
        const likes = cardForm.querySelector('#card-form-likes').value.trim() || '350';
        const active = cardForm.querySelector('#card-form-active').value === 'true';

        if (!img) {
          alert('Please provide an image URL or choose a file.');
          return;
        }

        if (id) {
          // Edit existing
          const post = posts.find(p => p.id === id);
          if (post) {
            post.img = img;
            post.url = url;
            post.caption = caption;
            post.likes = likes;
            post.active = active;
          }
          window.MB_ADMIN_SHELL?.showToast('Item updated successfully', 'success');
        } else {
          // Add new card to beginning
          const newId = 'ig-' + Date.now();
          posts.unshift({
            id: newId,
            img,
            url,
            caption,
            likes,
            active
          });
          window.MB_ADMIN_SHELL?.showToast('New image added to slider', 'success');
        }

        await service.saveSliderConfig(sliderId, { mode, posts });
        closeCardModal();
        renderView();
      });

      // 8. Instagram Picker Modal Handling
      const pickerModal = container.querySelector('#ig-picker-modal-overlay');
      const pickerClose = container.querySelector('#ig-picker-close');
      const pickerDone = container.querySelector('#ig-picker-done');

      container.querySelector('#btn-fetch-instagram')?.addEventListener('click', () => {
        if (pickerModal) pickerModal.style.display = 'flex';
      });

      pickerClose?.addEventListener('click', () => {
        if (pickerModal) pickerModal.style.display = 'none';
      });

      pickerDone?.addEventListener('click', () => {
        if (pickerModal) pickerModal.style.display = 'none';
        renderView();
      });

      container.querySelectorAll('.btn-picker-add').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const catalogId = e.currentTarget.dataset.catalogId;
          const found = OFFICIAL_IG_CATALOG.find(item => item.id === catalogId);
          if (found) {
            const newId = 'ig-' + Date.now();
            posts.push({
              id: newId,
              img: found.img,
              url: found.url,
              caption: found.caption,
              likes: found.likes,
              active: true
            });
            await service.saveSliderConfig(sliderId, { mode, posts });
            window.MB_ADMIN_SHELL?.showToast(`Added post #${catalogId} to ${sliderName}`, 'success');
            // Re-render picker view so button states update
            renderView();
            // Re-open picker
            const modalAgain = container.querySelector('#ig-picker-modal-overlay');
            if (modalAgain) modalAgain.style.display = 'flex';
          }
        });
      });

      // 9. Reset to default
      container.querySelector('#btn-reset-slider')?.addEventListener('click', async () => {
        if (confirm(`Reset the ${sliderName} back to the 8 curated official posts from @marshbarbary?`)) {
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
