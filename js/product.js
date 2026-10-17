/**
 * MARSH BARBARY - PRODUCT DETAIL PAGE CONTROLLER (PHASE 3)
 * Handles client-side product resolution, multi-image gallery with lightbox,
 * color & size selection, stock states, accordions, size guide modal,
 * sticky mobile buy bar, and related products rendering.
 */

(function () {
  'use strict';

  // State Management
  let currentProduct = null;
  let activeImageIndex = 0;
  let selectedColor = '';
  let selectedSize = '';
  let quantity = 1;
  let isWishlisted = false;

  // DOM Elements Cache
  let elements = {};

  function initElements() {
    elements = {
      // Main Containers
      mainContent: document.getElementById('pdp-main-content'),
      notFoundState: document.getElementById('pdp-not-found-state'),
      
      // Breadcrumb
      crumbCategory: document.getElementById('pdp-crumb-category'),
      crumbProduct: document.getElementById('pdp-crumb-product'),
      
      // Gallery
      mainImg: document.getElementById('pdp-main-img'),
      mainImgWrap: document.getElementById('pdp-main-image-wrap'),
      thumbStrip: document.getElementById('pdp-thumbnails-strip'),
      galleryCounter: document.getElementById('pdp-gallery-counter'),
      
      // Lightbox
      lightbox: document.getElementById('pdp-lightbox'),
      lightboxImg: document.getElementById('pdp-lightbox-img'),
      lightboxClose: document.getElementById('pdp-lightbox-close'),
      lightboxPrev: document.getElementById('pdp-lightbox-prev'),
      lightboxNext: document.getElementById('pdp-lightbox-next'),

      // Product Information
      kicker: document.getElementById('pdp-kicker'),
      title: document.getElementById('pdp-title'),
      price: document.getElementById('pdp-price'),
      colorLabel: document.getElementById('pdp-active-color-name'),
      swatchesContainer: document.getElementById('pdp-swatches-container'),
      sizeLabel: document.getElementById('pdp-active-size-name'),
      sizesContainer: document.getElementById('pdp-sizes-container'),
      stockIndicator: document.getElementById('pdp-stock-indicator'),
      stockDot: document.getElementById('pdp-stock-dot'),
      stockText: document.getElementById('pdp-stock-text'),

      // Quantity & Actions
      qtyMinus: document.getElementById('pdp-qty-minus'),
      qtyPlus: document.getElementById('pdp-qty-plus'),
      qtyNum: document.getElementById('pdp-qty-num'),
      addToBagBtn: document.getElementById('pdp-add-to-bag-btn'),
      wishlistToggle: document.getElementById('pdp-wishlist-toggle'),

      // Accordions
      accordionDesc: document.getElementById('pdp-accordion-desc'),
      accordionFabric: document.getElementById('pdp-accordion-fabric'),
      accordionCare: document.getElementById('pdp-accordion-care'),
      accordionDetails: document.getElementById('pdp-accordion-details'),

      // Size Guide
      sizeGuideLink: document.getElementById('pdp-size-guide-link'),
      sizeGuideModal: document.getElementById('pdp-size-guide-modal'),
      sizeGuideClose: document.getElementById('pdp-size-guide-close'),

      // Related Products
      relatedGrid: document.getElementById('pdp-related-grid'),

      // Sticky Mobile Bar
      stickyBar: document.getElementById('pdp-sticky-bar'),
      stickyTitle: document.getElementById('pdp-sticky-title'),
      stickyPrice: document.getElementById('pdp-sticky-price'),
      stickyBtn: document.getElementById('pdp-sticky-btn')
    };
  }

  /**
   * Resolve Product from URL query
   */
  function resolveProduct() {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('id');
    const slug = params.get('slug');
    
    const prods = window.MB_DATA?.products || [];
    if (prods.length === 0) return null;

    if (prodId) {
      const match = prods.find(p => p.id === prodId || p.slug === prodId);
      if (match) return match;
    }

    if (slug) {
      const match = prods.find(p => p.slug === slug || p.id === slug);
      if (match) return match;
    }

    // Default to first live database product
    return prods[0];
  }

  /**
   * Render Product Page
   */
  function renderProduct(product) {
    currentProduct = product;
    document.title = `${product.name} | Marsh Barbary`;

    // Breadcrumb
    const catName = product.category ? (product.category.charAt(0).toUpperCase() + product.category.slice(1)) : 'Collection';
    if (elements.crumbCategory) {
      elements.crumbCategory.textContent = catName;
      elements.crumbCategory.href = `shop.html?category=${product.category}`;
    }
    if (elements.crumbProduct) {
      elements.crumbProduct.textContent = product.name;
    }

    // Info
    if (elements.kicker) elements.kicker.textContent = `COLLECTION ARCHIVE / ${catName.toUpperCase()}`;
    if (elements.title) elements.title.textContent = product.name;
    if (elements.price) elements.price.textContent = product.formattedPrice;

    // Gallery images
    const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
    activeImageIndex = 0;
    renderGallery(gallery);

    // Swatches
    renderSwatches(product.swatches || []);

    // Sizes
    renderSizes(product.sizes || [], product.unavailableSizes || []);

    // Stock Status
    renderStockStatus(product);

    // Accordions Content
    renderAccordions(product);

    // Related Products
    renderRelatedProducts(product);

    // Sticky Mobile Bar info
    if (elements.stickyTitle) elements.stickyTitle.textContent = product.name;
    if (elements.stickyPrice) elements.stickyPrice.textContent = product.formattedPrice;
  }

  /**
   * Gallery Rendering & Thumbnail Control
   */
  function renderGallery(gallery) {
    if (!elements.mainImg || !elements.thumbStrip) return;

    // Set initial main image
    elements.mainImg.src = gallery[0];
    elements.mainImg.alt = currentProduct.name;
    updateGalleryCounter(0, gallery.length);

    // Render Thumbnail Strip
    elements.thumbStrip.innerHTML = gallery.map((src, idx) => `
      <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${src}" alt="${currentProduct.name} - view ${idx + 1}" class="pdp-thumb-img" />
      </div>
    `).join('');

    // Attach click listeners to thumbnails
    elements.thumbStrip.querySelectorAll('.pdp-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.getAttribute('data-index'), 10);
        switchGalleryImage(idx, gallery);
      });
    });
  }

  function switchGalleryImage(index, gallery) {
    if (index < 0 || index >= gallery.length) return;
    activeImageIndex = index;

    // Fade effect on image switch
    elements.mainImg.style.opacity = '0.5';
    setTimeout(() => {
      elements.mainImg.src = gallery[index];
      elements.mainImg.style.opacity = '1';
    }, 120);

    // Update active thumbnail
    elements.thumbStrip.querySelectorAll('.pdp-thumb-item').forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });

    updateGalleryCounter(index, gallery.length);
  }

  function updateGalleryCounter(index, total) {
    if (elements.galleryCounter) {
      elements.galleryCounter.textContent = `${index + 1} / ${total}`;
    }
  }

  /**
   * Lightbox Modal Functions
   */
  function openLightbox(index) {
    if (!elements.lightbox || !currentProduct) return;
    const gallery = currentProduct.gallery || [currentProduct.image];
    activeImageIndex = index >= 0 && index < gallery.length ? index : activeImageIndex;
    
    elements.lightboxImg.src = gallery[activeImageIndex];
    elements.lightboxImg.alt = `${currentProduct.name} full view`;
    elements.lightbox.classList.add('open');
    elements.lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!elements.lightbox) return;
    elements.lightbox.classList.remove('open');
    elements.lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function stepLightbox(direction) {
    if (!currentProduct) return;
    const gallery = currentProduct.gallery || [currentProduct.image];
    let newIndex = activeImageIndex + direction;
    if (newIndex < 0) newIndex = gallery.length - 1;
    if (newIndex >= gallery.length) newIndex = 0;
    
    activeImageIndex = newIndex;
    elements.lightboxImg.style.opacity = '0.5';
    setTimeout(() => {
      elements.lightboxImg.src = gallery[newIndex];
      elements.lightboxImg.style.opacity = '1';
    }, 120);
  }

  /**
   * Render Swatches
   */
  function renderSwatches(swatches) {
    if (!elements.swatchesContainer) return;
    if (!swatches || swatches.length === 0) {
      elements.swatchesContainer.closest('.pdp-option-group')?.style.setProperty('display', 'none');
      return;
    }

    selectedColor = swatches[0].name;
    if (elements.colorLabel) elements.colorLabel.textContent = selectedColor;

    elements.swatchesContainer.innerHTML = swatches.map((s, idx) => `
      <button type="button" 
              class="pdp-swatch-btn ${idx === 0 ? 'active' : ''}" 
              style="background-color: ${s.color};" 
              title="${s.name}" 
              data-name="${s.name}">
      </button>
    `).join('');

    elements.swatchesContainer.querySelectorAll('.pdp-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.swatchesContainer.querySelectorAll('.pdp-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.getAttribute('data-name');
        if (elements.colorLabel) elements.colorLabel.textContent = selectedColor;
      });
    });
  }

  /**
   * Render Sizes
   */
  function renderSizes(sizes, unavailable) {
    if (!elements.sizesContainer) return;

    // Default to first available size
    const availableSizes = sizes.filter(s => !unavailable.includes(s));
    selectedSize = availableSizes.length > 0 ? availableSizes[0] : sizes[0];
    if (elements.sizeLabel) elements.sizeLabel.textContent = selectedSize;

    elements.sizesContainer.innerHTML = sizes.map(s => {
      const isUnavailable = unavailable.includes(s);
      const isSelected = (s === selectedSize);
      return `
        <button type="button" 
                class="pdp-size-btn ${isSelected ? 'active' : ''} ${isUnavailable ? 'disabled' : ''}" 
                data-size="${s}" 
                ${isUnavailable ? 'disabled aria-disabled="true"' : ''}>
          ${s}
        </button>
      `;
    }).join('');

    elements.sizesContainer.querySelectorAll('.pdp-size-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.sizesContainer.querySelectorAll('.pdp-size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.getAttribute('data-size');
        if (elements.sizeLabel) elements.sizeLabel.textContent = selectedSize;
      });
    });
  }

  /**
   * Render Stock Status
   */
  function renderStockStatus(product) {
    if (!elements.stockText || !elements.stockDot) return;

    if (product.stockStatus === 'low-stock') {
      elements.stockDot.className = 'stock-dot low';
      elements.stockText.textContent = product.stockNote || 'Only a few pieces remaining';
    } else if (product.inStock === false) {
      elements.stockDot.className = 'stock-dot out';
      elements.stockText.textContent = 'Out of Stock';
      if (elements.addToBagBtn) {
        elements.addToBagBtn.disabled = true;
        elements.addToBagBtn.textContent = 'Out of Stock';
      }
    } else {
      elements.stockDot.className = 'stock-dot';
      elements.stockText.textContent = product.stockNote || 'In Stock • Ready to ship';
    }
  }

  /**
   * Render Accordions Content
   */
  function renderAccordions(product) {
    if (elements.accordionDesc) {
      elements.accordionDesc.innerHTML = `
        <p>${product.description}</p>
        ${product.details ? `<ul>${product.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
      `;
    }

    if (elements.accordionFabric && product.fabricCare) {
      elements.accordionFabric.innerHTML = `
        <p><strong>Composition:</strong> ${product.fabricCare.composition}</p>
        ${product.fabricCare.lining ? `<p><strong>Lining:</strong> ${product.fabricCare.lining}</p>` : ''}
        <p style="margin-top: 8px;"><strong>Care:</strong> ${product.fabricCare.care}</p>
      `;
    }

    if (elements.accordionCare) {
      elements.accordionCare.innerHTML = `
        <p>All Marsh Barbary garments are thoughtfully created using chemical-free botanical processes. To preserve their natural handfeel and timeless silhouette, we recommend washing sparingly with biodegradable detergents.</p>
      `;
    }
  }

  /**
   * Render Related Products
   */
  function renderRelatedProducts(product) {
    if (!elements.relatedGrid || !window.MB_DATA?.products || !window.MB_COMPONENTS) return;

    // Filter out current product and prioritize same category
    let related = window.MB_DATA.products.filter(p => p.id !== product.id);
    const sameCategory = related.filter(p => p.category === product.category);
    const otherCategories = related.filter(p => p.category !== product.category);
    
    // Pick 4 items
    const selectedRelated = [...sameCategory, ...otherCategories].slice(0, 4);

    elements.relatedGrid.innerHTML = selectedRelated
      .map(p => window.MB_COMPONENTS.renderProductCard(p))
      .join('');
  }

  /**
   * Add to Bag Execution
   */
  function handleAddToBag() {
    if (!currentProduct) return;
    if (window.MB_CART?.addToCart) {
      window.MB_CART.addToCart(currentProduct, selectedSize, selectedColor, quantity);
    }
  }

  /**
   * Wishlist Heart Toggle
   */
  function handleWishlistToggle() {
    isWishlisted = !isWishlisted;
    if (elements.wishlistToggle) {
      elements.wishlistToggle.classList.toggle('active', isWishlisted);
    }
    if (window.MB_CART?.showToast) {
      window.MB_CART.showToast(isWishlisted ? 'Item saved to your wishlist' : 'Item removed from wishlist');
    }
  }

  /**
   * Bind Events
   */
  function bindEvents() {
    // Quantity Controls
    elements.qtyMinus?.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        if (elements.qtyNum) elements.qtyNum.textContent = quantity;
      }
    });

    elements.qtyPlus?.addEventListener('click', () => {
      quantity++;
      if (elements.qtyNum) elements.qtyNum.textContent = quantity;
    });

    // Add to Bag Buttons
    elements.addToBagBtn?.addEventListener('click', handleAddToBag);
    elements.stickyBtn?.addEventListener('click', handleAddToBag);

    // Wishlist Toggle
    elements.wishlistToggle?.addEventListener('click', handleWishlistToggle);

    // Lightbox Triggers
    elements.mainImgWrap?.addEventListener('click', () => {
      openLightbox(activeImageIndex);
    });

    elements.lightboxClose?.addEventListener('click', closeLightbox);
    elements.lightboxPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(-1);
    });
    elements.lightboxNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      stepLightbox(1);
    });

    // Overlay click closes lightbox
    elements.lightbox?.addEventListener('click', (e) => {
      if (e.target === elements.lightbox || e.target.classList.contains('pdp-lightbox-image-wrap')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!elements.lightbox?.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    // Accordions
    document.querySelectorAll('.pdp-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.pdp-accordion-item');
        if (item) {
          item.classList.toggle('open');
        }
      });
    });

    // Size Guide Modal
    elements.sizeGuideLink?.addEventListener('click', (e) => {
      e.preventDefault();
      elements.sizeGuideModal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    elements.sizeGuideClose?.addEventListener('click', () => {
      elements.sizeGuideModal?.classList.remove('open');
      document.body.style.overflow = '';
    });

    elements.sizeGuideModal?.addEventListener('click', (e) => {
      if (e.target === elements.sizeGuideModal) {
        elements.sizeGuideModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Sticky Mobile Buy Bar Scroll Observer
    if (elements.addToBagBtn && elements.stickyBar) {
      window.addEventListener('scroll', () => {
        const rect = elements.addToBagBtn.getBoundingClientRect();
        // If the main buy button is scrolled out of viewport (rect.bottom < 0), show sticky bar on mobile
        if (window.innerWidth <= 768) {
          if (rect.bottom < 0) {
            elements.stickyBar.classList.add('visible');
          } else {
            elements.stickyBar.classList.remove('visible');
          }
        } else {
          elements.stickyBar.classList.remove('visible');
        }
      }, { passive: true });
    }
  }

  /**
   * Initialization
   */
  async function init() {
    initElements();

    // Await live Supabase catalog from database
    if (window.MB_DATA && typeof window.MB_DATA.loadLiveCatalog === 'function') {
      try {
        await (window.MB_DATA.catalogPromise || window.MB_DATA.loadLiveCatalog());
      } catch (e) {
        console.warn('[PDP] Live catalog load error:', e);
      }
    }

    const product = resolveProduct();
    if (!product) {
      // Show refined error state
      if (elements.mainContent) elements.mainContent.style.display = 'none';
      if (elements.notFoundState) elements.notFoundState.style.display = 'block';
      return;
    }

    if (elements.notFoundState) elements.notFoundState.style.display = 'none';
    if (elements.mainContent) elements.mainContent.style.display = 'block';

    bindEvents();
    renderProduct(product);

    window.addEventListener('mb:catalog-loaded', () => {
      const refreshedProduct = resolveProduct();
      if (refreshedProduct) {
        if (elements.notFoundState) elements.notFoundState.style.display = 'none';
        if (elements.mainContent) elements.mainContent.style.display = 'block';
        renderProduct(refreshedProduct);
      }
    });
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
