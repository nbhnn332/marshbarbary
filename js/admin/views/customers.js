/**
 * MARSH BARBARY — ADMIN VIEW: CUSTOMERS (js/admin/views/customers.js)
 * Client directory with segmentation, lifetime spend, order history, and CRM lookups.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.customers = {
  title: 'Clientele & CRM',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Atelier Clientele
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Track customer relationship profiles, lifetime garment acquisitions, and VIP patronage.
          </p>
        </div>
        <div>
          <button id="btn-export-customers-csv" class="admin-btn admin-btn-primary admin-btn-sm" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Customer Sheet (CSV)
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
            <input type="search" id="cust-search" class="admin-input admin-input-search" placeholder="Search clients by name, email, phone, or city...">
          </div>

          <div style="width: 180px;">
            <select id="cust-filter-segment" class="admin-select">
              <option value="all">All Segments</option>
              <option value="vip">VIP (Spent > ₹10,000)</option>
              <option value="repeat">Repeat Patrons (> 1 Order)</option>
              <option value="new">First-time Clients</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Lifetime Spend</th>
                <th>Patronage Tier</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="customers-tbody">
              <tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">Loading client directory...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    function extractCustomerAddress(c) {
      const addr = (Array.isArray(c.addresses) && c.addresses[0]) || c.shippingAddress || c.shipping_address || c.address || {};
      const line1 = addr.line1 || addr.addressLine1 || addr.address_line_1 || addr.address_line1 || (typeof c.address === 'string' ? c.address : '') || '';
      const line2 = addr.line2 || addr.addressLine2 || addr.address_line_2 || addr.address_line2 || addr.landmark || '';
      const city = addr.city || c.city || '';
      const state = addr.state || c.state || '';
      const pin = addr.pincode || addr.pin || addr.postal_code || addr.postalCode || addr.pin_code || '';
      const country = addr.country || c.country || 'India';

      const parts = [line1, line2, city, state, pin, country].filter(p => !!p && String(p).trim() !== '');
      const fullAddress = parts.join(', ');

      return { fullAddress, line1, line2, city, state, pin, country };
    }

    async function exportCustomersToCSV() {
      const search = document.getElementById('cust-search')?.value || '';
      const segment = document.getElementById('cust-filter-segment')?.value || 'all';

      const list = await service.getCustomers({ search, segment });
      if (!list || !list.length) {
        window.MB_ADMIN_SHELL?.showToast('No customer records to export.', 'warning');
        return;
      }

      // Only Phone, Name, and Email with clean spacing between fields
      const headers = ['Phone Number', 'Customer Name', 'Email Address'];

      const rows = list.map(c => {
        const phone = (c.phone || '').trim() || '—';
        const name = (c.name || 'Patron').trim();
        const email = (c.email || '').trim() || '—';
        return [phone, name, email];
      });

      // UTF-8 BOM for Excel / Sheets support with clean delimiter spacing
      const BOM = '\uFEFF';
      const delimiter = ',    ';
      const csvLines = [
        headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(delimiter),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(delimiter))
      ];

      const csvContent = BOM + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const dateStr = new Date().toISOString().substring(0, 10);
      downloadLink.download = `customers_contacts_${dateStr}.csv`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      window.MB_ADMIN_SHELL?.showToast(`Downloaded customer data (${list.length} records).`, 'success');
    }

    async function loadCustomers() {
      const search = document.getElementById('cust-search')?.value || '';
      const segment = document.getElementById('cust-filter-segment')?.value || 'all';

      const list = await service.getCustomers({ search, segment });
      const tbody = document.getElementById('customers-tbody');

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--mb-admin-muted);">No client records found.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(c => `
        <tr>
          <td>
            <a href="#/customers/${c.id}" style="font-weight: 500; color: var(--mb-admin-text); text-decoration: none; font-size: 13px;">
              ${c.name}
            </a>
            <div style="font-size: 10px; color: var(--mb-admin-muted);">Member since ${c.joinedAt || '2026'}</div>
          </td>
          <td>
            <div style="font-size: 12px; color: var(--mb-admin-text-sub);">${c.email}</div>
            <div style="font-size: 11px; color: var(--mb-admin-muted);">${c.phone || '—'}</div>
          </td>
          <td style="font-size: 12px; color: var(--mb-admin-text-sub);">
            ${c.city || 'Mumbai'}, ${c.state || 'MH'}
          </td>
          <td style="font-weight: 500;">
            ${c.ordersCount || 0}
          </td>
          <td style="font-weight: 500;">
            ₹${(c.totalSpent || 0).toLocaleString('en-IN')}
          </td>
          <td>
            <span class="admin-badge ${(c.totalSpent || 0) >= 10000 ? 'admin-badge-success' : 'admin-badge-neutral'}">
              ${(c.totalSpent || 0) >= 10000 ? 'Atelier VIP' : 'Patron'}
            </span>
          </td>
          <td style="text-align: right;">
            <a href="#/customers/${c.id}" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
              Inspect Profile
            </a>
          </td>
        </tr>
      `).join('');
    }

    document.getElementById('btn-export-customers-csv')?.addEventListener('click', () => exportCustomersToCSV());
    document.getElementById('cust-search')?.addEventListener('input', () => loadCustomers());
    document.getElementById('cust-filter-segment')?.addEventListener('change', () => loadCustomers());

    await loadCustomers();
  }
};

window.MB_ADMIN_VIEWS['customer-detail'] = {
  title: 'Client Profile',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const customer = await service.getCustomerById(params.id);
    const allOrders = await service.getOrders();
    const customerOrders = allOrders.filter(o => 
      customer && (o.customer.email.toLowerCase() === customer.email.toLowerCase() || o.customer.name.toLowerCase() === customer.name.toLowerCase())
    );

    if (!customer) {
      container.innerHTML = `
        <div class="admin-card" style="padding: 48px; text-align: center;">
          <div style="font-family: var(--font-serif); font-size: 20px; color: var(--mb-admin-text); margin-bottom: 8px;">Client Not Found</div>
          <a href="#/customers" class="admin-btn admin-btn-outline admin-btn-sm">Return to Clients</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 4px;">
          <a href="#/customers" style="color: inherit; text-decoration: none;">← Back to Clients</a>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div class="admin-user-avatar" style="width: 48px; height: 48px; font-size: 16px;">
            ${customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          <div>
            <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0; color: var(--mb-admin-text);">
              ${customer.name}
            </h1>
            <div style="font-size: 12px; color: var(--mb-admin-muted);">${customer.email} • ${customer.phone || '+91 98765 43210'}</div>
          </div>
        </div>
      </div>

      <div class="admin-grid admin-grid-3">
        <!-- Customer KPIs & Info -->
        <div class="admin-card">
          <div style="font-weight: 500; font-size: 14px; margin-bottom: 14px; color: var(--mb-admin-text);">Client Snapshot</div>
          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--mb-admin-muted);">Patronage Status:</span>
              <span class="admin-badge ${(customer.totalSpent || 0) >= 10000 ? 'admin-badge-success' : 'admin-badge-neutral'}">
                ${(customer.totalSpent || 0) >= 10000 ? 'Atelier VIP' : 'Active Patron'}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--mb-admin-muted);">Total Completed Orders:</span>
              <span style="font-weight: 600;">${customerOrders.length}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--mb-admin-muted);">Lifetime Value:</span>
              <span style="font-weight: 600; color: var(--mb-admin-accent);">₹${(customer.totalSpent || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--mb-admin-muted);">Primary City:</span>
              <span>${customer.city || 'Mumbai'}, ${customer.state || 'India'}</span>
            </div>
          </div>
        </div>

        <!-- Order History Table (2 cols) -->
        <div class="admin-card" style="grid-column: span 2;">
          <div style="font-weight: 500; font-size: 14px; margin-bottom: 14px; color: var(--mb-admin-text);">Acquisition History</div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${customerOrders.length === 0 ? `
                  <tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--mb-admin-muted);">No transaction history on file.</td></tr>
                ` : customerOrders.map(o => `
                  <tr>
                    <td><strong>${o.orderNumber}</strong></td>
                    <td style="font-size: 12px; color: var(--mb-admin-muted);">${o.date}</td>
                    <td style="font-weight: 500;">₹${o.total.toLocaleString('en-IN')}</td>
                    <td>
                      <span class="admin-badge ${o.status === 'DELIVERED' ? 'admin-badge-success' : 'admin-badge-info'}">${o.status}</span>
                    </td>
                    <td style="text-align: right;">
                      <a href="#/orders/${o.orderNumber}" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 3px 8px; font-size: 11px; text-decoration: none;">View Order</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
};
