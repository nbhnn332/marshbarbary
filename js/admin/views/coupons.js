/**
 * MARSH BARBARY — ADMIN VIEW: COUPONS & PROMOTIONS (js/admin/views/coupons.js)
 * Promotional code creator with threshold controls, discount ceilings, and redemption telemetry.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.coupons = {
  title: 'Promotions & Coupons',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Promotions & Gift Codes
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Issue seasonal privilege codes, percentage incentives, and flat discounts with minimum order thresholds.
          </p>
        </div>
        <div>
          <button id="btn-create-coupon" class="admin-btn admin-btn-primary admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create New Coupon
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Benefit</th>
                <th>Min Spend</th>
                <th>Redemptions</th>
                <th>Expiration</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="coupons-tbody">
              <tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--mb-admin-muted);">Loading promotions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="coupon-modal-mount"></div>
    `;

    async function loadCoupons() {
      const list = await service.getCoupons();
      const tbody = document.getElementById('coupons-tbody');

      tbody.innerHTML = list.map(c => `
        <tr>
          <td>
            <div style="font-weight: 600; font-family: monospace; font-size: 14px; letter-spacing: 0.05em; color: var(--mb-admin-text);">
              ${c.code}
            </div>
            <div style="font-size: 11px; color: var(--mb-admin-muted);">${c.description || ''}</div>
          </td>
          <td style="font-weight: 500;">
            ${c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub);">
            ${c.minOrderValue ? `₹${c.minOrderValue.toLocaleString('en-IN')}` : 'No minimum'}
          </td>
          <td>
            <span class="admin-badge admin-badge-neutral">
              ${c.usedCount || 0} / ${c.usageLimit || '∞'} used
            </span>
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-muted);">
            ${c.expiresAt || 'Never expires'}
          </td>
          <td>
            <span class="admin-badge ${c.status === 'active' ? 'admin-badge-success' : 'admin-badge-neutral'}">
              ${c.status || 'active'}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="admin-btn admin-btn-outline admin-btn-sm btn-edit-cpn" data-id="${c.id}" style="padding: 4px 8px; font-size: 11px;">
                Edit
              </button>
              <button class="admin-btn admin-btn-danger admin-btn-sm btn-del-cpn" data-id="${c.id}" data-code="${c.code}" style="padding: 4px 8px; font-size: 11px;" title="Deactivate coupon">
                &times;
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.btn-edit-cpn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const c = list.find(it => it.id === id);
          if (c) openModal(c);
        });
      });

      tbody.querySelectorAll('.btn-del-cpn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const code = e.target.getAttribute('data-code');
          window.MB_ADMIN_SHELL.confirmModal({
            title: `Revoke ${code}?`,
            message: `Are you sure you want to deactivate and remove coupon "${code}"? Customers will no longer be able to redeem this code at checkout.`,
            confirmText: 'Deactivate Coupon',
            confirmType: 'danger',
            onConfirm: async () => {
              await service.deleteCoupon(id);
              window.MB_ADMIN_SHELL.showToast(`Coupon ${code} revoked`, 'success');
              loadCoupons();
            }
          });
        });
      });
    }

    function openModal(coupon = null) {
      const isNew = !coupon;
      const data = coupon || {
        id: '',
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 2500,
        usageLimit: 100,
        expiresAt: '2026-12-31',
        description: '',
        status: 'active'
      };

      const mount = document.getElementById('coupon-modal-mount');
      mount.innerHTML = `
        <div class="admin-modal-backdrop active">
          <div class="admin-modal" style="max-width: 480px;">
            <div class="admin-modal-header">
              <div class="admin-modal-title">${isNew ? 'Create New Promo Code' : `Edit Coupon: ${data.code}`}</div>
              <button class="admin-modal-close" id="btn-close-cpn">&times;</button>
            </div>
            <form id="coupon-form">
              <div class="admin-modal-body">
                <div class="admin-form-group">
                  <label class="admin-label" for="cpn-code">Coupon Code *</label>
                  <input type="text" id="cpn-code" class="admin-input" required value="${data.code}" placeholder="e.g. SUMMER10" style="text-transform: uppercase;">
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-type">Discount Structure</label>
                    <select id="cpn-type" class="admin-select">
                      <option value="percentage" ${data.discountType === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                      <option value="flat" ${data.discountType === 'flat' ? 'selected' : ''}>Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-val">Benefit Amount *</label>
                    <input type="number" id="cpn-val" class="admin-input" required min="1" value="${data.discountValue}">
                  </div>
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-min">Min Order Spend (₹)</label>
                    <input type="number" id="cpn-min" class="admin-input" min="0" value="${data.minOrderValue || 0}">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-limit">Max Usages Limit</label>
                    <input type="number" id="cpn-limit" class="admin-input" min="1" value="${data.usageLimit || 100}">
                  </div>
                </div>

                <div class="admin-grid admin-grid-2">
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-exp">Valid Through</label>
                    <input type="date" id="cpn-exp" class="admin-input" value="${data.expiresAt || ''}">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="cpn-status">Status</label>
                    <select id="cpn-status" class="admin-select">
                      <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active</option>
                      <option value="paused" ${data.status === 'paused' ? 'selected' : ''}>Paused / Inactive</option>
                    </select>
                  </div>
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="cpn-desc">Staff Note / Description</label>
                  <input type="text" id="cpn-desc" class="admin-input" value="${data.description || ''}" placeholder="e.g. VIP atelier seasonal launch discount">
                </div>
              </div>
              <div class="admin-modal-footer">
                <button type="button" class="admin-btn admin-btn-outline" id="btn-cancel-cpn">Cancel</button>
                <button type="submit" class="admin-btn admin-btn-primary">${isNew ? 'Issue Coupon' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const close = () => { mount.innerHTML = ''; };
      document.getElementById('btn-close-cpn')?.addEventListener('click', close);
      document.getElementById('btn-cancel-cpn')?.addEventListener('click', close);

      document.getElementById('coupon-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          id: data.id || `cpn-${Date.now()}`,
          code: document.getElementById('cpn-code').value.trim().toUpperCase(),
          discountType: document.getElementById('cpn-type').value,
          discountValue: parseFloat(document.getElementById('cpn-val').value) || 0,
          minOrderValue: parseFloat(document.getElementById('cpn-min').value) || 0,
          usageLimit: parseInt(document.getElementById('cpn-limit').value, 10) || 100,
          expiresAt: document.getElementById('cpn-exp').value,
          description: document.getElementById('cpn-desc').value.trim(),
          status: document.getElementById('cpn-status').value
        };

        try {
          await service.saveCoupon(payload);
          window.MB_ADMIN_SHELL.showToast(`Coupon ${payload.code} saved`, 'success');
          close();
          loadCoupons();
        } catch (err) {
          window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving coupon', 'error');
        }
      });
    }

    document.getElementById('btn-create-coupon')?.addEventListener('click', () => openModal());

    await loadCoupons();
  }
};
