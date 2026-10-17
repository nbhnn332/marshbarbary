/**
 * MARSH BARBARY — CART PAGE CONTROLLER (cart-page.js)
 * Synchronized with MB_CART unified store.
 * Manages item listing, quantity stepper, promo code UI, order summary,
 * mobile sticky checkout bar, and recommended products grid.
 */

window.MB_CART_PAGE = (() => {
  // DOM References
  let dom = {};

  function init() {
    cacheDom();
    if (!dom.cartPageSection) return;

    // Subscribe to unified cart store
    window.MB_CART.subscribe(render);

    // Initial render of recommended products
    renderRecommended();

    // Re-render recommendations when live database catalog loads
    window.addEventListener('mb:catalog-loaded', renderRecommended);

    // Attach local page listeners
    attachListeners();

    // Mobile sticky bar observer
    initStickyBarObserver();
  }

  function cacheDom() {
    dom = {
      cartPageSection: document.querySelector('.cart-page-section'),
      cartLayout: document.querySelector('.cart-page-layout'),
      cartItemsWrap: document.querySelector('.cart-items-wrap'),
      cartEmptyState: document.querySelector('.cart-page-empty-state'),
      summarySubtotal: document.querySelector('.summary-subtotal-val'),
      summaryShipping: document.querySelector('.summary-shipping-val'),
      summaryTotal: document.querySelector('.summary-total-val'),
      summaryItemsCount: document.querySelector('.summary-items-count'),
      shippingProgressBar: document.querySelector('.cart-page-shipping-progress'),
      promoForm: document.querySelector('.cart-promo-form'),
      promoInput: document.querySelector('.cart-promo-input'),
      promoFeedback: document.querySelector('.cart-promo-feedback'),
      mobileStickyBar: document.querySelector('.cart-sticky-mobile-bar'),
      mobileStickyTotal: document.querySelector('.cart-sticky-total-val'),
      recommendedGrid: document.querySelector('#cart-recommended-grid')
    };
  }

  function render(cart) {
    if (!dom.cartPageSection) return;

    // Check empty state
    if (dom.summaryItemsCount) {
      dom.summaryItemsCount.textContent = `(${cart.totalCount} ${cart.totalCount === 1 ? 'item' : 'items'})`;
    }

    if (cart.items.length === 0) {
      if (dom.cartLayout) dom.cartLayout.style.display = 'none';
      if (dom.cartEmptyState) dom.cartEmptyState.style.display = 'block';
      if (dom.mobileStickyBar) dom.mobileStickyBar.classList.remove('visible');
      return;
    }

    if (dom.cartLayout) dom.cartLayout.style.display = 'grid';
    if (dom.cartEmptyState) dom.cartEmptyState.style.display = 'none';

    // 1. Render Left Column: Cart Items List
    if (dom.cartItemsWrap) {
      dom.cartItemsWrap.innerHTML = cart.items.map(item => `
        <div class="cart-table-row" data-variant-id="${item.variantId}">
          <div class="cart-col-product">
            <a href="product.html?id=${item.id}" class="cart-item-image-link">
              <img src="${item.image}" alt="${item.name}" class="cart-item-page-thumb" />
            </a>
            <div class="cart-item-info">
              <a href="product.html?id=${item.id}" class="cart-item-title-link">
                <h3 class="cart-item-title">${item.name}</h3>
              </a>
              <div class="cart-item-details-line">
                <span class="detail-tag">Color: <strong>${item.color}</strong></span>
                <span class="detail-divider">/</span>
                <span class="detail-tag">Size: <strong>${item.size}</strong></span>
              </div>
              <div class="cart-item-unit-price">
                Unit: ₹${item.price.toLocaleString('en-IN')}
              </div>
              <button type="button" class="cart-item-remove-btn" onclick="MB_CART.removeItem('${item.variantId}')">
                Remove
              </button>
            </div>
          </div>

          <div class="cart-col-quantity">
            <div class="cart-page-qty-stepper">
              <button type="button" class="qty-btn" aria-label="Decrease quantity" onclick="MB_CART.updateQty('${item.variantId}', -1)">−</button>
              <input type="text" class="qty-input" value="${item.qty}" readonly aria-label="Quantity" />
              <button type="button" class="qty-btn" aria-label="Increase quantity" onclick="MB_CART.updateQty('${item.variantId}', 1)">+</button>
            </div>
          </div>

          <div class="cart-col-price">
            <div class="cart-page-line-total">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Right Column: Order Summary
    if (dom.summarySubtotal) {
      dom.summarySubtotal.textContent = `₹${cart.subtotal.toLocaleString('en-IN')}`;
    }
    if (dom.summaryItemsCount) {
      dom.summaryItemsCount.textContent = `(${cart.totalCount} ${cart.totalCount === 1 ? 'item' : 'items'})`;
    }
    if (dom.summaryShipping) {
      dom.summaryShipping.innerHTML = cart.isFreeShipping 
        ? '<span class="text-terracotta">Complimentary</span>' 
        : `₹${cart.shippingFee.toLocaleString('en-IN')}`;
    }
    if (dom.summaryTotal) {
      dom.summaryTotal.textContent = `₹${cart.total.toLocaleString('en-IN')}`;
    }

    // Shipping progress message
    if (dom.shippingProgressBar) {
      dom.shippingProgressBar.innerHTML = `
        <div class="shipping-progress-header">
          ${cart.isFreeShipping 
            ? '<span>✓ You have unlocked <strong>Complimentary Express Shipping</strong></span>' 
            : `<span>Add <strong>₹${cart.amountToFreeShipping.toLocaleString('en-IN')}</strong> more for complimentary shipping</span>`
          }
        </div>
        <div class="shipping-progress-track">
          <div class="shipping-progress-fill" style="width: ${cart.shippingProgress}%;"></div>
        </div>
      `;
    }

    // 3. Update Mobile Sticky Checkout Bar
    if (dom.mobileStickyTotal) {
      dom.mobileStickyTotal.textContent = `₹${cart.total.toLocaleString('en-IN')}`;
    }
  }

  function attachListeners() {
    // Promo Form (UI only, non-blocking registration)
    if (dom.promoForm) {
      dom.promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = dom.promoInput.value.trim();
        if (!code) {
          showPromoFeedback('Please enter a promo code', 'error');
          return;
        }

        // Inform user that coupon validation executes at checkout
        showPromoFeedback(`Code "${code.toUpperCase()}" registered. Validation will be calculated at checkout.`, 'info');
        dom.promoInput.value = '';
      });
    }
  }

  function showPromoFeedback(message, type) {
    if (!dom.promoFeedback) return;
    dom.promoFeedback.textContent = message;
    dom.promoFeedback.className = `cart-promo-feedback ${type}`;
    dom.promoFeedback.style.display = 'block';
  }

  /**
   * Render Recommended Products ("YOU MAY ALSO LIKE")
   * Reuses MB_COMPONENTS.renderProductCard
   */
  function renderRecommended() {
    if (!dom.recommendedGrid || !window.MB_DATA || !window.MB_COMPONENTS) return;

    const allProducts = window.MB_DATA.products || [];
    // Select 4 distinct products
    const recommendations = allProducts.slice(0, 4);

    dom.recommendedGrid.innerHTML = recommendations.map(product => {
      return window.MB_COMPONENTS.renderProductCard(product);
    }).join('');

    // Reattach quick-view or wishlist listeners if components library provides them
    if (window.MB_COMPONENTS.attachProductCardListeners) {
      window.MB_COMPONENTS.attachProductCardListeners(dom.recommendedGrid);
    }
  }

  /**
   * Sticky Mobile Checkout Bar Visibility
   */
  function initStickyBarObserver() {
    if (!dom.mobileStickyBar) return;

    const checkoutBtn = document.querySelector('.cart-summary-checkout-btn');
    if (!checkoutBtn) return;

    window.addEventListener('scroll', () => {
      if (window.innerWidth > 768) {
        dom.mobileStickyBar.classList.remove('visible');
        return;
      }

      const cartState = window.MB_CART.getState();
      if (cartState.items.length === 0) {
        dom.mobileStickyBar.classList.remove('visible');
        return;
      }

      const rect = checkoutBtn.getBoundingClientRect();
      // Show sticky bar when the inline checkout button is out of viewport
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        dom.mobileStickyBar.classList.add('visible');
      } else {
        dom.mobileStickyBar.classList.remove('visible');
      }
    }, { passive: true });
  }

  return {
    init,
    render
  };
})();

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MB_CART_PAGE.init());
} else {
  MB_CART_PAGE.init();
}
