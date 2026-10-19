/**
 * MARSH BARBARY - REUSABLE COMPONENT RENDERERS
 */

window.MB_COMPONENTS = {
  /**
   * Render Category Card - Single Right-Side Wing / Leaf Geometry
   * Visually echoing the MARSH BARBARY logo emblem wing geometry
   */
  renderCategoryCard(cat) {
    const imageOffsets = {
      dresses: { x: -52, y: -8, width: 175, height: 148 },
      'dresses-kaftans': { x: -52, y: -8, width: 175, height: 148 },
      tops: { x: -18, y: -8, width: 142, height: 148 },
      'tops-blouses': { x: -18, y: -8, width: 142, height: 148 },
      bottoms: { x: -68, y: -12, width: 195, height: 152 },
      'trousers-skirts': { x: -68, y: -12, width: 195, height: 152 },
      'bottoms-trousers': { x: -68, y: -12, width: 195, height: 152 },
      coords: { x: -62, y: -8, width: 168, height: 148 },
      'sets-co-ords': { x: -62, y: -8, width: 168, height: 148 },
      'co-ords': { x: -62, y: -8, width: 168, height: 148 }
    };
    const offset = imageOffsets[cat.slug] || imageOffsets[cat.id] || { x: 0, y: 0, width: 100, height: 130 };

    // Resolve robust, non-broken image URL
    function resolveCategoryImg(raw) {
      const defaultImg = window.MB_FALLBACK_SVG || '';
      if (!raw || typeof raw !== 'string') return defaultImg;
      let clean = raw.trim();
      if (!clean || clean.includes('unsplash.com')) return defaultImg;
      while (clean.startsWith('../')) clean = clean.substring(3);
      if (clean.startsWith('./')) clean = clean.substring(2);
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
        return clean;
      }
      if (clean.startsWith('/')) clean = clean.substring(1);
      return clean || defaultImg;
    }

    const imgSrc = resolveCategoryImg(cat.image);

    // Guaranteed valid, clean, unique ID for SVG clipPath (strictly alphanumeric and dashes)
    const title = (cat.title || cat.name || 'COLLECTION').toUpperCase();
    const link = cat.link || `shop.html?category=${cat.slug || cat.id}`;

    return `
      <a href="${link}" class="category-circle-card category-card category-wing-card" data-category="${cat.slug || cat.id}" aria-label="Explore ${title} Collection">
        <div class="category-circle-media-wrap category-wing-shape-wrap">
          <div class="category-circle-ring">
            <img src="${imgSrc}" alt="${title}" class="category-circle-img category-wing-img" loading="lazy" />
          </div>
        </div>
        <div class="category-circle-meta category-wing-meta">
          <h3 class="category-circle-title category-wing-title">${title}</h3>
          <span class="category-circle-explore category-wing-explore">Explore <span class="arrow" aria-hidden="true">&rarr;</span></span>
        </div>
      </a>
    `;
  },

  /**
   * Render Reusable Product Card
   * Modern luxury editorial card with elevated white surface, subtle border,
   * glassmorphic badges/actions, category eyebrow, refined serif title, and balanced meta row.
   */
  renderProductCard(prod) {
    const swatches = prod.swatches || [];
    const swatchesHtml = swatches.length > 0 ? `
      <div class="product-swatches" aria-label="Available Colours">
        ${swatches.map((s, idx) => `
          <button type="button"
                  class="variant-img-swatch ${idx === 0 ? 'active' : ''}"
                  title="${s.name}"
                  aria-label="${s.name}"
                  data-swatch-index="${idx}"
                  data-swatch-img="${s.image || ''}">
            ${s.image
              ? `<img src="${s.image}" alt="${s.name}" loading="lazy" />`
              : `<span class="variant-img-swatch-fallback" style="background:${s.color || '#ccc'}" title="${s.name}"></span>`
            }
          </button>
        `).join('')}
      </div>
    ` : '';

    const hasSecondary = Array.isArray(prod.gallery) && prod.gallery.length > 1 && prod.gallery[1] && prod.gallery[1] !== prod.image;
    const secondaryImgHtml = hasSecondary ? `
      <img src="${prod.gallery[1]}" alt="${prod.name} alternate view" class="product-thumb product-thumb-secondary" loading="lazy" />
    ` : '';

    const isSale = Boolean(prod.salePrice && prod.basePrice && Number(prod.salePrice) < Number(prod.basePrice));
    const saleNum = Number(prod.salePrice || prod.price || 0).toLocaleString('en-IN');
    const baseNum = Number(prod.basePrice || prod.price || 0).toLocaleString('en-IN');
    const standardNum = Number(prod.price || 0).toLocaleString('en-IN');

    // Category / Tag display
    const rawCat = prod.category || '';
    const categoryLabel = rawCat ? rawCat.replace(/[-_]/g, ' ').toUpperCase() : 'MARSH BARBARY';

    // Badge logic (Sale, New, or Handcrafted)
    const badgeText = isSale ? 'SALE' : (prod.isNew ? 'NEW' : '');
    const badgeHtml = badgeText ? `
      <span class="product-badge ${isSale ? 'badge-sale' : 'badge-new'}">${badgeText}</span>
    ` : '';

    return `
      <article class="product-card" data-product-id="${prod.id}">
        <div class="product-thumb-wrap">
          ${badgeHtml}

          <button type="button" class="product-wishlist-btn" aria-label="Add to Wishlist" data-product-id="${prod.id}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          <a href="product.html?id=${prod.id}" class="product-thumb-link" aria-label="View ${prod.name}">
            <img src="${prod.image}" alt="${prod.name}" class="product-thumb product-thumb-primary" loading="lazy" />
            ${secondaryImgHtml}
          </a>


        </div>

        <div class="product-meta">
          <span class="product-category-eyebrow">${categoryLabel}</span>
          <h3 class="product-name">
            <a href="product.html?id=${prod.id}">${prod.name}</a>
          </h3>

          <div class="product-meta-bottom">
            <div class="product-price-box">
              ${isSale ? `
                <span class="product-price"><span class="price-currency">₹</span>${saleNum}</span>
                <span class="product-price-original"><span class="price-currency">₹</span>${baseNum}</span>
              ` : `
                <span class="product-price"><span class="price-currency">₹</span>${standardNum}</span>
              `}
            </div>
            ${swatchesHtml}
          </div>
        </div>
      </article>
    `;
  },

  /**
   * Render Brand Value Pillar
   */
  renderValueItem(val) {
    return `
      <div class="value-item">
        <div class="value-icon-box">
          ${val.icon}
        </div>
        <div class="value-content">
          <h4 class="value-title">${val.title}</h4>
          <p class="value-desc">${val.desc}</p>
        </div>
      </div>
    `;
  }
};

// Global listener for product card variant image swatch selection
document.addEventListener('click', (e) => {
  const swatchBtn = e.target.closest('.product-swatches .variant-img-swatch');
  if (swatchBtn) {
    e.preventDefault();
    e.stopPropagation();
    const swatchesContainer = swatchBtn.closest('.product-swatches');
    if (swatchesContainer) {
      swatchesContainer.querySelectorAll('.variant-img-swatch').forEach(btn => btn.classList.remove('active'));
      swatchBtn.classList.add('active');
    }
    const card = swatchBtn.closest('.product-card');
    const swatchImg = swatchBtn.getAttribute('data-swatch-img');
    if (card && swatchImg) {
      const primaryImg = card.querySelector('.product-thumb-primary');
      if (primaryImg) {
        primaryImg.src = swatchImg;
      }
    }
  }
});
