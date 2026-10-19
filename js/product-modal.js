/**
 * MARSH BARBARY - PRODUCT DETAIL VISUAL SHELL (QUICK VIEW MODAL)
 */

window.MB_MODAL = (() => {
  let activeProduct = null;
  let selectedSize = 'M';
  let selectedColor = 'Default';

  function init() {
    attachListeners();
  }

  function attachListeners() {
    const modalOverlay = document.querySelector('.product-modal-overlay');
    const closeBtn = document.querySelector('.product-modal-close');

    closeBtn?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Wishlist Toggle Listener
    document.addEventListener('click', (e) => {
      const wishBtn = e.target.closest('.product-wishlist-btn');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        wishBtn.classList.toggle('active');
        const isActive = wishBtn.classList.contains('active');
        MB_CART.showToast(isActive ? 'Added to your Wishlist' : 'Removed from Wishlist');
      }

      // Quick View Click Listener
      const quickBtn = e.target.closest('[data-quick-view]');
      if (quickBtn) {
        e.preventDefault();
        const prodId = quickBtn.getAttribute('data-quick-view');
        const prod = window.MB_DATA?.products.find(p => p.id === prodId);
        if (prod) openModal(prod);
      }
    });
  }

  function openModal(prod) {
    activeProduct = prod;
    selectedSize = prod.sizes ? prod.sizes[0] : 'M';
    selectedColor = prod.swatches ? prod.swatches[0].name : 'Default';

    const overlay = document.querySelector('.product-modal-overlay');
    const imgEl = document.querySelector('.modal-product-image');
    const titleEl = document.querySelector('.modal-product-title');
    const priceEl = document.querySelector('.modal-product-price');
    const descEl = document.querySelector('.modal-product-desc');
    const sizeContainer = document.querySelector('.modal-sizes-box');
    const swatchContainer = document.querySelector('.modal-swatches-box');

    if (imgEl) imgEl.src = prod.image;
    if (titleEl) titleEl.textContent = prod.name;
    if (priceEl) priceEl.textContent = prod.formattedPrice;
    if (descEl) descEl.textContent = prod.description;

    // Render sizes
    if (sizeContainer && prod.sizes) {
      sizeContainer.innerHTML = `
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">Select Size:</span>
        <div class="size-selector-row">
          ${prod.sizes.map((s, idx) => `
            <button class="size-pill ${idx === 0 ? 'active' : ''}" onclick="MB_MODAL.selectSize('${s}', this)">${s}</button>
          `).join('')}
        </div>
      `;
    }

    // Render swatches
    if (swatchContainer && prod.swatches) {
      swatchContainer.innerHTML = `
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--color-text-secondary); display: block; margin-bottom: 6px;">Select Color: <span id="selected-color-label">${selectedColor}</span></span>
        <div class="product-swatches">
          ${prod.swatches.map((s, idx) => `
            <span class="color-swatch-dot ${idx === 0 ? 'active' : ''}" 
                  style="background-color: ${s.color}; width: 14px; height: 14px;" 
                  title="${s.name}" 
                  onclick="MB_MODAL.selectColor('${s.name}', this)"></span>
          `).join('')}
        </div>
      `;
    }

    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.querySelector('.product-modal-overlay');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function selectSize(size, el) {
    selectedSize = size;
    document.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
  }

  function selectColor(colorName, el) {
    selectedColor = colorName;
    const label = document.getElementById('selected-color-label');
    if (label) label.textContent = colorName;
    document.querySelectorAll('.modal-swatches-box .color-swatch-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');

    // Switch image in modal to variant image
    if (activeProduct) {
      const swatch = (activeProduct.swatches || []).find(s => s.name === colorName);
      const variant = (activeProduct.variants || []).find(v => (v.color || '').toLowerCase() === colorName.toLowerCase());
      const variantImg = swatch?.image || variant?.image_url;
      const imgEl = document.querySelector('.modal-product-image');
      if (variantImg && imgEl) {
        imgEl.style.opacity = '0.5';
        setTimeout(() => {
          imgEl.src = variantImg;
          imgEl.style.opacity = '1';
        }, 80);
      }
    }
  }

  function addActiveToCart() {
    if (activeProduct) {
      MB_CART.addToCart(activeProduct, selectedSize, selectedColor, 1);
      closeModal();
    }
  }

  return {
    init,
    openModal,
    closeModal,
    selectSize,
    selectColor,
    addActiveToCart
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  MB_MODAL.init();
});
