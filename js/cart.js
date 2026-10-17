/**
 * MARSH BARBARY — REUSABLE CART STORE & CONTROLLER
 * Single authoritative source of truth for shopping bag state.
 * Accessible across: Global Header, Cart Drawer, Product Detail Page, and Cart Page.
 * Prepared for plug-and-play Supabase adapter migration.
 */

window.MB_CART = (() => {
  // Configuration
  const CONFIG = {
    storageKey: 'mb_cart_items_v2',
    freeShippingThreshold: 5000,
    standardShippingFee: 250
  };

  // Internal reactive state
  let state = {
    items: [],
    lastRemoved: null,
    undoTimeout: null
  };

  // Event subscribers (pub/sub)
  const listeners = new Set();

  /**
   * Abstracted Storage Provider
   * Currently uses browser localStorage; structured for transparent swap with Supabase.
   */
  const StorageProvider = {
    load() {
      try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('StorageProvider load error, falling back to initial state:', err);
      }
      // Start empty if storage has no items
      return [];
    },

    save(items) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(items));
      } catch (err) {
        console.warn('StorageProvider save error:', err);
      }
    }
  };

  /**
   * Helper: Build deterministic variant ID
   */
  function buildVariantId(productId, size, color) {
    return `${productId}__${size || 'Standard'}__${color || 'Standard'}`;
  }

  /**
   * Subscribe to state updates
   */
  function subscribe(listener) {
    if (typeof listener === 'function') {
      listeners.add(listener);
      // Immediately notify subscriber with current state
      listener(getState());
    }
    return () => listeners.delete(listener);
  }

  /**
   * Notify all subscribers
   */
  function notify() {
    StorageProvider.save(state.items);
    const snapshot = getState();
    listeners.forEach(fn => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Cart subscriber error:', err);
      }
    });

    // Also dispatch custom DOM event for external listeners
    window.dispatchEvent(new CustomEvent('mb:cart-updated', { detail: snapshot }));
  }

  // Dynamic Store Settings Helper
  function getActiveStoreSettings() {
    try {
      const raw = localStorage.getItem('mb_admin_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          freeShippingThreshold: Number(parsed.freeShippingThreshold) || 2999,
          standardShippingFee: Number(parsed.flatShippingFee) || Number(parsed.standardShippingFee) || 150
        };
      }
    } catch (e) {}
    return {
      freeShippingThreshold: 2999,
      standardShippingFee: 150
    };
  }

  /**
   * Get immutable snapshot of cart state
   */
  function getState() {
    const settings = getActiveStoreSettings();
    const threshold = settings.freeShippingThreshold;
    const fee = settings.standardShippingFee;

    const totalCount = state.items.reduce((acc, item) => acc + (item.qty || 1), 0);
    const subtotal = state.items.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
    const isFreeShipping = subtotal >= threshold;
    const shippingProgress = Math.min(100, Math.round((subtotal / threshold) * 100));
    const amountToFreeShipping = Math.max(0, threshold - subtotal);
    const shippingFee = (subtotal === 0 || isFreeShipping) ? 0 : fee;
    const total = subtotal + shippingFee;

    return {
      items: [...state.items],
      totalCount,
      subtotal,
      shippingFee,
      total,
      isFreeShipping,
      shippingProgress,
      amountToFreeShipping,
      freeShippingThreshold: threshold,
      standardShippingFee: fee
    };
  }

  /**
   * Initialize Cart
   */
  function init() {
    state.items = StorageProvider.load();
    attachGlobalListeners();
    renderDrawer();
    notify();

    // Listen to cross-tab storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.storageKey) {
        try {
          state.items = JSON.parse(e.newValue || '[]');
          notify();
        } catch (err) {
          console.warn('Cross-tab sync error:', err);
        }
      }
    });
  }

  /**
   * Attach Header and Drawer triggers
   */
  function attachGlobalListeners() {
    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('[data-action="open-cart"], .header-bag-btn');
      if (openTrigger) {
        e.preventDefault();
        openCart();
        return;
      }

      const closeTrigger = e.target.closest('.cart-drawer-close, .cart-drawer-overlay');
      if (closeTrigger) {
        e.preventDefault();
        closeCart();
        return;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });
  }

  /**
   * Drawer visibility controls
   */
  function openCart() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Add Item to Cart (Deduplicating by Variant ID)
   */
  function addToCart(product, size = 'M', color = 'Default', qty = 1) {
    if (!product || !product.id) {
      showToast('Unable to add item: invalid product');
      return false;
    }

    const requestedQty = parseInt(qty, 10) || 1;
    const variantId = buildVariantId(product.id, size, color);
    const existingIndex = state.items.findIndex(item => item.variantId === variantId);

    // Resolve max stock if available
    const maxStock = product.stockCount || 10;

    if (existingIndex > -1) {
      const currentQty = state.items[existingIndex].qty;
      if (currentQty + requestedQty > maxStock) {
        showToast(`Stock limit reached for ${product.name} (${size})`);
        return false;
      }
      state.items[existingIndex].qty += requestedQty;
    } else {
      state.items.push({
        id: product.id,
        variantId: variantId,
        name: product.name,
        price: product.price,
        image: product.image,
        color: color,
        size: size,
        qty: requestedQty,
        maxStock: maxStock
      });
    }

    notify();
    openCart();
    showToast(`Added ${product.name} (${size}) to Bag`);
    return true;
  }

  /**
   * Update Quantity by Delta
   */
  function updateQty(identifier, delta) {
    let index = -1;
    if (typeof identifier === 'number') {
      index = identifier;
    } else {
      index = state.items.findIndex(item => item.variantId === identifier || item.id === identifier);
    }

    if (index > -1 && state.items[index]) {
      const targetItem = state.items[index];
      const newQty = targetItem.qty + delta;

      if (newQty <= 0) {
        removeItem(index);
        return;
      }

      if (newQty > (targetItem.maxStock || 10)) {
        showToast(`Maximum available stock reached for ${targetItem.name}`);
        return;
      }

      targetItem.qty = newQty;
      notify();
    }
  }

  /**
   * Set Absolute Quantity
   */
  function setQty(identifier, exactQty) {
    const qty = parseInt(exactQty, 10);
    let index = -1;
    if (typeof identifier === 'number') {
      index = identifier;
    } else {
      index = state.items.findIndex(item => item.variantId === identifier || item.id === identifier);
    }

    if (index > -1 && state.items[index]) {
      if (qty <= 0) {
        removeItem(index);
        return;
      }
      const targetItem = state.items[index];
      const max = targetItem.maxStock || 10;
      targetItem.qty = Math.min(qty, max);
      notify();
    }
  }

  /**
   * Remove Item with Undo Capability
   */
  function removeItem(identifier) {
    let index = -1;
    if (typeof identifier === 'number') {
      index = identifier;
    } else {
      index = state.items.findIndex(item => item.variantId === identifier || item.id === identifier);
    }

    if (index > -1) {
      const removed = state.items[index];
      state.items.splice(index, 1);
      state.lastRemoved = { item: removed, index: index };
      notify();

      // Show toast with Undo action
      showToast(`${removed.name} removed from your bag`, {
        actionText: 'UNDO',
        onAction: () => {
          undoRemove();
        }
      });
    }
  }

  /**
   * Undo Remove Action
   */
  function undoRemove() {
    if (state.lastRemoved && state.lastRemoved.item) {
      const { item, index } = state.lastRemoved;
      const insertAt = Math.min(index, state.items.length);
      state.items.splice(insertAt, 0, item);
      state.lastRemoved = null;
      notify();
      showToast(`Restored ${item.name} to your bag`);
    }
  }

  /**
   * Clear All Items
   */
  function clearCart() {
    state.items = [];
    notify();
  }

  /**
   * Render Cart Drawer Content and Header Badges
   */
  function renderDrawer() {
    subscribe((cart) => {
      // 1. Update Header Badges across entire document
      const badges = document.querySelectorAll('.cart-badge');
      badges.forEach(b => {
        b.textContent = cart.totalCount;
      });

      // 2. Update Drawer Title
      const titleCount = document.querySelector('.cart-drawer-title .cart-badge');
      if (titleCount) {
        titleCount.textContent = cart.totalCount;
      }

      // 3. Render Items Container
      const container = document.querySelector('.cart-items-container');
      const footer = document.querySelector('.cart-drawer-footer');

      if (!container) return;

      if (cart.items.length === 0) {
        container.innerHTML = `
          <div class="cart-empty-state">
            <span class="cart-empty-kicker">ATELIER NOTICE</span>
            <h4 class="cart-empty-title">YOUR BAG IS EMPTY</h4>
            <p class="cart-empty-desc">Discover pieces thoughtfully designed for your wardrobe.</p>
            <a href="shop.html" class="btn btn-outline cart-empty-btn" onclick="MB_CART.closeCart()">CONTINUE SHOPPING &rarr;</a>
          </div>
        `;

        if (footer) {
          footer.innerHTML = `
            <div class="cart-subtotal-row">
              <span>Subtotal</span>
              <span class="cart-subtotal-amount">₹0</span>
            </div>
            <p class="cart-shipping-note">Complimentary shipping on orders above ₹${(getActiveStoreSettings().freeShippingThreshold).toLocaleString('en-IN')}</p>
            <a href="shop.html" class="btn btn-dark" style="width: 100%; text-align: center;" onclick="MB_CART.closeCart()">
              Explore Collection &rarr;
            </a>
          `;
        }
        return;
      }

      // Shipping progress indicator HTML
      const shippingProgressHtml = `
        <div class="cart-shipping-progress">
          <div class="cart-shipping-progress-text">
            ${cart.isFreeShipping 
              ? '<span>Complimentary Express Shipping unlocked</span>' 
              : `<span>You're <strong>₹${cart.amountToFreeShipping.toLocaleString('en-IN')}</strong> away from complimentary shipping</span>`
            }
          </div>
          <div class="cart-progress-bar-track">
            <div class="cart-progress-bar-fill" style="width: ${cart.shippingProgress}%;"></div>
          </div>
        </div>
      `;

      // Items list HTML
      const itemsHtml = cart.items.map((item, idx) => `
        <div class="cart-item" data-variant-id="${item.variantId}">
          <a href="product.html?id=${item.id}" onclick="MB_CART.closeCart()">
            <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />
          </a>
          <div class="cart-item-details">
            <div>
              <a href="product.html?id=${item.id}" class="cart-item-name-link" onclick="MB_CART.closeCart()">
                <h4 class="cart-item-name">${item.name}</h4>
              </a>
              <div class="cart-item-meta">
                <span>${item.color}</span>
                <span class="meta-separator">•</span>
                <span>Size ${item.size}</span>
              </div>
            </div>

            <div class="cart-item-actions-row">
              <div class="cart-qty-ctrl">
                <button type="button" class="qty-btn" aria-label="Decrease quantity" onclick="MB_CART.updateQty('${item.variantId}', -1)">−</button>
                <span class="qty-value">${item.qty}</span>
                <button type="button" class="qty-btn" aria-label="Increase quantity" onclick="MB_CART.updateQty('${item.variantId}', 1)">+</button>
              </div>
              <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
            </div>

            <button type="button" class="cart-item-remove-link" onclick="MB_CART.removeItem('${item.variantId}')">
              Remove
            </button>
          </div>
        </div>
      `).join('');

      container.innerHTML = shippingProgressHtml + itemsHtml;

      // Update Footer
      if (footer) {
        footer.innerHTML = `
          <div class="cart-subtotal-row">
            <span>Subtotal</span>
            <span class="cart-subtotal-amount">₹${cart.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <p class="cart-shipping-note">
            ${cart.isFreeShipping 
              ? 'Complimentary shipping applied.' 
              : 'Taxes & shipping calculated at checkout.'}
          </p>
          <div class="cart-drawer-button-group">
            <a href="cart.html" class="btn btn-outline" style="width: 100%; text-align: center;" onclick="MB_CART.closeCart()">
              VIEW BAG
            </a>
            <button type="button" class="btn btn-dark" style="width: 100%;" onclick="MB_CART.proceedToCheckout()">
              CHECKOUT &rarr;
            </button>
          </div>
        `;
      }
    });
  }

  /**
   * Editorial Toast Notification with Undo Support
   */
  function showToast(msg, options = null) {
    let toast = document.querySelector('.toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }

    if (options && options.actionText && typeof options.onAction === 'function') {
      toast.innerHTML = `
        <span class="toast-message">${msg}</span>
        <button type="button" class="toast-action-btn">${options.actionText}</button>
      `;
      const actionBtn = toast.querySelector('.toast-action-btn');
      actionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        options.onAction();
        toast.classList.remove('show');
      });
    } else {
      toast.textContent = msg;
    }

    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  /**
   * Proceed to Checkout with Auth Gating
   */
  function proceedToCheckout() {
    const currentCount = state.items.reduce((s, i) => s + (i.quantity || 1), 0);
    if (currentCount === 0) {
      showToast('Your shopping bag is empty. Please select a piece to begin.');
      return;
    }

    const isAuthed = window.MB_AUTH && typeof window.MB_AUTH.isAuthenticated === 'function' && window.MB_AUTH.isAuthenticated();
    if (isAuthed) {
      window.location.href = 'checkout.html';
    } else {
      window.location.href = 'login.html?redirect=checkout.html';
    }
  }

  return {
    init,
    subscribe,
    getState,
    getItems: () => state.items,
    getItemCount: () => getState().totalCount,
    getSubtotal: () => getState().subtotal,
    openCart,
    closeCart,
    addToCart,
    updateQty,
    setQty,
    removeItem,
    undoRemove,
    clearCart,
    showToast,
    proceedToCheckout
  };
})();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MB_CART?.init());
  } else {
    window.MB_CART?.init();
  }
}
