/**
 * MARSH BARBARY — ADMIN VIEW: ORDERS (js/admin/views/orders.js)
 * High-touch order management with status tabs, customer lookups, and fulfillment workflows.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.orders = {
  title: 'Order Management',

  async render(container) {
    const service = window.MB_ADMIN_SERVICE;

    // Check query params in hash
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    let activeStatus = urlParams.get('status') || 'all';
    let searchQuery = urlParams.get('q') || '';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Atelier Orders
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Track customer transactions, dispatch tracking numbers, and manage post-purchase fulfillment.
          </p>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="admin-tabs" id="order-status-tabs" style="margin-bottom: 20px;">
        <button class="admin-tab-btn ${activeStatus === 'all' ? 'active' : ''}" data-status="all">All Orders</button>
        <button class="admin-tab-btn ${activeStatus === 'UNSHIPPED' ? 'active' : ''}" data-status="UNSHIPPED">Unshipped</button>
        <button class="admin-tab-btn ${activeStatus === 'PROCESSING' ? 'active' : ''}" data-status="PROCESSING">Processing</button>
        <button class="admin-tab-btn ${activeStatus === 'SHIPPED' ? 'active' : ''}" data-status="SHIPPED">Shipped</button>
        <button class="admin-tab-btn ${activeStatus === 'DELIVERED' ? 'active' : ''}" data-status="DELIVERED">Delivered</button>
        <button class="admin-tab-btn ${activeStatus === 'CANCELLED' ? 'active' : ''}" data-status="CANCELLED">Cancelled</button>
      </div>

      <!-- Filter Bar -->
      <div class="admin-card" style="margin-bottom: 20px; padding: 16px;">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div class="admin-search-wrapper" style="flex: 1; min-width: 240px;">
            <span class="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="search" id="order-search-input" class="admin-input admin-input-search" placeholder="Search order ID, customer name, email, or city..." value="${searchQuery}">
          </div>

          <div style="width: 180px;">
            <select id="order-filter-payment" class="admin-select">
              <option value="all">All Payment Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date & Time</th>
                <th>Client</th>
                <th>Items</th>
                <th>Total (INR)</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="orders-table-tbody">
              <tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">Loading transactions...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="orders-empty-state" style="display: none; padding: 48px 24px; text-align: center; color: var(--mb-admin-muted);">
          <div style="font-family: var(--font-serif); font-size: 18px; margin-bottom: 6px; color: var(--mb-admin-text);">No matching orders</div>
          <div style="font-size: 13px;">No orders found matching the selected filter criteria.</div>
        </div>
      </div>
    `;

    async function loadOrders() {
      const search = document.getElementById('order-search-input')?.value || '';
      const paymentStatus = document.getElementById('order-filter-payment')?.value || 'all';

      const filters = {
        search,
        status: activeStatus,
        paymentStatus
      };

      const orders = await service.getOrders(filters);
      const tbody = document.getElementById('orders-table-tbody');
      const empty = document.getElementById('orders-empty-state');

      if (!orders.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = orders.map(o => {
        const itemCount = o.items ? o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 0;
        return `
          <tr>
            <td>
              <a href="#/orders/${o.orderNumber}" style="font-weight: 600; color: var(--mb-admin-text); text-decoration: none;">
                ${o.orderNumber}
              </a>
            </td>
            <td style="font-size: 12px; color: var(--mb-admin-muted);">
              ${o.date}
            </td>
            <td>
              <div style="font-weight: 500; color: var(--mb-admin-text);">${o.customer.name}</div>
              <div style="font-size: 11px; color: var(--mb-admin-muted);">${o.customer.email}</div>
            </td>
            <td>
              <div style="font-size: 12px; color: var(--mb-admin-text-sub);">
                ${itemCount} ${itemCount === 1 ? 'garment' : 'garments'}
              </div>
              <div style="font-size: 10px; color: var(--mb-admin-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${(o.items || []).map(i => i.title).join(', ')}
              </div>
            </td>
            <td style="font-weight: 500;">
              ₹${(o.total || 0).toLocaleString('en-IN')}
            </td>
            <td>
              <span class="admin-badge ${o.paymentStatus === 'PAID' ? 'admin-badge-success' : (o.paymentStatus === 'REFUNDED' ? 'admin-badge-neutral' : 'admin-badge-warning')}">
                ${o.paymentStatus}
              </span>
              <div style="font-size: 9px; color: var(--mb-admin-muted); text-transform: uppercase; margin-top: 2px;">
                ${o.paymentMethod || 'Online'}
              </div>
            </td>
            <td>
              <span class="admin-badge ${
                o.status === 'DELIVERED' ? 'admin-badge-success' :
                o.status === 'SHIPPED' ? 'admin-badge-info' :
                o.status === 'PROCESSING' ? 'admin-badge-warning' :
                o.status === 'CANCELLED' ? 'admin-badge-danger' : 'admin-badge-neutral'
              }">
                ${o.status}
              </span>
            </td>
            <td style="text-align: right;">
              <a href="#/orders/${o.orderNumber}" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">
                Inspect
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Tabs click handler
    document.querySelectorAll('#order-status-tabs .admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#order-status-tabs .admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatus = btn.getAttribute('data-status');
        loadOrders();
      });
    });

    // Search and filter listeners
    document.getElementById('order-search-input')?.addEventListener('input', () => loadOrders());
    document.getElementById('order-filter-payment')?.addEventListener('change', () => loadOrders());

    await loadOrders();
  }
};
