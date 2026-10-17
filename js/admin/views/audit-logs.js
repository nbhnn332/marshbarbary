/**
 * MARSH BARBARY — ADMIN VIEW: AUDIT LOGS (js/admin/views/audit-logs.js)
 * Security ledger tracking all mutating operational transactions across the atelier.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['audit-logs'] = {
  title: 'Security & Audit Logs',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Security & Audit Ledger
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Immutable chronologic record of staff access, inventory shifts, and order lifecycle events.
          </p>
        </div>
        <div>
          <button id="btn-export-logs" class="admin-btn admin-btn-outline admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Audit CSV
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="admin-card" style="margin-bottom: 20px; padding: 16px;">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div class="admin-search-wrapper" style="flex: 1; min-width: 240px;">
            <span class="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="search" id="log-search-input" class="admin-input admin-input-search" placeholder="Search by operator, action, entity, or details...">
          </div>

          <div style="width: 220px;">
            <select id="log-filter-action" class="admin-select">
              <option value="all">All Event Types</option>
              <option value="ORDER_STATUS_UPDATED">Order Status Updated</option>
              <option value="PRODUCT_UPDATED">Product Updated</option>
              <option value="PRODUCT_CREATED">Product Created</option>
              <option value="STOCK_ADJUSTED">Stock Adjusted</option>
              <option value="COUPON_CREATED">Coupon Created</option>
              <option value="PAYMENT_SETTINGS_UPDATED">Payment Settings</option>
              <option value="LOGIN">Admin Login</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 160px;">Timestamp</th>
                <th>Operator</th>
                <th>Action Type</th>
                <th>Target Entity</th>
                <th>Log Description</th>
              </tr>
            </thead>
            <tbody id="logs-tbody">
              <tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">Loading audit trail...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    async function loadLogs() {
      const search = document.getElementById('log-search-input')?.value || '';
      const action = document.getElementById('log-filter-action')?.value || 'all';

      const logs = await service.getAuditLogs({ search, action });
      const tbody = document.getElementById('logs-tbody');

      if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--mb-admin-muted);">No audit entries matching filters.</td></tr>`;
        return;
      }

      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-family: monospace; font-size: 11px; color: var(--mb-admin-muted); white-space: nowrap;">
            ${l.timestamp}
          </td>
          <td>
            <div style="font-weight: 500; font-size: 12px; color: var(--mb-admin-text);">${l.adminName}</div>
            <span class="admin-badge ${l.adminRole === 'SUPER_ADMIN' ? 'admin-badge-success' : 'admin-badge-neutral'}" style="font-size: 9px; padding: 1px 6px;">
              ${l.adminRole}
            </span>
          </td>
          <td>
            <span class="admin-badge ${
              l.action.includes('DELETED') ? 'admin-badge-danger' :
              l.action.includes('CREATED') ? 'admin-badge-success' :
              l.action.includes('LOGIN') ? 'admin-badge-info' : 'admin-badge-neutral'
            }" style="font-family: monospace; font-size: 10px;">
              ${l.action}
            </span>
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub);">
            <strong>${l.entity}</strong> <span style="font-family: monospace; font-size: 11px; color: var(--mb-admin-muted);">#${l.entityId}</span>
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub);">
            ${l.details || '—'}
          </td>
        </tr>
      `).join('');
    }

    document.getElementById('log-search-input')?.addEventListener('input', () => loadLogs());
    document.getElementById('log-filter-action')?.addEventListener('change', () => loadLogs());

    // Export CSV
    document.getElementById('btn-export-logs')?.addEventListener('click', async () => {
      const logs = await service.getAuditLogs();
      const headers = ['ID', 'Timestamp', 'Operator', 'Role', 'Action', 'Entity', 'EntityID', 'Details'];
      const rows = logs.map(l => [
        l.id,
        l.timestamp,
        `"${l.adminName}"`,
        l.adminRole,
        l.action,
        l.entity,
        l.entityId,
        `"${(l.details || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `marsh-barbary-audit-log-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.MB_ADMIN_SHELL.showToast('Audit log export initiated', 'success');
    });

    await loadLogs();
  }
};
