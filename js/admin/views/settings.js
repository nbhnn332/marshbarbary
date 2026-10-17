/**
 * MARSH BARBARY — ADMIN VIEW: SETTINGS (js/admin/views/settings.js)
 * Unified Settings Management Console:
 * Tab 1: Store & Brand Profile
 * Tab 2: Payment Gateways (Razorpay, PhonePe, COD)
 * Tab 3: Shipping, Logistics & Taxes
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.settings = {
  title: 'Settings',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const auth = window.MB_ADMIN_AUTH;
    const canManagePayments = auth?.can('manage_payment_settings');
    const canManageSettings = auth?.can('manage_settings');

    const [storeSettings, paymentConfig] = await Promise.all([
      service.getStoreSettings(),
      service.getPaymentSettings()
    ]);

    const activeTab = params.tab || 'brand';
    const rzp = paymentConfig.razorpay || {};
    const ppe = paymentConfig.phonepe || {};
    const cod = paymentConfig.cod || {};

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--admin-font-serif, 'Cormorant Garamond', serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--admin-text-primary);">
            Settings & Store Configuration
          </h1>
          <p style="font-size: 13px; color: var(--admin-text-muted); margin: 0;">
            Manage brand identity, Indian payment gateways, shipping thresholds, and tax policies.
          </p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="admin-tabs" style="margin-bottom: 24px;">
        <button class="admin-tab-btn ${activeTab === 'brand' ? 'active' : ''}" data-tab="brand">
          Store & Brand Profile
        </button>
        <button class="admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}" data-tab="payments">
          Payment Gateways
        </button>
        <button class="admin-tab-btn ${activeTab === 'shipping' ? 'active' : ''}" data-tab="shipping">
          Shipping & Policies
        </button>
        <button class="admin-tab-btn ${activeTab === 'database' ? 'active' : ''}" data-tab="database">
          Database &amp; Supabase
        </button>
      </div>

      <!-- TAB 1: STORE & BRAND PROFILE -->
      <div id="tab-content-brand" class="settings-tab-pane" style="${activeTab === 'brand' ? 'display: block;' : 'display: none;'}">
        <form id="store-profile-form">
          <div class="admin-grid admin-grid-2">
            
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px; color: var(--admin-text-primary);">
                Brand Identity & Atelier Details
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-name">Store Name</label>
                <input type="text" id="st-name" class="admin-input" value="${storeSettings.storeName || 'MARSH BARBARY'}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-tagline">Brand Tagline</label>
                <input type="text" id="st-tagline" class="admin-input" value="${storeSettings.tagline || 'Elegance in Pure Modesty • Sustainable Atelier'}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-gstin">GSTIN / Tax Registration Number</label>
                <input type="text" id="st-gstin" class="admin-input" value="${storeSettings.gstin || '27AABCM8821K1ZM'}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-address">Physical Atelier Address</label>
                <textarea id="st-address" class="admin-textarea" rows="3">${storeSettings.address || '14 Atelier Lane, Kala Ghoda, Fort, Mumbai, Maharashtra 400001'}</textarea>
              </div>
            </div>

            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px; color: var(--admin-text-primary);">
                Concierge Contact & Support Channels
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-email">Client Support Email</label>
                <input type="email" id="st-email" class="admin-input" value="${storeSettings.supportEmail || 'concierge@marshbarbary.com'}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-phone">Concierge WhatsApp / Phone</label>
                <input type="text" id="st-phone" class="admin-input" value="${storeSettings.supportPhone || '+91 98200 12345'}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-hours">Support Operating Hours</label>
                <input type="text" id="st-hours" class="admin-input" value="${storeSettings.supportHours || 'Mon - Sat, 10:00 AM - 7:00 PM IST'}">
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--admin-border-subtle); display: flex; justify-content: flex-end;">
                <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm" ${!canManageSettings ? 'disabled' : ''}>
                  Save Brand Settings
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <!-- TAB 2: PAYMENT GATEWAYS -->
      <div id="tab-content-payments" class="settings-tab-pane" style="${activeTab === 'payments' ? 'display: block;' : 'display: none;'}">
        ${!canManagePayments ? `
          <div style="padding: 12px 16px; background-color: #FFF9E6; border-left: 3px solid #8C5B23; border-radius: var(--admin-radius-sm); margin-bottom: 20px; font-size: 12.5px; color: #5C3D16;">
            <strong>Restricted Access:</strong> Only Super Admins can alter live payment gateway credentials and API keys.
          </div>
        ` : ''}

        <form id="payments-form">
          <div class="admin-grid admin-grid-2">
            
            <!-- Razorpay -->
            <div class="admin-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--admin-border-subtle);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 600; font-size: 15px; color: var(--admin-text-primary);">Razorpay Gateway</span>
                  <span class="admin-badge admin-badge-success">Cards & UPI</span>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" id="rzp-enabled" ${rzp.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                  Active
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="rzp-env">Environment Mode</label>
                <select id="rzp-env" class="admin-select" ${!canManagePayments ? 'disabled' : ''}>
                  <option value="test" ${rzp.mode === 'test' ? 'selected' : ''}>Test Sandbox (rzp_test_...)</option>
                  <option value="live" ${rzp.mode === 'live' ? 'selected' : ''}>Live Production (rzp_live_...)</option>
                </select>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="rzp-key">Key ID (Public API Key)</label>
                <input type="text" id="rzp-key" class="admin-input" value="${rzp.keyId || 'rzp_test_mbAtelier9102'}" ${!canManagePayments ? 'disabled' : ''}>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="rzp-secret">Key Secret (Masked)</label>
                <input type="password" id="rzp-secret" class="admin-input" value="••••••••••••••••••••••••" ${!canManagePayments ? 'disabled' : ''} placeholder="••••••••••••••••">
                <div style="font-size: 10px; color: var(--admin-text-muted); margin-top: 4px;">Protected via Supabase Vault in production</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="rzp-webhook">Webhook Verification Secret</label>
                <input type="password" id="rzp-webhook" class="admin-input" value="••••••••••••••••" ${!canManagePayments ? 'disabled' : ''}>
              </div>
            </div>

            <!-- PhonePe -->
            <div class="admin-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--admin-border-subtle);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-weight: 600; font-size: 15px; color: var(--admin-text-primary);">PhonePe Gateway</span>
                  <span class="admin-badge admin-badge-info">Direct UPI</span>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" id="ppe-enabled" ${ppe.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                  Active
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="ppe-mid">Merchant ID (MID)</label>
                <input type="text" id="ppe-mid" class="admin-input" value="${ppe.merchantId || 'MERCHANTUAT'}" ${!canManagePayments ? 'disabled' : ''}>
              </div>

              <div class="admin-grid admin-grid-2">
                <div class="admin-form-group">
                  <label class="admin-label" for="ppe-salt-key">Salt Key (Masked)</label>
                  <input type="password" id="ppe-salt-key" class="admin-input" value="••••••••••••••••••••" ${!canManagePayments ? 'disabled' : ''}>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="ppe-salt-idx">Salt Index</label>
                  <input type="number" id="ppe-salt-idx" class="admin-input" value="${ppe.saltIndex || 1}" ${!canManagePayments ? 'disabled' : ''}>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="ppe-url">API Endpoint URL</label>
                <input type="text" id="ppe-url" class="admin-input" value="${ppe.endpointUrl || 'https://api-preprod.phonepe.com/apis/pg-sandbox'}" ${!canManagePayments ? 'disabled' : ''}>
              </div>
            </div>

            <!-- Cash on Delivery -->
            <div class="admin-card" style="grid-column: span 2;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--admin-border-subtle);">
                <div style="font-weight: 600; font-size: 15px; color: var(--admin-text-primary);">
                  Cash on Delivery (COD) Rules
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" id="cod-enabled" ${cod.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                  Enable COD at Checkout
                </label>
              </div>

              <div class="admin-grid admin-grid-3">
                <div class="admin-form-group">
                  <label class="admin-label" for="cod-max">Maximum COD Order Ceiling (₹)</label>
                  <input type="number" id="cod-max" class="admin-input" value="${cod.maxOrderValue || 5000}" ${!canManagePayments ? 'disabled' : ''}>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="cod-fee">COD Handling Convenience Surcharge (₹)</label>
                  <input type="number" id="cod-fee" class="admin-input" value="${cod.fee || 0}" ${!canManagePayments ? 'disabled' : ''}>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="cod-otp">Phone OTP Verification</label>
                  <select id="cod-otp" class="admin-select" ${!canManagePayments ? 'disabled' : ''}>
                    <option value="true" ${cod.requireOtpVerification ? 'selected' : ''}>Required before dispatch</option>
                    <option value="false" ${!cod.requireOtpVerification ? 'selected' : ''}>Optional</option>
                  </select>
                </div>
              </div>

              <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
                <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm" ${!canManagePayments ? 'disabled' : ''}>
                  Save Payment Gateways
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <!-- TAB 3: SHIPPING, LOGISTICS & TAXES -->
      <div id="tab-content-shipping" class="settings-tab-pane" style="${activeTab === 'shipping' ? 'display: block;' : 'display: none;'}">
        <form id="shipping-policy-form">
          <div class="admin-grid admin-grid-2">
            
            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px; color: var(--admin-text-primary);">
                Shipping & Logistics Rules
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-free-ship">Free Shipping Minimum Spend (₹)</label>
                <input type="number" id="st-free-ship" class="admin-input" value="${storeSettings.freeShippingThreshold || 2999}">
                <div style="font-size: 10px; color: var(--admin-text-muted); margin-top: 4px;">Orders equal to or above this qualify for complimentary courier delivery</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-ship-fee">Standard Flat Shipping Fee (₹)</label>
                <input type="number" id="st-ship-fee" class="admin-input" value="${storeSettings.flatShippingFee || 150}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-ret-window">Returns & Exchanges Window (Days)</label>
                <input type="number" id="st-ret-window" class="admin-input" value="${storeSettings.returnWindowDays || 7}">
              </div>
            </div>

            <div class="admin-card">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px; color: var(--admin-text-primary);">
                Taxation & Regional Preferences
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-gst">Apparel GST Rate (%)</label>
                <input type="number" id="st-gst" class="admin-input" value="${storeSettings.gstTaxRate || 12}">
                <div style="font-size: 10px; color: var(--admin-text-muted); margin-top: 4px;">Indian standard 12% GST applied across modest apparel line</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="st-curr">Default Store Currency</label>
                <input type="text" id="st-curr" class="admin-input" value="INR (₹)" disabled>
              </div>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--admin-border-subtle); display: flex; justify-content: flex-end;">
                <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm" ${!canManageSettings ? 'disabled' : ''}>
                  Save Shipping Policies
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <!-- TAB 4: DATABASE & SUPABASE INTEGRATION -->
      <div id="tab-content-database" class="settings-tab-pane" style="${activeTab === 'database' ? 'display: block;' : 'display: none;'}">
        <div class="admin-grid admin-grid-2">
          
          <div class="admin-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--admin-border-subtle);">
              <div style="font-weight: 600; font-size: 14px; color: var(--admin-text-primary);">
                Supabase Project Connection
              </div>
              <span id="sb-conn-badge" class="admin-badge ${window.MB_SUPABASE_CONFIG?.isLiveConfigured() ? 'admin-badge-success' : 'admin-badge-warning'}">
                ${window.MB_SUPABASE_CONFIG?.isLiveConfigured() ? 'Live Connected' : 'Simulated Development Mode'}
              </span>
            </div>

            <p style="font-size: 12.5px; color: var(--admin-text-muted); line-height: 1.5; margin-bottom: 16px;">
              Connect your live Supabase cloud PostgreSQL database to power customer authentication, RLS profiles, saved delivery addresses, and real order snapshots.
            </p>

            <form id="supabase-config-form">
              <div class="admin-form-group">
                <label class="admin-label" for="sb-url">Supabase Project URL *</label>
                <input type="url" id="sb-url" class="admin-input" placeholder="https://your-project.supabase.co" value="${window.MB_SUPABASE_CONFIG?.isLiveConfigured() ? window.MB_SUPABASE_CONFIG.url : (localStorage.getItem('mb_supabase_url') || '')}" required>
                <div style="font-size: 11px; color: var(--admin-text-muted); margin-top: 4px;">Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project URL</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="sb-anon-key">Supabase Public Anon Key *</label>
                <textarea id="sb-anon-key" class="admin-textarea" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required>${window.MB_SUPABASE_CONFIG?.isLiveConfigured() ? window.MB_SUPABASE_CONFIG.anonKey : (localStorage.getItem('mb_supabase_anon_key') || '')}</textarea>
                <div style="font-size: 11px; color: var(--admin-text-muted); margin-top: 4px;">Found in Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys (anon public)</div>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="button" id="btn-test-supabase" class="admin-btn admin-btn-outline admin-btn-sm">
                  Test Connection
                </button>
                <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm" ${!canManageSettings ? 'disabled' : ''}>
                  Save &amp; Connect Supabase
                </button>
              </div>

              <div id="sb-test-result" style="margin-top: 14px; font-size: 12px; display: none;"></div>
            </form>
          </div>

          <div class="admin-card">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 16px; color: var(--admin-text-primary);">
              SQL Migrations &amp; Database Architecture
            </div>

            <p style="font-size: 12.5px; color: var(--admin-text-secondary); line-height: 1.5; margin-bottom: 14px;">
              Before or after entering your credentials, run the prepared schema migrations in your Supabase SQL Editor:
            </p>

            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12px;">
              <div style="padding: 10px 12px; background: var(--admin-bg-page); border: 1px solid var(--admin-border-subtle); border-radius: var(--admin-radius-sm);">
                <div style="font-weight: 600; color: var(--admin-text-primary);">1. Customer Auth &amp; Profiles</div>
                <div style="color: var(--admin-text-muted); font-size: 11px; margin: 2px 0 6px 0;">Creates <code>customer_profiles</code> table, sign-up trigger, and RLS policies.</div>
                <code style="font-size: 11px; color: var(--admin-accent);">supabase/01_auth_schema.sql</code>
              </div>

              <div style="padding: 10px 12px; background: var(--admin-bg-page); border: 1px solid var(--admin-border-subtle); border-radius: var(--admin-radius-sm);">
                <div style="font-weight: 600; color: var(--admin-text-primary);">2. Saved Delivery Addresses</div>
                <div style="color: var(--admin-text-muted); font-size: 11px; margin: 2px 0 6px 0;">Creates <code>customer_addresses</code> table with Indian states support, single-default trigger, and RLS.</div>
                <code style="font-size: 11px; color: var(--admin-accent);">supabase/02_addresses_schema.sql</code>
              </div>

              <div style="padding: 10px 12px; background: var(--admin-bg-page); border: 1px solid var(--admin-border-subtle); border-radius: var(--admin-radius-sm);">
                <div style="font-weight: 600; color: var(--admin-text-primary);">3. Orders, Snapshotting &amp; Line Items</div>
                <div style="color: var(--admin-text-muted); font-size: 11px; margin: 2px 0 6px 0;">Creates <code>orders</code> and <code>order_items</code> tables with immutable address snapshotting and RLS.</div>
                <code style="font-size: 11px; color: var(--admin-accent);">supabase/03_orders_schema.sql</code>
              </div>
            </div>

            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--admin-border-subtle); font-size: 11.5px; color: var(--admin-text-muted); line-height: 1.5;">
              <strong>Note:</strong> While live keys are not yet entered, the application automatically uses local simulated storage so all storefront and admin features remain functional.
            </div>
          </div>

        </div>
      </div>
    `;

    // Tab switching event handler
    const tabBtns = container.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelectorAll('.settings-tab-pane').forEach(pane => {
          pane.style.display = 'none';
        });
        const targetPane = container.querySelector(`#tab-content-${tab}`);
        if (targetPane) targetPane.style.display = 'block';
      });
    });

    // Form 1: Save Store & Brand Profile
    container.querySelector('#store-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const currentStore = await service.getStoreSettings();
        const updated = {
          ...currentStore,
          storeName: document.getElementById('st-name').value.trim(),
          tagline: document.getElementById('st-tagline').value.trim(),
          gstin: document.getElementById('st-gstin').value.trim(),
          address: document.getElementById('st-address').value.trim(),
          supportEmail: document.getElementById('st-email').value.trim(),
          contactEmail: document.getElementById('st-email').value.trim(),
          supportPhone: document.getElementById('st-phone').value.trim(),
          contactPhone: document.getElementById('st-phone').value.trim(),
          supportHours: document.getElementById('st-hours').value.trim()
        };
        await service.saveStoreSettings(updated);
        window.MB_ADMIN_SHELL.showToast('Brand and atelier profile saved successfully', 'success');
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving brand settings', 'error');
      }
    });

    // Form 2: Save Payments
    if (canManagePayments) {
      container.querySelector('#payments-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const currentPayments = await service.getPaymentSettings();
          const updatedPayments = {
            razorpay: {
              ...(currentPayments.razorpay || {}),
              enabled: document.getElementById('rzp-enabled').checked,
              mode: document.getElementById('rzp-env').value,
              keyId: document.getElementById('rzp-key').value.trim()
            },
            phonepe: {
              ...(currentPayments.phonepe || {}),
              enabled: document.getElementById('ppe-enabled').checked,
              merchantId: document.getElementById('ppe-mid').value.trim(),
              saltIndex: parseInt(document.getElementById('ppe-salt-idx').value, 10) || 1,
              endpointUrl: document.getElementById('ppe-url').value.trim()
            },
            cod: {
              ...(currentPayments.cod || {}),
              enabled: document.getElementById('cod-enabled').checked,
              maxOrderValue: parseFloat(document.getElementById('cod-max').value) || 5000,
              fee: parseFloat(document.getElementById('cod-fee').value) || 0,
              requireOtpVerification: document.getElementById('cod-otp').value === 'true'
            }
          };
          await service.savePaymentSettings(updatedPayments);
          window.MB_ADMIN_SHELL.showToast('Payment gateway preferences saved successfully', 'success');
        } catch (err) {
          window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving payment settings', 'error');
        }
      });
    }

    // Form 3: Save Shipping & Policies
    container.querySelector('#shipping-policy-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const currentStore = await service.getStoreSettings();
        const shipFee = parseFloat(document.getElementById('st-ship-fee').value) || 150;
        const updated = {
          ...currentStore,
          freeShippingThreshold: parseFloat(document.getElementById('st-free-ship').value) || 2999,
          flatShippingFee: shipFee,
          standardShippingFee: shipFee,
          returnWindowDays: parseInt(document.getElementById('st-ret-window').value, 10) || 7,
          gstTaxRate: parseFloat(document.getElementById('st-gst').value) || 12
        };
        await service.saveStoreSettings(updated);
        window.MB_ADMIN_SHELL.showToast('Shipping and tax policies saved successfully', 'success');
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving shipping policies', 'error');
      }
    });

    // Form 4: Test Supabase Connection
    container.querySelector('#btn-test-supabase')?.addEventListener('click', async () => {
      const url = document.getElementById('sb-url').value.trim();
      const anonKey = document.getElementById('sb-anon-key').value.trim();
      const resBox = document.getElementById('sb-test-result');
      resBox.style.display = 'block';

      if (!url || !anonKey) {
        resBox.innerHTML = '<span style="color: #c0392b;">Please enter both Project URL and Anon Key.</span>';
        return;
      }

      resBox.innerHTML = '<span style="color: var(--admin-text-muted);">Testing connection to Supabase database...</span>';

      try {
        const pingUrl = url.replace(/\/$/, '') + '/rest/v1/categories?select=id,name&limit=2';
        const res = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': 'Bearer ' + anonKey
          }
        });

        if (res.status === 401) {
          resBox.innerHTML = '<span style="color: #c0392b; font-weight: 500;">Project URL reached, but Anon Key was rejected (401 Unauthorized). Check your API Key.</span>';
        } else if (res.ok) {
          const sample = await res.json();
          resBox.innerHTML = `<span style="color: #27ae60; font-weight: 600;">✓ Database Connected! Successfully reached Supabase and verified read access (${Array.isArray(sample) ? sample.length : 0} sample categories retrieved).</span>`;
        } else {
          resBox.innerHTML = `<span style="color: #c0392b;">Connection returned status ${res.status}: ${res.statusText}</span>`;
        }
      } catch (err) {
        resBox.innerHTML = `<span style="color: #c0392b;">Connection failed: ${err.message}. Please check your internet connectivity and project URL.</span>`;
      }
    });

    // Form 4: Save & Connect Supabase
    container.querySelector('#supabase-config-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('sb-url').value.trim();
      const anonKey = document.getElementById('sb-anon-key').value.trim();

      try {
        if (window.MB_SUPABASE_CONFIG) {
          window.MB_SUPABASE_CONFIG.setCredentials(url, anonKey);
        } else {
          localStorage.setItem('mb_supabase_url', url);
          localStorage.setItem('mb_supabase_anon_key', anonKey);
        }

        // Update badge
        const badge = document.getElementById('sb-conn-badge');
        if (badge) {
          badge.className = 'admin-badge admin-badge-success';
          badge.textContent = 'Live Connected';
        }

        window.MB_ADMIN_SHELL.showToast('Supabase live credentials saved and connected!', 'success');
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving Supabase configuration', 'error');
      }
    });
  }
};
