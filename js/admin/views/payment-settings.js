/**
 * MARSH BARBARY — ADMIN VIEW: PAYMENT SETTINGS (js/admin/views/payment-settings.js)
 * Gateway configurations for Razorpay, PhonePe, and Cash on Delivery with masked private keys.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.payments = {
  title: 'Payment Gateway Integration',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;
    const auth = window.MB_ADMIN_AUTH;
    const canManagePayments = auth?.can('manage_payment_settings');

    const config = await service.getPaymentSettings();
    const rzp = config.razorpay || {};
    const ppe = config.phonepe || {};
    const cod = config.cod || {};

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Payment Gateways & Dispositions
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Manage Indian payment channels including Razorpay (Cards, UPI, NetBanking), PhonePe, and COD rules.
          </p>
        </div>
        <div>
          ${canManagePayments ? `
            <button id="btn-save-payments" class="admin-btn admin-btn-primary admin-btn-sm">
              Save Payment Settings
            </button>
          ` : `
            <span class="admin-badge admin-badge-warning">Super Admin Required</span>
          `}
        </div>
      </div>

      <!-- Security Guidance Alert -->
      <div style="padding: 14px 18px; background: #FAF5EB; border-left: 3px solid var(--mb-admin-accent); border-radius: 4px; margin-bottom: 24px; font-size: 12px; color: var(--mb-admin-text); line-height: 1.5;">
        <strong>Cryptographic Security Architecture:</strong> Secret keys and HMAC salts are securely masked in the browser client. In the production deployment phase, backend server signatures and webhook validations are processed exclusively via isolated Supabase Edge Functions with environment secret variables.
      </div>

      <form id="payments-form">
        <div class="admin-grid admin-grid-2">
          
          <!-- Razorpay Configuration -->
          <div class="admin-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; font-size: 15px; color: var(--mb-admin-text);">Razorpay Gateway</span>
                <span class="admin-badge admin-badge-success">Primary UPI / Cards</span>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="rzp-enabled" ${rzp.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                Enabled
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
              <label class="admin-label" for="rzp-key">Key ID (Public)</label>
              <input type="text" id="rzp-key" class="admin-input" value="${rzp.keyId || 'rzp_test_mbAtelier9102'}" ${!canManagePayments ? 'disabled' : ''}>
            </div>

            <div class="admin-form-group">
              <label class="admin-label" for="rzp-secret">Key Secret (Masked)</label>
              <input type="password" id="rzp-secret" class="admin-input" value="••••••••••••••••••••••••" ${!canManagePayments ? 'disabled' : ''} placeholder="••••••••••••••••">
              <div style="font-size: 10px; color: var(--mb-admin-muted); margin-top: 4px;">Stored in Supabase Vault. Kept confidential.</div>
            </div>

            <div class="admin-form-group">
              <label class="admin-label" for="rzp-webhook">Webhook Verification Secret</label>
              <input type="password" id="rzp-webhook" class="admin-input" value="••••••••••••••••" ${!canManagePayments ? 'disabled' : ''}>
            </div>
          </div>

          <!-- PhonePe Configuration -->
          <div class="admin-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; font-size: 15px; color: var(--mb-admin-text);">PhonePe PG</span>
                <span class="admin-badge admin-badge-info">Direct UPI Flow</span>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="ppe-enabled" ${ppe.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                Enabled
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

          <!-- Cash on Delivery (COD) Rules -->
          <div class="admin-card" style="grid-column: span 2;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="font-weight: 600; font-size: 15px; color: var(--mb-admin-text);">
                Cash on Delivery (COD) Policy & Ceiling
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer;">
                <input type="checkbox" id="cod-enabled" ${cod.enabled ? 'checked' : ''} ${!canManagePayments ? 'disabled' : ''}>
                Offer COD at Checkout
              </label>
            </div>

            <div class="admin-grid admin-grid-3">
              <div class="admin-form-group">
                <label class="admin-label" for="cod-max">Maximum COD Order Amount (INR ₹)</label>
                <input type="number" id="cod-max" class="admin-input" value="${cod.maxOrderValue || 5000}" ${!canManagePayments ? 'disabled' : ''}>
                <div style="font-size: 10px; color: var(--mb-admin-muted); margin-top: 4px;">Orders exceeding this limit require pre-payment</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="cod-fee">COD Handling Convenience Surcharge (₹)</label>
                <input type="number" id="cod-fee" class="admin-input" value="${cod.fee || 0}" ${!canManagePayments ? 'disabled' : ''}>
                <div style="font-size: 10px; color: var(--mb-admin-muted); margin-top: 4px;">Set to ₹0 for complimentary COD</div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="cod-otp">Mandatory Phone OTP Confirmation</label>
                <select id="cod-otp" class="admin-select" ${!canManagePayments ? 'disabled' : ''}>
                  <option value="true" ${cod.requireOtpVerification ? 'selected' : ''}>Required before dispatch</option>
                  <option value="false" ${!cod.requireOtpVerification ? 'selected' : ''}>Standard confirmation</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </form>
    `;

    if (canManagePayments) {
      const saveHandler = async (e) => {
        if (e) e.preventDefault();

        const updated = {
          razorpay: {
            enabled: document.getElementById('rzp-enabled').checked,
            mode: document.getElementById('rzp-env').value,
            keyId: document.getElementById('rzp-key').value.trim()
          },
          phonepe: {
            enabled: document.getElementById('ppe-enabled').checked,
            merchantId: document.getElementById('ppe-mid').value.trim(),
            saltIndex: parseInt(document.getElementById('ppe-salt-idx').value, 10) || 1,
            endpointUrl: document.getElementById('ppe-url').value.trim()
          },
          cod: {
            enabled: document.getElementById('cod-enabled').checked,
            maxOrderValue: parseFloat(document.getElementById('cod-max').value) || 5000,
            fee: parseFloat(document.getElementById('cod-fee').value) || 0,
            requireOtpVerification: document.getElementById('cod-otp').value === 'true'
          }
        };

        try {
          await service.savePaymentSettings(updated);
          window.MB_ADMIN_SHELL.showToast('Payment gateway preferences successfully updated', 'success');
        } catch (err) {
          window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving payment settings', 'error');
        }
      };

      document.getElementById('btn-save-payments')?.addEventListener('click', saveHandler);
      document.getElementById('payments-form')?.addEventListener('submit', saveHandler);
    }
  }
};
