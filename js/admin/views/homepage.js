/**
 * MARSH BARBARY — ADMIN VIEW: HOMEPAGE MANAGEMENT (js/admin/views/homepage.js)
 * 1:1 management interface for the ACTUAL customer homepage (index.html).
 * Controls:
 * 1. HERO (Full rectangle visual asset - zero CTA button per approved design)
 * 2. BANNER — OUR STORY (Editorial campaign banner with quote and CTA)
 * 3. NEW ARRIVALS (Product showcase header & display)
 * 4. COLLECTIONS (Explore Our New Collection intro & categories)
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.homepage = {
  title: 'Homepage Management',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;
    const config = await service.getHomepageConfig();
    const categories = await service.getCategories();
    const products = await service.getProducts();

    const hero = config.hero || {
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      altText: 'Where Wild Elegance Meets Style',
      enabled: true
    };

    const story = config.storyBanner || {
      tag: 'OUR STORY',
      headline: 'More Than Just Fashion',
      description: 'At Marsh Barbary, we believe in clothing that empowers — thoughtfully designed, mindfully made, and inspired by the beauty of everyday life.',
      ctaText: 'Discover Our Story',
      ctaLink: 'shop.html',
      quote: 'A kinder wardrobe for a brighter tomorrow.',
      image: 'assets/images/story-banner.jpg',
      enabled: true
    };

    const newArrivals = config.newArrivals || {
      headline: 'New Arrivals',
      viewAllText: 'View All →',
      viewAllLink: 'shop.html',
      productLimit: 4,
      enabled: true
    };

    const collections = config.collections || {
      headline: 'Explore Our New Collection',
      subtext: 'Thoughtfully designed pieces for every chapter of your story.',
      ctaText: 'View Collection →',
      ctaLink: 'shop.html',
      enabled: true
    };

    const activeArrivals = products.filter(p => p.newArrival || p.status === 'active').slice(0, 4);
    const activeCats = categories.filter(c => c.status === 'active');

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Homepage Content Management
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            1:1 direct management of the sections currently active on the customer homepage (<a href="../index.html" target="_blank" style="color: var(--mb-admin-accent); text-decoration: none;">index.html ↗</a>).
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="../index.html" target="_blank" class="admin-btn admin-btn-outline admin-btn-sm">
            View Live Homepage ↗
          </a>
          <button id="btn-save-homepage" class="admin-btn admin-btn-primary admin-btn-sm">
            Save All Changes
          </button>
        </div>
      </div>

      <!-- Navigation Jump Tabs -->
      <div class="admin-tabs" style="margin-bottom: 24px;">
        <a href="#section-hero" class="admin-tab-btn active" onclick="event.preventDefault(); document.getElementById('section-hero').scrollIntoView({ behavior: 'smooth' });">1. Hero Section</a>
        <a href="#section-collections" class="admin-tab-btn" onclick="event.preventDefault(); document.getElementById('section-collections').scrollIntoView({ behavior: 'smooth' });">2. Collections</a>
        <a href="#section-arrivals" class="admin-tab-btn" onclick="event.preventDefault(); document.getElementById('section-arrivals').scrollIntoView({ behavior: 'smooth' });">3. New Arrivals</a>
        <a href="#section-story" class="admin-tab-btn" onclick="event.preventDefault(); document.getElementById('section-story').scrollIntoView({ behavior: 'smooth' });">4. Banner — Our Story</a>
      </div>

      <form id="homepage-mgmt-form">
        <div style="display: flex; flex-direction: column; gap: 32px;">

          <!-- ============================================================
               1. HERO SECTION
               ============================================================ -->
          <div class="admin-card" id="section-hero">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mb-admin-accent);">Section 1</span>
                <div style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text); margin-top: 2px;">
                  Hero Section
                </div>
                <div style="font-size: 12px; color: var(--mb-admin-muted);">
                  The approved hero is a pure full-rectangle editorial visual with zero floating CTA buttons.
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="hero-enabled" ${hero.enabled ? 'checked' : ''}>
                Section Enabled
              </label>
            </div>

            <div class="admin-grid admin-grid-2">
              <div>
                <div class="admin-form-group">
                  <div id="hero-img-source-mount"></div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="hero-alt">Accessibility Description (Alt Text)</label>
                  <input type="text" id="hero-alt" class="admin-input" value="${hero.altText || 'Where Wild Elegance Meets Style'}">
                </div>
              </div>

              <!-- Live Hero Preview -->
              <div>
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mb-admin-muted); margin-bottom: 8px;">
                  Live Hero Preview
                </div>
                <div style="border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); overflow: hidden; background: #000; position: relative;">
                  <img id="hero-prev-img" src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(hero.image || 'assets/images/hero-banner.jpg') : '../' + (hero.image || 'assets/images/hero-banner.jpg')}" alt="${hero.altText || ''}" style="width: 100%; height: 180px; object-fit: cover; display: block;">
                  <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.65); color: #fff; padding: 2px 8px; font-size: 10px; border-radius: 2px;">
                    Full Rectangle (No CTA Button)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================
               2. COLLECTIONS (EXPLORE OUR NEW COLLECTION)
               ============================================================ -->
          <div class="admin-card" id="section-collections">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mb-admin-accent);">Section 2</span>
                <div style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text); margin-top: 2px;">
                  Explore Our New Collection (Categories)
                </div>
                <div style="font-size: 12px; color: var(--mb-admin-muted);">
                  Manages the introductory text and link for the category cards grid on the homepage.
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="col-enabled" ${collections.enabled ? 'checked' : ''}>
                Section Enabled
              </label>
            </div>

            <div class="admin-grid admin-grid-2">
              <div>
                <div class="admin-form-group">
                  <label class="admin-label" for="col-headline">Section Heading</label>
                  <input type="text" id="col-headline" class="admin-input" value="${collections.headline}">
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="col-subtext">Introductory Lead Paragraph</label>
                  <textarea id="col-subtext" class="admin-textarea" rows="2">${collections.subtext}</textarea>
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="col-cta-text">Button Label</label>
                    <input type="text" id="col-cta-text" class="admin-input" value="${collections.ctaText}">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="col-cta-link">Destination Link</label>
                    <input type="text" id="col-cta-link" class="admin-input" value="${collections.ctaLink}">
                  </div>
                </div>

                <div style="font-size: 11px; color: var(--mb-admin-muted); margin-top: 6px;">
                  * To add, remove, or reorder the actual category cards shown here, visit <a href="#/categories" style="color: var(--mb-admin-accent);">Categories Management</a>.
                </div>
              </div>

              <!-- Live Collections Preview -->
              <div>
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mb-admin-muted); margin-bottom: 8px;">
                  Live Section Preview
                </div>
                <div style="border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); padding: 16px; background: var(--mb-admin-bg);">
                  <div id="col-prev-heading" style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text); line-height: 1.2; margin-bottom: 6px;">
                    ${collections.headline}
                  </div>
                  <div id="col-prev-lead" style="font-size: 11px; color: var(--mb-admin-text-sub); margin-bottom: 12px; line-height: 1.4;">
                    ${collections.subtext}
                  </div>
                  <div style="margin-bottom: 14px;">
                    <span id="col-prev-btn" style="display: inline-block; padding: 4px 10px; border: 1px solid var(--mb-admin-text); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;">
                      ${collections.ctaText}
                    </span>
                  </div>
                  <div style="display: flex; gap: 6px; overflow-x: auto;">
                    ${activeCats.map(c => `
                      <div style="flex: 1; min-width: 60px; text-align: center;">
                        <img src="../${c.image}" alt="" style="width: 100%; height: 50px; object-fit: cover; border-radius: 2px;">
                        <div style="font-size: 9px; font-weight: 500; margin-top: 2px;">${c.name}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================
               3. NEW ARRIVALS (PRODUCTS)
               ============================================================ -->
          <div class="admin-card" id="section-arrivals">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mb-admin-accent);">Section 3</span>
                <div style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text); margin-top: 2px;">
                  New Arrivals (Products Showcase)
                </div>
                <div style="font-size: 12px; color: var(--mb-admin-muted);">
                  Controls the title and destination link for the featured product cards on the homepage.
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="arr-enabled" ${newArrivals.enabled ? 'checked' : ''}>
                Section Enabled
              </label>
            </div>

            <div class="admin-grid admin-grid-2">
              <div>
                <div class="admin-form-group">
                  <label class="admin-label" for="arr-headline">Section Heading</label>
                  <input type="text" id="arr-headline" class="admin-input" value="${newArrivals.headline}">
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="arr-link-text">Header Link Label</label>
                    <input type="text" id="arr-link-text" class="admin-input" value="${newArrivals.viewAllText}">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="arr-link-url">Header Link Target</label>
                    <input type="text" id="arr-link-url" class="admin-input" value="${newArrivals.viewAllLink}">
                  </div>
                </div>

                <div style="font-size: 11px; color: var(--mb-admin-muted); margin-top: 6px;">
                  * Garments displayed here are managed in <a href="#/products" style="color: var(--mb-admin-accent);">Products Catalog</a> by checking the "Mark as New Arrival" or "Feature on Homepage" badges.
                </div>
              </div>

              <!-- Live New Arrivals Preview -->
              <div>
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mb-admin-muted); margin-bottom: 8px;">
                  Live Section Preview
                </div>
                <div style="border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); padding: 16px; background: var(--mb-admin-surface);">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <div id="arr-prev-title" style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text);">
                      ${newArrivals.headline}
                    </div>
                    <span id="arr-prev-link" style="font-size: 11px; color: var(--mb-admin-text); text-decoration: underline;">
                      ${newArrivals.viewAllText}
                    </span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    ${activeArrivals.map(p => `
                      <div style="flex: 1; min-width: 50px;">
                        <img src="../${p.image}" alt="" style="width: 100%; height: 70px; object-fit: cover; border-radius: 2px; border: 1px solid var(--mb-admin-border);">
                        <div style="font-size: 9px; font-weight: 500; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                        <div style="font-size: 8px; color: var(--mb-admin-muted);">₹${p.price}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================
               4. BANNER — OUR STORY (CAMPAIGN BANNER)
               ============================================================ -->
          <div class="admin-card" id="section-story">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 12px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--mb-admin-accent);">Section 4</span>
                <div style="font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--mb-admin-text); margin-top: 2px;">
                  Banner &mdash; Our Story (Editorial Campaign)
                </div>
                <div style="font-size: 12px; color: var(--mb-admin-muted);">
                  The single continuous full-image editorial banner with dark overlay, narrative, and quote.
                </div>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="story-enabled" ${story.enabled ? 'checked' : ''}>
                Section Enabled
              </label>
            </div>

            <div class="admin-grid admin-grid-2">
              <div>
                <div class="admin-form-group">
                  <label class="admin-label" for="story-tag">Banner Eyebrow Tag</label>
                  <input type="text" id="story-tag" class="admin-input" value="${story.tag}">
                </div>

                <div class="admin-form-group">
                  <div id="story-img-source-mount"></div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="story-headline">Headline</label>
                  <input type="text" id="story-headline" class="admin-input" value="${story.headline}">
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="story-desc">Narrative Description</label>
                  <textarea id="story-desc" class="admin-textarea" rows="3">${story.description}</textarea>
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="story-cta-text">Button Label</label>
                    <input type="text" id="story-cta-text" class="admin-input" value="${story.ctaText}">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="story-cta-link">Button Target Link</label>
                    <input type="text" id="story-cta-link" class="admin-input" value="${story.ctaLink}">
                  </div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="story-quote">Editorial Quote (Right Column)</label>
                  <input type="text" id="story-quote" class="admin-input" value="${story.quote}">
                </div>
              </div>

              <!-- Live Story Banner Preview -->
              <div>
                <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mb-admin-muted); margin-bottom: 8px;">
                  Live Banner Preview
                </div>
                <div style="border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); overflow: hidden; background: #26201D; color: #FFFFFF; position: relative;">
                  <img id="story-prev-img" src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(story.image || 'assets/images/story-banner.jpg') : '../' + (story.image || 'assets/images/story-banner.jpg')}" alt="" style="width: 100%; height: 260px; object-fit: cover; opacity: 0.45; display: block;">
                  <div style="position: absolute; inset: 0; padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <span id="story-prev-tag" style="font-size: 9px; letter-spacing: 0.15em; color: var(--mb-admin-accent); font-weight: 600;">
                        ${story.tag}
                      </span>
                      <div id="story-prev-head" style="font-family: var(--font-serif); font-size: 18px; line-height: 1.2; margin-top: 4px; font-weight: 500;">
                        ${story.headline}
                      </div>
                      <div id="story-prev-desc" style="font-size: 10px; opacity: 0.85; margin-top: 6px; line-height: 1.4; max-width: 260px;">
                        ${story.description}
                      </div>
                      <div style="margin-top: 10px;">
                        <span id="story-prev-cta" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 2px;">
                          ${story.ctaText} &rarr;
                        </span>
                      </div>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">
                      <div id="story-prev-quote" style="font-family: var(--font-serif); font-style: italic; font-size: 11px; opacity: 0.9;">
                        &ldquo;${story.quote}&rdquo;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    `;

    // Initialize Global Image Source Controls for Hero & Story Banner
    if (window.MB_IMAGE_SOURCE) {
      window.MB_IMAGE_SOURCE.render('#hero-img-source-mount', {
        id: 'hero-source',
        label: 'Hero Visual Image *',
        initialValue: hero.image,
        onChange: (data) => {
          const el = document.getElementById('hero-prev-img');
          if (el) el.src = window.MB_IMAGE_SOURCE.resolveDisplayUrl(data.activeValue);
        }
      });

      window.MB_IMAGE_SOURCE.render('#story-img-source-mount', {
        id: 'story-source',
        label: 'Story Banner Photograph *',
        initialValue: story.image,
        onChange: (data) => {
          const el = document.getElementById('story-prev-img');
          if (el) el.src = window.MB_IMAGE_SOURCE.resolveDisplayUrl(data.activeValue);
        }
      });
    }

    // Live preview event listeners
    document.getElementById('col-headline')?.addEventListener('input', e => {
      const el = document.getElementById('col-prev-heading');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('col-subtext')?.addEventListener('input', e => {
      const el = document.getElementById('col-prev-lead');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('col-cta-text')?.addEventListener('input', e => {
      const el = document.getElementById('col-prev-btn');
      if (el) el.textContent = e.target.value;
    });

    document.getElementById('arr-headline')?.addEventListener('input', e => {
      const el = document.getElementById('arr-prev-title');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('arr-link-text')?.addEventListener('input', e => {
      const el = document.getElementById('arr-prev-link');
      if (el) el.textContent = e.target.value;
    });

    document.getElementById('story-tag')?.addEventListener('input', e => {
      const el = document.getElementById('story-prev-tag');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('story-headline')?.addEventListener('input', e => {
      const el = document.getElementById('story-prev-head');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('story-desc')?.addEventListener('input', e => {
      const el = document.getElementById('story-prev-desc');
      if (el) el.textContent = e.target.value;
    });
    document.getElementById('story-cta-text')?.addEventListener('input', e => {
      const el = document.getElementById('story-prev-cta');
      if (el) el.innerHTML = `${e.target.value} &rarr;`;
    });
    document.getElementById('story-quote')?.addEventListener('input', e => {
      const el = document.getElementById('story-prev-quote');
      if (el) el.innerHTML = `&ldquo;${e.target.value}&rdquo;`;
    });

    // Save handler
    const saveHandler = async (e) => {
      if (e) e.preventDefault();

      let heroImage = hero.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop';
      let storyImage = story.image || 'assets/images/story-banner.jpg';

      if (window.MB_IMAGE_SOURCE) {
        const heroVal = window.MB_IMAGE_SOURCE.getValue('#hero-img-source-mount');
        if (heroVal && heroVal.activeValue) heroImage = heroVal.activeValue;

        const storyVal = window.MB_IMAGE_SOURCE.getValue('#story-img-source-mount');
        if (storyVal && storyVal.activeValue) storyImage = storyVal.activeValue;
      }

      const updated = {
        hero: {
          image: heroImage,
          altText: document.getElementById('hero-alt').value.trim(),
          enabled: document.getElementById('hero-enabled').checked
        },
        collections: {
          headline: document.getElementById('col-headline').value.trim(),
          subtext: document.getElementById('col-subtext').value.trim(),
          ctaText: document.getElementById('col-cta-text').value.trim(),
          ctaLink: document.getElementById('col-cta-link').value.trim(),
          enabled: document.getElementById('col-enabled').checked
        },
        newArrivals: {
          headline: document.getElementById('arr-headline').value.trim(),
          viewAllText: document.getElementById('arr-link-text').value.trim(),
          viewAllLink: document.getElementById('arr-link-url').value.trim(),
          productLimit: 4,
          enabled: document.getElementById('arr-enabled').checked
        },
        storyBanner: {
          tag: document.getElementById('story-tag').value.trim(),
          headline: document.getElementById('story-headline').value.trim(),
          description: document.getElementById('story-desc').value.trim(),
          ctaText: document.getElementById('story-cta-text').value.trim(),
          ctaLink: document.getElementById('story-cta-link').value.trim(),
          quote: document.getElementById('story-quote').value.trim(),
          image: storyImage,
          enabled: document.getElementById('story-enabled').checked
        }
      };

      try {
        await service.saveHomepageConfig(updated);
        window.MB_ADMIN_SHELL.showToast('Homepage configuration updated successfully', 'success');
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving homepage configuration', 'error');
      }
    };

    document.getElementById('btn-save-homepage')?.addEventListener('click', saveHandler);
    document.getElementById('homepage-mgmt-form')?.addEventListener('submit', saveHandler);
  }
};
