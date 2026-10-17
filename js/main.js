/**
 * MARSH BARBARY - MAIN ENTRY POINT
 * Mounts components, hydrates admin-controlled sections, and handles page-level interactions
 */

function cleanImagePath(src) {
  if (!src) return '';
  const str = String(src).trim();
  if (str.startsWith('../')) return str.substring(3);
  return str;
}

function getStoredHomepageConfig() {
  try {
    const raw = localStorage.getItem('mb_admin_homepage');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Main] Error reading homepage config:', err);
  }
  return null;
}

function hydrateHomepageFromAdmin() {
  const config = getStoredHomepageConfig();
  if (!config) return;

  // 1. HERO SECTION
  if (config.hero) {
    const heroSection = document.querySelector('.hero-section');
    const heroVisual = document.querySelector('.hero-main-visual');
    if (heroSection) {
      heroSection.style.display = config.hero.enabled === false ? 'none' : '';
    }
    const heroImg = config.hero.image || localStorage.getItem('mb_hero_image');
    if (heroVisual && heroImg) {
      heroVisual.src = cleanImagePath(heroImg);
      heroVisual.style.display = 'block';
    }
    if (heroVisual && config.hero.altText) {
      heroVisual.alt = config.hero.altText;
    }
  }

  // 2. EXPLORE OUR NEW COLLECTION (INTRO HEADINGS)
  if (config.collections) {
    const colSection = document.getElementById('collections');
    if (colSection) {
      colSection.style.display = config.collections.enabled === false ? 'none' : '';
    }
    const colHeadline = document.querySelector('#collections .collection-intro .heading-section');
    if (colHeadline && config.collections.headline) {
      colHeadline.innerHTML = config.collections.headline.replace(/\n/g, '<br />');
    }
    const colSubtext = document.querySelector('#collections .collection-intro .body-lead');
    if (colSubtext && config.collections.subtext) {
      colSubtext.textContent = config.collections.subtext;
    }
    const colCta = document.querySelector('#collections .collection-intro .btn-outline');
    if (colCta) {
      if (config.collections.ctaText) {
        const text = config.collections.ctaText.replace(/→|&rarr;/, '').trim();
        colCta.innerHTML = `${text} &rarr;`;
      }
      if (config.collections.ctaLink) {
        colCta.href = config.collections.ctaLink;
      }
    }
  }

  // 3. NEW ARRIVALS HEADER & LIMIT
  if (config.newArrivals) {
    const arrSection = document.querySelector('.new-arrivals-section');
    if (arrSection) {
      arrSection.style.display = config.newArrivals.enabled === false ? 'none' : '';
    }
    const arrHeadline = document.querySelector('.new-arrivals-section .products-header-row .heading-section');
    if (arrHeadline && config.newArrivals.headline) {
      arrHeadline.textContent = config.newArrivals.headline;
    }
    const arrLink = document.querySelector('.new-arrivals-section .products-header-row .link-arrow');
    if (arrLink) {
      if (config.newArrivals.viewAllText) {
        const text = config.newArrivals.viewAllText.replace(/→|&rarr;/, '').trim();
        arrLink.innerHTML = `${text} &rarr;`;
      }
      if (config.newArrivals.viewAllLink) {
        arrLink.href = config.newArrivals.viewAllLink;
      }
    }
  }

  // 4. OUR STORY CAMPAIGN BANNER
  if (config.storyBanner) {
    const storySection = document.getElementById('story');
    if (storySection) {
      storySection.style.display = config.storyBanner.enabled === false ? 'none' : '';
    }
    const storyImg = document.querySelector('#story .story-banner-img');
    if (storyImg && config.storyBanner.image) {
      storyImg.src = cleanImagePath(config.storyBanner.image);
    }
    const storyTag = document.querySelector('#story .story-banner-tag');
    if (storyTag && config.storyBanner.tag) {
      storyTag.textContent = config.storyBanner.tag;
    }
    const storyHead = document.querySelector('#story .story-banner-headline');
    if (storyHead && config.storyBanner.headline) {
      storyHead.innerHTML = config.storyBanner.headline.replace(/\n/g, '<br />');
    }
    const storyDesc = document.querySelector('#story .story-banner-desc');
    if (storyDesc && config.storyBanner.description) {
      storyDesc.textContent = config.storyBanner.description;
    }
    const storyQuote = document.querySelector('#story .story-banner-quote');
    if (storyQuote && config.storyBanner.quote) {
      const cleanQuote = config.storyBanner.quote.replace(/^["“]|["”]$/g, '').trim();
      storyQuote.innerHTML = `&ldquo;${cleanQuote}&rdquo;`;
    }
    const storyBtn = document.querySelector('#story .story-banner-btn');
    if (storyBtn) {
      if (config.storyBanner.ctaLink) {
        storyBtn.href = config.storyBanner.ctaLink;
      }
      const btnSpan = storyBtn.querySelector('span:first-child');
      if (btnSpan && config.storyBanner.ctaText) {
        btnSpan.textContent = config.storyBanner.ctaText;
      }
    }
  }
}

function renderHomepageDynamicContent() {
  const config = getStoredHomepageConfig();

  // Render Category Cards (Live from Supabase)
  const categoriesContainer = document.getElementById('categories-grid');
  if (categoriesContainer && window.MB_DATA?.categories && window.MB_COMPONENTS) {
    const activeCategories = window.MB_DATA.categories.filter(c => c.status !== 'hidden');
    categoriesContainer.innerHTML = activeCategories
      .map(cat => window.MB_COMPONENTS.renderCategoryCard(cat))
      .join('');
  }

  // Render New Arrivals Products (Respect admin product limit or default 4)
  const productsContainer = document.getElementById('products-grid');
  if (productsContainer && window.MB_DATA?.products && window.MB_COMPONENTS) {
    const limit = config?.newArrivals?.productLimit || 4;
    productsContainer.innerHTML = window.MB_DATA.products
      .slice(0, limit)
      .map(prod => window.MB_COMPONENTS.renderProductCard(prod))
      .join('');
  }

  // Render Values Pillars
  const valuesContainer = document.getElementById('values-grid');
  if (valuesContainer && window.MB_DATA?.values && window.MB_COMPONENTS) {
    valuesContainer.innerHTML = window.MB_DATA.values
      .map(val => window.MB_COMPONENTS.renderValueItem(val))
      .join('');
  }

  // Apply admin editorial configuration overrides
  hydrateHomepageFromAdmin();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Await in-flight catalog fetch from Supabase before rendering to ensure single clean render
  if (window.MB_DATA?.catalogPromise) {
    try {
      await window.MB_DATA.catalogPromise;
    } catch (e) {
      console.warn('[Main] catalogPromise error:', e);
    }
  } else if (window.MB_DATA?.loadLiveCatalog) {
    try {
      await window.MB_DATA.loadLiveCatalog();
    } catch (e) {
      console.warn('[Main] Live catalog load error:', e);
    }
  }

  // Single clean render with live data
  renderHomepageDynamicContent();

  window.addEventListener('mb:catalog-loaded', () => {
    renderHomepageDynamicContent();
  });

  // Hero Pagination Interaction (01 02 03)
  const heroPageNumbers = document.querySelectorAll('.hero-page-num');
  heroPageNumbers.forEach(num => {
    num.addEventListener('click', () => {
      heroPageNumbers.forEach(n => n.classList.remove('active'));
      num.classList.add('active');
    });
  });

  // Re-hydrate live if admin settings change in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'mb_admin_homepage' || e.key === 'mb_admin_products' || e.key === 'mb_admin_categories') {
      renderHomepageDynamicContent();
    }
  });

  console.log('Marsh Barbary website initialized successfully.');
});
