/**
 * MARSH BARBARY — ADMIN VIEW: RETURNS & EXCHANGES (js/admin/views/returns.js)
 * Reverse logistics management, exchange authorizations, and refund dispositions.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.returns = {
  title: 'Returns & Exchanges',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    let activeStatus = urlParams.get('status') || 'all';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Returns & Concierge Exchanges
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Review return claims within the 7-day complimentary exchange window.
          </p>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="admin-tabs" id="return-status-tabs" style="margin-bottom: 20px;">
        <button class="admin-tab-btn ${activeStatus === 'all' ? 'active' : ''}" data-status="all">All Claims</button>
        <button class="admin-tab-btn ${activeStatus === 'PENDING' ? 'active' : ''}" data-status="PENDING">Pending Review</button>
        <button class="admin-tab-btn ${activeStatus === 'APPROVED' ? 'active' : ''}" data-status="APPROVED">Approved</button>
        <button class="admin-tab-btn ${activeStatus === 'REFUNDED' ? 'active' : ''}" data-status="REFUNDED">Refunded</button>
        <button class="admin-tab-btn ${activeStatus === 'REJECTED' ? 'active' : ''}" data-status="REJECTED">Rejected</button>
      </div>

      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order Ref</th>
                <th>Client</th>
                <th>Garment</th>
                <th>Reason</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="returns-tbody">
              <tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">Loading return requests...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    async function loadReturns() {
      const list = await service.getReturns({ status: activeStatus });
      const tbody = document.getElementById('returns-tbody');

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--mb-admin-muted);">No return requests matching this state.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(r => `
        <tr>
          <td>
            <a href="#/returns/${r.returnNumber}" style="font-weight: 600; color: var(--mb-admin-text); text-decoration: none;">
              ${r.returnNumber}
            </a>
          </td>
          <td>
            <a href="#/orders/${r.orderNumber}" style="color: var(--mb-admin-accent); text-decoration: none; font-size: 12px;">
              ${r.orderNumber}
            </a>
          </td>
          <td style="font-size: 13px; font-weight: 500;">
            ${r.customerName}
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub);">
            ${r.productName}
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub); max-width: 200px;">
            ${r.reason}
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-muted);">
            ${r.requestedAt}
          </td>
          <td>
            <span class="admin-badge ${
              r.status === 'APPROVED' ? 'admin-badge-success' :
              r.status === 'REFUNDED' ? 'admin-badge-info' :
              r.status === 'PENDING' ? 'admin-badge-warning' : 'admin-badge-danger'
            }">
              ${r.status}
            </span>
          </td>
          <td style="text-align: right;">
            <a href="#/returns/${r.returnNumber}" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
              Inspect
            </a>
          </td>
        </tr>
      `).join('');
    }

    document.querySelectorAll('#return-status-tabs .admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#return-status-tabs .admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatus = btn.getAttribute('data-status');
        loadReturns();
      });
    });

    await loadReturns();
  }
};

window.MB_ADMIN_VIEWS['return-detail'] = {
  title: 'Return Claim',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const ret = await service.getReturnById(params.id);

    if (!ret) {
      container.innerHTML = `
        <div class="admin-card" style="padding: 48px; text-align: center;">
          <div style="font-family: var(--font-serif); font-size: 20px; color: var(--mb-admin-text); margin-bottom: 8px;">Claim Not Found</div>
          <a href="#/returns" class="admin-btn admin-btn-outline admin-btn-sm">Return to Claims List</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 4px;">
          <a href="#/returns" style="color: inherit; text-decoration: none;">← Back to Return Claims</a>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0; color: var(--mb-admin-text);">
            Return Request: ${ret.returnNumber}
          </h1>
          <span class="admin-badge ${
            ret.status === 'APPROVED' ? 'admin-badge-success' :
            ret.status === 'REFUNDED' ? 'admin-badge-info' :
            ret.status === 'PENDING' ? 'admin-badge-warning' : 'admin-badge-danger'
          }">
            ${ret.status}
          </span>
        </div>
      </div>

      <div class="admin-grid admin-grid-3">
        <!-- Return Details (2 cols) -->
        <div class="admin-card" style="grid-column: span 2;">
          <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">Claim Specifications</div>
          
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 12px;">
              <div>
                <div style="font-size: 11px; color: var(--mb-admin-muted); text-transform: uppercase;">Associated Order</div>
                <div style="font-weight: 500;"><a href="#/orders/${ret.orderNumber}" style="color: var(--mb-admin-accent); text-decoration: none;">${ret.orderNumber}</a></div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--mb-admin-muted); text-transform: uppercase;">Client Name</div>
                <div style="font-weight: 500;">${ret.customerName}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--mb-admin-muted); text-transform: uppercase;">Requested On</div>
                <div style="font-weight: 500;">${ret.requestedAt}</div>
              </div>
            </div>

            <div>
              <div style="font-size: 11px; color: var(--mb-admin-muted); text-transform: uppercase; margin-bottom: 4px;">Garment Being Returned</div>
              <div style="font-size: 14px; font-weight: 500; color: var(--mb-admin-text);">${ret.productName}</div>
            </div>

            <div>
              <div style="font-size: 11px; color: var(--mb-admin-muted); text-transform: uppercase; margin-bottom: 4px;">Client Stated Reason</div>
              <div style="font-size: 13px; color: var(--mb-admin-text-sub); padding: 12px; background: #F8F7F4; border-radius: 4px; border: 1px solid var(--mb-admin-border);">
                ${ret.reason}
              </div>
            </div>

            <form id="return-update-form" style="margin-top: 12px; padding-top: 16px; border-top: 1px solid var(--mb-admin-border);">
              <div style="font-weight: 500; font-size: 13px; margin-bottom: 12px;">Process Disposition</div>
              
              <div class="admin-grid admin-grid-2">
                <div class="admin-form-group">
                  <label class="admin-label" for="ret-new-status">Resolution Decision</label>
                  <select id="ret-new-status" class="admin-select">
                    <option value="PENDING" ${ret.status === 'PENDING' ? 'selected' : ''}>Pending Inspection</option>
                    <option value="APPROVED" ${ret.status === 'APPROVED' ? 'selected' : ''}>Approve & Issue Reverse Pickup</option>
                    <option value="REFUNDED" ${ret.status === 'REFUNDED' ? 'selected' : ''}>Refund Disbursed</option>
                    <option value="REJECTED" ${ret.status === 'REJECTED' ? 'selected' : ''}>Reject Claim</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="ret-notes">Concierge Notes</label>
                  <input type="text" id="ret-notes" class="admin-input" placeholder="e.g. Garment received in pristine unworn condition" value="${ret.adminNotes || ''}">
                </div>
              </div>

              <button type="submit" class="admin-btn admin-btn-primary admin-btn-sm">
                Save Resolution
              </button>
            </form>
          </div>
        </div>

        <!-- Policy Summary (1 col) -->
        <div class="admin-card">
          <div style="font-weight: 500; font-size: 14px; margin-bottom: 12px; color: var(--mb-admin-text);">Atelier Return Policy</div>
          <div style="font-size: 12px; color: var(--mb-admin-text-sub); line-height: 1.6;">
            <p>• Complimentary pickup within 7 days of delivery.</p>
            <p>• Garments must retain original atelier tags, unwashed, unaltered.</p>
            <p>• Refunds are refunded to the original payment source (Razorpay / PhonePe) within 48 hours of return receipt.</p>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#return-update-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('ret-new-status').value;
      const notes = document.getElementById('ret-notes').value.trim();

      try {
        await service.updateReturnStatus(ret.returnNumber, status, notes);
        window.MB_ADMIN_SHELL.showToast(`Claim ${ret.returnNumber} updated to ${status}`, 'success');
        window.MB_ADMIN_VIEWS['return-detail'].render(container, params);
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error updating return', 'error');
      }
    });
  }
};
