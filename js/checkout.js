/**
 * MARSH BARBARY — CHECKOUT CONTROLLER (js/checkout.js)
 * Manages the multi-step checkout wizard:
 * Step 1: Address Selection & Gating
 * Step 2: Delivery Method
 * Step 3: Payment Method & Order Snapshotting
 * Step 4: Order Confirmation
 */

window.MB_CHECKOUT = (() => {
  const state = {
    step: 1, // 1: Address, 2: Delivery, 3: Payment, 4: Confirmation
    selectedAddressId: null,
    selectedAddress: null,
    deliveryMethod: 'EXPRESS',
    shippingFee: 0,
    paymentMethod: 'COD',
    order: null
  };

  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  function getAuthUser() {
    return window.MB_AUTH ? window.MB_AUTH.getUser() : null;
  }

  function getStoreSettings() {
    try {
      const raw = localStorage.getItem('mb_admin_settings');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      freeShippingThreshold: 2999,
      flatShippingFee: 150
    };
  }

  function getPaymentSettings() {
    try {
      const raw = localStorage.getItem('mb_admin_payments');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      razorpay: { enabled: true, mode: 'test' },
      phonepe: { enabled: true },
      cod: { enabled: true, maxOrderValue: 5000, fee: 0 }
    };
  }

  function getShippingFee(subtotal) {
    const store = getStoreSettings();
    const threshold = Number(store.freeShippingThreshold) || 2999;
    const flatFee = Number(store.flatShippingFee) || Number(store.standardShippingFee) || 150;
    return subtotal >= threshold ? 0 : flatFee;
  }

  /**
   * Initialize Checkout Wizard
   */
  async function init() {
    // 1. Guard route: must be authenticated
    if (!window.MB_AUTH || !window.MB_AUTH.isAuthenticated()) {
      const returnUrl = window.location.href;
      window.location.href = `login.html?redirect=${encodeURIComponent(returnUrl)}`;
      return;
    }

    // 2. Check cart contents
    const cartState = window.MB_CART ? window.MB_CART.getState() : { items: [], subtotal: 0 };
    if (!cartState.items || cartState.items.length === 0) {
      showEmptyCartState();
      return;
    }

    // 3. Calculate shipping fee
    state.shippingFee = getShippingFee(cartState.subtotal);

    // 4. Render initial view
    renderOrderSummary();
    await loadAndRenderAddresses();
    setupEventListeners();
    updateStepView(1);
  }

  function showEmptyCartState() {
    const mainEl = document.getElementById('checkout-main-content');
    if (mainEl) {
      mainEl.innerHTML = `
        <div class="account-card" style="text-align: center; padding: 60px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #C0B7AC; margin-bottom: 16px;">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2 class="account-section-title" style="margin-bottom: 8px;">Your Shopping Bag is Empty</h2>
          <p class="account-section-desc" style="margin-bottom: 24px;">
            You have no pieces selected for atelier acquisition.
          </p>
          <a href="shop.html" class="auth-btn-primary" style="display: inline-block;">
            Explore Collection
          </a>
        </div>
      `;
    }
  }

  /**
   * Load customer addresses and preselect default
   */
  async function loadAndRenderAddresses() {
    const addressesContainer = document.getElementById('checkout-addresses-list');
    if (!addressesContainer) return;

    try {
      const addresses = await window.MB_ADDRESSES.getAddresses();

      if (addresses.length === 0) {
        state.selectedAddressId = null;
        state.selectedAddress = null;
        addressesContainer.innerHTML = `
          <div class="address-empty-state" style="padding: 32px 16px;">
            <h3 class="address-empty-title" style="font-size: 18px;">No Saved Delivery Address</h3>
            <p class="address-empty-desc">
              Please provide your destination address to proceed with your order.
            </p>
            <button type="button" class="auth-btn-primary" id="btn-checkout-add-first">
              <span>+ Add Delivery Address</span>
            </button>
          </div>
        `;
        const addBtn = document.getElementById('btn-checkout-add-first');
        if (addBtn) {
          addBtn.addEventListener('click', () => openAddressModal());
        }
        updateAddressContinueButton();
        return;
      }

      // Pre-select default address if not set
      if (!state.selectedAddressId) {
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        state.selectedAddressId = defaultAddr.id;
        state.selectedAddress = defaultAddr;
      } else {
        state.selectedAddress = addresses.find(a => a.id === state.selectedAddressId) || addresses[0];
        state.selectedAddressId = state.selectedAddress.id;
      }

      let html = '<div class="checkout-address-grid">';
      addresses.forEach(addr => {
        const isSelected = addr.id === state.selectedAddressId;
        const isDefault = Boolean(addr.is_default);

        html += `
          <div class="checkout-address-option ${isSelected ? 'selected' : ''}" data-id="${addr.id}">
            <div>
              <div class="checkout-option-header">
                <div class="address-pills">
                  <span class="address-pill">${escapeHtml(addr.address_label || 'Home')}</span>
                  ${isDefault ? '<span class="address-pill address-pill-default">Default</span>' : ''}
                </div>
                <div class="checkout-radio-indicator"></div>
              </div>
              <h3 class="address-recipient-name" style="font-size: 16px;">${escapeHtml(addr.full_name)}</h3>
              <div class="address-phone" style="font-size: 12px; margin-bottom: 6px;">
                ${escapeHtml(addr.phone)}
              </div>
              <div class="address-text" style="font-size: 12px; margin-bottom: 0;">
                ${escapeHtml(addr.address_line_1)}, ${escapeHtml(addr.city)} — ${escapeHtml(addr.postal_code)}
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';

      addressesContainer.innerHTML = html;

      // Click listener on cards
      addressesContainer.querySelectorAll('.checkout-address-option').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          state.selectedAddressId = id;
          state.selectedAddress = addresses.find(a => a.id === id);
          
          addressesContainer.querySelectorAll('.checkout-address-option').forEach(c => {
            c.classList.toggle('selected', c.dataset.id === id);
          });
          updateAddressContinueButton();
        });
      });

      updateAddressContinueButton();
    } catch (err) {
      addressesContainer.innerHTML = `<div class="auth-alert error" style="display:block;">Failed to load addresses: ${escapeHtml(err.message)}</div>`;
    }
  }

  function updateAddressContinueButton() {
    const btn = document.getElementById('btn-step1-continue');
    if (btn) {
      btn.disabled = !state.selectedAddressId;
    }
  }

  /**
   * Render Sidebar Order Summary
   */
  function renderOrderSummary() {
    const itemsContainer = document.getElementById('checkout-items-summary');
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    const cartState = window.MB_CART ? window.MB_CART.getState() : { items: [], subtotal: 0 };
    const items = cartState.items || [];
    const subtotal = cartState.subtotal || 0;
    const shippingFee = getShippingFee(subtotal);
    state.shippingFee = shippingFee;

    const payments = getPaymentSettings();
    const codFee = (state.paymentMethod === 'COD' && payments.cod?.enabled !== false && Number(payments.cod?.fee) > 0)
      ? Number(payments.cod.fee)
      : 0;

    const total = subtotal + shippingFee + codFee;

    if (itemsContainer) {
      itemsContainer.innerHTML = items.map(item => `
        <div class="checkout-mini-item">
          <img src="${item.image && !item.image.includes('assets/images/') ? item.image : 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'}" alt="${escapeHtml(item.name)}" />
          <div class="checkout-mini-details">
            <div class="checkout-mini-name">${escapeHtml(item.name)}</div>
            <div class="checkout-mini-meta">Qty: ${item.quantity || 1} ${item.size ? `&bull; Size: ${escapeHtml(item.size)}` : ''}</div>
            <div class="checkout-mini-price">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (shippingEl) shippingEl.textContent = shippingFee === 0 ? 'Complimentary' : `₹${shippingFee.toLocaleString('en-IN')}`;
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  }

  /**
   * Switch Active Wizard Step (1, 2, 3, 4)
   */
  function updateStepView(newStep) {
    state.step = newStep;

    // Update Stepper UI
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`stepper-item-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active', 'completed');
        if (i < newStep) {
          stepEl.classList.add('completed');
          const numEl = stepEl.querySelector('.checkout-step-num');
          if (numEl) numEl.innerHTML = '&#10003;';
        } else if (i === newStep) {
          stepEl.classList.add('active');
          const numEl = stepEl.querySelector('.checkout-step-num');
          if (numEl) numEl.textContent = i;
        } else {
          const numEl = stepEl.querySelector('.checkout-step-num');
          if (numEl) numEl.textContent = i;
        }
      }
    }

    // Toggle panels
    document.querySelectorAll('.checkout-step-panel').forEach(panel => {
      panel.classList.remove('is-active');
    });

    const activePanel = document.getElementById(`checkout-panel-step${newStep}`);
    if (activePanel) {
      activePanel.classList.add('is-active');
    }

    // When advancing to Step 2 or 3, populate completed summaries
    if (newStep === 2 || newStep === 3) {
      renderCompletedStepSummaries();
    }

    if (newStep === 3) {
      configurePaymentOptions();
      renderOrderSummary();
    }

    // Scroll to top of panel smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function configurePaymentOptions() {
    const payments = getPaymentSettings();
    const cartState = window.MB_CART ? window.MB_CART.getState() : { items: [], subtotal: 0 };
    const subtotal = cartState.subtotal || 0;

    const rzpItem = document.querySelector('.payment-method-item[data-method="RAZORPAY"]');
    const ppeItem = document.querySelector('.payment-method-item[data-method="PHONEPE"]');
    const codItem = document.querySelector('.payment-method-item[data-method="COD"]');

    if (rzpItem) {
      if (payments.razorpay && payments.razorpay.enabled === false) {
        rzpItem.style.display = 'none';
      } else {
        rzpItem.style.display = 'flex';
      }
    }

    if (ppeItem) {
      if (payments.phonepe && payments.phonepe.enabled === false) {
        ppeItem.style.display = 'none';
      } else {
        ppeItem.style.display = 'flex';
      }
    }

    if (codItem) {
      const cod = payments.cod || { enabled: true, maxOrderValue: 5000, fee: 0 };
      if (cod.enabled === false) {
        codItem.style.display = 'none';
      } else {
        codItem.style.display = 'flex';
        const maxVal = Number(cod.maxOrderValue) || 5000;
        const subText = codItem.querySelector('.payment-method-sub');
        if (subtotal > maxVal) {
          codItem.classList.add('disabled');
          codItem.style.opacity = '0.55';
          codItem.style.cursor = 'not-allowed';
          if (subText) subText.innerHTML = `<span style="color: #c0392b;">COD unavailable for orders above ₹${maxVal.toLocaleString('en-IN')}. Please select online payment.</span>`;
        } else {
          codItem.classList.remove('disabled');
          codItem.style.opacity = '1';
          codItem.style.cursor = 'pointer';
          const fee = Number(cod.fee) || 0;
          if (subText) subText.textContent = fee > 0 
            ? `Pay upon physical delivery (+₹${fee} handling surcharge)`
            : 'Pay via cash, UPI, or card upon physical delivery';
        }
      }
    }

    // Ensure selected payment method is valid and available
    const availableItems = Array.from(document.querySelectorAll('.payment-method-item')).filter(
      item => item.style.display !== 'none' && !item.classList.contains('disabled')
    );
    const isCurrentValid = availableItems.some(item => item.dataset.method === state.paymentMethod);
    if (!isCurrentValid && availableItems.length > 0) {
      state.paymentMethod = availableItems[0].dataset.method;
    }
    document.querySelectorAll('.payment-method-item').forEach(c => {
      c.classList.toggle('selected', c.dataset.method === state.paymentMethod && c.style.display !== 'none' && !c.classList.contains('disabled'));
    });
  }

  function renderCompletedStepSummaries() {
    // Address summary preview
    const addr = state.selectedAddress;
    const addrSummaryText = addr 
      ? `Deliver to <strong>${escapeHtml(addr.full_name)}</strong> — ${escapeHtml(addr.address_line_1)}, ${escapeHtml(addr.city)} (${escapeHtml(addr.postal_code)})`
      : 'No address selected';

    const step2AddrSummary = document.getElementById('step2-address-summary');
    if (step2AddrSummary) step2AddrSummary.innerHTML = addrSummaryText;

    const step3AddrSummary = document.getElementById('step3-address-summary');
    if (step3AddrSummary) step3AddrSummary.innerHTML = addrSummaryText;
  }

  /**
   * Place Order & Take Immutable Shipping Address Snapshot
   */
  async function placeOrder() {
    const user = getAuthUser();
    if (!user) throw new Error('You must be signed in to place an order.');
    if (!state.selectedAddress) throw new Error('A valid delivery address is strictly required.');

    const cartState = window.MB_CART ? window.MB_CART.getState() : { items: [], subtotal: 0 };
    if (!cartState.items || cartState.items.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }

    const subtotal = cartState.subtotal;
    const shippingFee = getShippingFee(subtotal);
    const payments = getPaymentSettings();
    const codFee = (state.paymentMethod === 'COD' && payments.cod?.enabled !== false && Number(payments.cod?.fee) > 0)
      ? Number(payments.cod.fee)
      : 0;
    const totalAmount = subtotal + shippingFee + codFee;
    const orderNumber = 'MB-' + Math.floor(1000 + Math.random() * 9000);

    // Validate payment constraints
    if (state.paymentMethod === 'COD') {
      const cod = payments.cod || { enabled: true, maxOrderValue: 5000 };
      if (cod.enabled === false) {
        throw new Error('Cash on Delivery is currently disabled by store policy. Please select an online payment method.');
      }
      if (subtotal > (Number(cod.maxOrderValue) || 5000)) {
        throw new Error(`Order subtotal exceeds the Cash on Delivery limit of ₹${(Number(cod.maxOrderValue) || 5000).toLocaleString('en-IN')}. Please pay online.`);
      }
    } else if (state.paymentMethod === 'RAZORPAY') {
      if (payments.razorpay && payments.razorpay.enabled === false) {
        throw new Error('Razorpay gateway is currently unavailable.');
      }
    } else if (state.paymentMethod === 'PHONEPE') {
      if (payments.phonepe && payments.phonepe.enabled === false) {
        throw new Error('PhonePe gateway is currently unavailable.');
      }
    }

    // CRITICAL: Immutable Address Snapshot
    const addr = state.selectedAddress;
    const orderRecord = {
      order_number: orderNumber,
      auth_user_id: user.id,
      customer_id: null,
      selected_address_id: addr.id,
      shipping_full_name: addr.full_name,
      shipping_phone: addr.phone,
      shipping_address_line_1: addr.address_line_1,
      shipping_address_line_2: addr.address_line_2 || '',
      shipping_landmark: addr.landmark || '',
      shipping_city: addr.city,
      shipping_state: addr.state,
      shipping_postal_code: addr.postal_code,
      shipping_country: addr.country || 'India',
      subtotal: subtotal,
      shipping_fee: shippingFee,
      discount_amount: 0,
      total_amount: totalAmount,
      status: 'PROCESSING',
      payment_method: state.paymentMethod,
      payment_status: state.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      timeline: [
        {
          status: 'ORDER_PLACED',
          title: 'Order Placed',
          description: 'Your order was received and confirmed by the atelier.',
          timestamp: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const orderItems = cartState.items.map(item => ({
      product_id: item.id || item.variantId || 'mb_item',
      product_name: item.name,
      sku: item.sku || `MB-${(item.name || '').substring(0, 3).toUpperCase()}`,
      size: item.size || 'Regular',
      color: item.color || 'Signature',
      quantity: item.quantity || 1,
      unit_price: item.price,
      total_price: (item.price || 0) * (item.quantity || 1),
      image_url: item.image || ''
    }));

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const liveOrderRecord = {
          order_number: orderNumber,
          user_id: user.id,
          address_id: (addr.id && addr.id.length > 20) ? addr.id : null,
          shipping_address: {
            full_name: addr.full_name,
            phone: addr.phone,
            address_line_1: addr.address_line_1 || addr.address_line1 || '',
            address_line_2: addr.address_line_2 || addr.address_line2 || '',
            landmark: addr.landmark || '',
            city: addr.city,
            state: addr.state,
            postal_code: addr.postal_code || addr.pin_code || '',
            country: addr.country || 'India'
          },
          subtotal: subtotal,
          discount_amount: 0,
          total_amount: totalAmount,
          order_status: 'PROCESSING',
          payment_method: state.paymentMethod,
          payment_status: state.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          notes: ''
        };

        const { data: createdOrder, error: orderErr } = await supabase
          .from('orders')
          .insert(liveOrderRecord)
          .select()
          .single();

        if (orderErr) throw orderErr;

        const liveItemsWithOrderId = cartState.items.map(item => ({
          order_id: createdOrder.id,
          product_id: (item.id && item.id.length > 20) ? item.id : null,
          product_name: item.name || 'Marsh Barbary Item',
          size: item.size || 'Regular',
          color: item.color || 'Signature',
          quantity: item.quantity || 1,
          unit_price: item.price
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(liveItemsWithOrderId);

        if (itemsErr) console.warn('[MB_CHECKOUT] Items insert warning:', itemsErr);

        state.order = {
          ...orderRecord,
          id: createdOrder.id,
          order_number: createdOrder.order_number,
          items: orderItems
        };
      } catch (err) {
        console.warn('[MB_CHECKOUT] Live order placement failed, falling back to local store:', err);
        state.order = saveDevOrder(orderRecord, orderItems);
      }
    } else {
      state.order = saveDevOrder(orderRecord, orderItems);
    }

    // Clear cart shopping bag
    if (window.MB_CART) {
      window.MB_CART.clearCart();
    }

    // Render Confirmation Screen
    renderConfirmationView();
    updateStepView(4);
  }

  function saveDevOrder(orderRecord, items) {
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 10);
    const createdOrder = {
      id: orderId,
      ...orderRecord,
      items: items.map(i => ({ ...i, id: 'item_' + Math.random().toString(36).substring(2, 10), order_id: orderId }))
    };

    try {
      const existingRaw = localStorage.getItem('mb_dev_orders');
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(createdOrder);
      localStorage.setItem('mb_dev_orders', JSON.stringify(list));
    } catch (e) {}

    return createdOrder;
  }

  /**
   * Render Step 4 Order Confirmation
   */
  function renderConfirmationView() {
    const o = state.order;
    if (!o) return;

    // Hide summary sidebar on confirmation for focused editorial presentation
    const summaryCol = document.getElementById('checkout-sidebar-summary');
    if (summaryCol) summaryCol.style.display = 'none';

    const layout = document.querySelector('.checkout-layout');
    if (layout) layout.style.gridTemplateColumns = '1fr';

    const confirmContainer = document.getElementById('order-confirmation-content');
    if (confirmContainer) {
      const itemsListHtml = (o.items || []).map(i => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #FAF8F5; font-size: 13px;">
          <span>${escapeHtml(i.product_name)} &times; ${i.quantity}</span>
          <strong>₹${Number(i.total_price).toLocaleString('en-IN')}</strong>
        </div>
      `).join('');

      confirmContainer.innerHTML = `
        <div class="order-success-hero">
          <div class="order-success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="auth-kicker">ORDER CONFIRMED</span>
          <h1 class="account-section-title" style="font-size: 28px; margin: 8px 0 6px 0;">Thank You for Your Order</h1>
          <p class="account-section-desc" style="max-width: 460px; margin: 0 auto 14px auto;">
            We have received your acquisition. Our master artisans are now preparing your pieces with bespoke atelier care.
          </p>
          <div class="order-success-number">ORDER NUMBER: ${escapeHtml(o.order_number)}</div>
        </div>

        <div class="order-snapshot-grid">
          <div class="order-snapshot-card">
            <h4>Delivery Address Snapshot</h4>
            <p>
              <strong>${escapeHtml(o.shipping_full_name)}</strong><br>
              Phone: ${escapeHtml(o.shipping_phone)}<br>
              ${escapeHtml(o.shipping_address_line_1)}<br>
              ${o.shipping_address_line_2 ? `${escapeHtml(o.shipping_address_line_2)}<br>` : ''}
              ${o.shipping_landmark ? `Landmark: ${escapeHtml(o.shipping_landmark)}<br>` : ''}
              ${escapeHtml(o.shipping_city)}, ${escapeHtml(o.shipping_state)} — ${escapeHtml(o.shipping_postal_code)}<br>
              ${escapeHtml(o.shipping_country)}
            </p>
          </div>

          <div class="order-snapshot-card">
            <h4>Payment & Delivery Method</h4>
            <p>
              <strong>Payment Method:</strong> ${escapeHtml(o.payment_method)}<br>
              <strong>Payment Status:</strong> ${escapeHtml(o.payment_status)}<br>
              <strong>Delivery Service:</strong> Complimentary Express Atelier Delivery<br>
              <strong>Estimated Arrival:</strong> 3–7 business days
            </p>
          </div>
        </div>

        <div class="account-card" style="margin-bottom: 28px; padding: 24px;">
          <h4 style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #8C827A; margin: 0 0 14px 0; border-bottom: 1px solid #EFEAE4; padding-bottom: 8px;">Order Details</h4>
          ${itemsListHtml}
          <div style="display: flex; justify-content: space-between; padding-top: 14px; margin-top: 10px; border-top: 1px solid #EFEAE4; font-size: 15px; font-weight: 600;">
            <span>Total Amount Paid / Due</span>
            <span style="color: var(--color-accent-terracotta, #B47154);">₹${Number(o.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="account/orders.html" class="auth-btn-primary">
            <span>View in My Orders &rarr;</span>
          </a>
          <a href="shop.html" class="auth-btn-secondary">
            <span>Continue Shopping</span>
          </a>
        </div>
      `;
    }
  }

  function setupEventListeners() {
    // Step 1 -> Step 2
    const step1Btn = document.getElementById('btn-step1-continue');
    if (step1Btn) {
      step1Btn.addEventListener('click', () => {
        if (!state.selectedAddressId) {
          alert('Please select or add a delivery address to proceed.');
          return;
        }
        updateStepView(2);
      });
    }

    // Step 2 -> Step 3
    const step2Btn = document.getElementById('btn-step2-continue');
    if (step2Btn) {
      step2Btn.addEventListener('click', () => {
        updateStepView(3);
      });
    }

    // Change address button in Step 2 / Step 3
    document.querySelectorAll('.btn-change-address').forEach(btn => {
      btn.addEventListener('click', () => {
        updateStepView(1);
      });
    });

    // Payment method selector
    document.querySelectorAll('.payment-method-item').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        const method = card.dataset.method;
        state.paymentMethod = method;
        document.querySelectorAll('.payment-method-item').forEach(c => {
          c.classList.toggle('selected', c.dataset.method === method);
        });
        renderOrderSummary();
      });
    });

    // Place Order button
    const placeOrderBtn = document.getElementById('btn-place-order');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', async () => {
        try {
          placeOrderBtn.disabled = true;
          placeOrderBtn.querySelector('span').textContent = 'Securing Acquisition...';
          await placeOrder();
        } catch (err) {
          alert(err.message || 'Failed to place order. Please verify your address and cart.');
          placeOrderBtn.disabled = false;
          placeOrderBtn.querySelector('span').textContent = 'Place Order &rarr;';
        }
      });
    }

    // Modal Add Address from Checkout
    const addAddressBtn = document.getElementById('btn-checkout-add-address');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', () => openAddressModal());
    }
  }

  function openAddressModal() {
    const modal = document.getElementById('checkout-address-modal');
    if (!modal) return;
    document.getElementById('checkout-address-form').reset();
    if (window.MB_INDIA) {
      window.MB_INDIA.populateStateSelect('checkout-addr-state', '');
    }
    modal.classList.add('is-active');
  }

  function closeAddressModal() {
    const modal = document.getElementById('checkout-address-modal');
    if (modal) modal.classList.remove('is-active');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    getState: () => state,
    closeAddressModal,
    loadAndRenderAddresses
  };
})();
