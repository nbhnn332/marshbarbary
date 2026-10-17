/**
 * MARSH BARBARY — ADMIN VIEW: DASHBOARD (js/admin/views/dashboard.js)
 * Executive operations summary: KPIs, Revenue Trend, Recent Orders, Low Stock Alerts.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.dashboard = {
  title: 'Operations Dashboard',
  
  async render(container) {
    const service = window.MB_ADMIN_SERVICE;
    const orders = await service.getOrders();
    const products = await service.getProducts();
    const customers = await service.getCustomers();
    const returns = await service.getReturns();

    // Calculations
    const validOrders = orders.filter(o => o.status !== 'CANCELLED');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = validOrders.length ? Math.round(totalRevenue / validOrders.length) : 0;
    const pendingOrdersCount = orders.filter(o => ['UNSHIPPED', 'PROCESSING'].includes(o.status)).length;
    const pendingReturnsCount = returns.filter(r => r.status === 'PENDING').length;
    const lowStockItems = products.filter(p => p.stock <= (p.lowStockThreshold || 5));

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Atelier Performance Overview
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Live operational telemetry across orders, revenue streams, and inventory.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#/products/new" class="admin-btn admin-btn-primary admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </a>
          <button id="btn-quick-sync" class="admin-btn admin-btn-outline admin-btn-sm" title="Re-fetch live data from Supabase PostgreSQL">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Sync Database
          </button>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="admin-grid admin-grid-4" style="margin-bottom: 24px;">
        <div class="admin-stat-card">
          <div class="admin-stat-label">Net Sales Revenue</div>
          <div class="admin-stat-value">₹${totalRevenue.toLocaleString('en-IN')}</div>
          <div class="admin-stat-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            +18.4% vs last cycle
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-label">Orders to Fulfill</div>
          <div class="admin-stat-value" style="color: ${pendingOrdersCount > 0 ? 'var(--mb-admin-accent)' : 'inherit'};">
            ${pendingOrdersCount} <span style="font-size: 14px; font-weight: normal; color: var(--mb-admin-muted);">/ ${orders.length} total</span>
          </div>
          <div class="admin-stat-trend trend-neutral">
            ${orders.filter(o => o.status === 'UNSHIPPED').length} awaiting packing
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-label">Average Order Value</div>
          <div class="admin-stat-value">₹${avgOrderValue.toLocaleString('en-IN')}</div>
          <div class="admin-stat-trend trend-up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            High-ticket modesty
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-label">Stock & Return Alerts</div>
          <div class="admin-stat-value" style="color: ${lowStockItems.length > 0 ? '#9C382A' : 'inherit'};">
            ${lowStockItems.length} <span style="font-size: 14px; font-weight: normal; color: var(--mb-admin-muted);">low stock</span>
          </div>
          <div class="admin-stat-trend ${pendingReturnsCount > 0 ? 'trend-down' : 'trend-neutral'}">
            ${pendingReturnsCount} return requests pending
          </div>
        </div>
      </div>

      <!-- Middle Grid: Revenue Trend Visualizer & Quick Actions -->
      <div class="admin-grid admin-grid-3" style="margin-bottom: 24px;">
        <div class="admin-card" style="grid-column: span 2;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 500; font-size: 14px; color: var(--mb-admin-text);">Weekly Revenue Trajectory</div>
              <div style="font-size: 11px; color: var(--mb-admin-muted);">Simulated atelier order velocity across 7 days</div>
            </div>
            <span class="admin-badge admin-badge-success">Live Trend</span>
          </div>
          
          <!-- Styled SVG Bar / Area visualization -->
          <div style="height: 180px; width: 100%; display: flex; align-items: flex-end; gap: 14px; padding: 10px 0 0 0; border-bottom: 1px solid var(--mb-admin-border);">
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹14k</div>
              <div style="width:100%; height:70px; background: #EFE9E0; border-radius:4px 4px 0 0; transition: height 0.5s;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Mon</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹22k</div>
              <div style="width:100%; height:110px; background: #EFE9E0; border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Tue</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹18k</div>
              <div style="width:100%; height:90px; background: #EFE9E0; border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Wed</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹29k</div>
              <div style="width:100%; height:140px; background: #EFE9E0; border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Thu</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-accent);">₹38k</div>
              <div style="width:100%; height:160px; background: var(--mb-admin-accent); border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; font-weight:500; color:var(--mb-admin-accent);">Fri</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹31k</div>
              <div style="width:100%; height:135px; background: #EFE9E0; border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Sat</div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div style="font-size:10px; color:var(--mb-admin-muted);">₹26k</div>
              <div style="width:100%; height:120px; background: #EFE9E0; border-radius:4px 4px 0 0;"></div>
              <div style="font-size:11px; color:var(--mb-admin-muted);">Sun</div>
            </div>
          </div>
        </div>

        <!-- Quick Operational Shortcuts -->
        <div class="admin-card">
          <div style="font-weight: 500; font-size: 14px; margin-bottom: 12px; color: var(--mb-admin-text);">
            Quick Operations
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="#/orders?status=UNSHIPPED" class="admin-btn admin-btn-outline" style="justify-content: space-between; text-decoration: none;">
              <span>Fulfill Pending Orders</span>
              <span class="admin-badge admin-badge-warning">${orders.filter(o => o.status === 'UNSHIPPED').length}</span>
            </a>
            <a href="#/returns?status=PENDING" class="admin-btn admin-btn-outline" style="justify-content: space-between; text-decoration: none;">
              <span>Review Return Requests</span>
              <span class="admin-badge admin-badge-danger">${pendingReturnsCount}</span>
            </a>
            <a href="#/products?stock=low" class="admin-btn admin-btn-outline" style="justify-content: space-between; text-decoration: none;">
              <span>Reorder Low Inventory</span>
              <span class="admin-badge admin-badge-warning">${lowStockItems.length}</span>
            </a>
            <a href="#/homepage" class="admin-btn admin-btn-outline" style="justify-content: space-between; text-decoration: none;">
              <span>Update Hero / Banners</span>
              <span style="font-size: 11px; color: var(--mb-admin-muted);">Edit</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Grid: Recent Orders & Inventory Watchlist -->
      <div class="admin-grid admin-grid-3">
        <!-- Recent Orders (2 cols) -->
        <div class="admin-card" style="grid-column: span 2;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 500; font-size: 14px; color: var(--mb-admin-text);">Recent Atelier Orders</div>
              <div style="font-size: 11px; color: var(--mb-admin-muted);">Latest transactions placed across website</div>
            </div>
            <a href="#/orders" style="font-size: 12px; color: var(--mb-admin-accent); text-decoration: none; font-weight: 500;">
              View All Orders →
            </a>
          </div>

          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${orders.slice(0, 5).map(o => `
                  <tr>
                    <td>
                      <a href="#/orders/${o.orderNumber}" style="font-weight: 500; color: var(--mb-admin-text); text-decoration: none;">
                        ${o.orderNumber}
                      </a>
                      <div style="font-size: 10px; color: var(--mb-admin-muted);">${o.date}</div>
                    </td>
                    <td>
                      <div style="font-weight: 500;">${o.customer.name}</div>
                      <div style="font-size: 10px; color: var(--mb-admin-muted);">${o.customer.city || 'India'}</div>
                    </td>
                    <td style="font-weight: 500;">₹${(o.total || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span class="admin-badge ${o.paymentStatus === 'PAID' ? 'admin-badge-success' : 'admin-badge-warning'}">
                        ${o.paymentStatus}
                      </span>
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
                      <a href="#/orders/${o.orderNumber}" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
                        Manage
                      </a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Low Stock Watchlist (1 col) -->
        <div class="admin-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 500; font-size: 14px; color: var(--mb-admin-text);">Inventory Watchlist</div>
              <div style="font-size: 11px; color: var(--mb-admin-muted);">Items requiring immediate restocking</div>
            </div>
            <a href="#/products?stock=low" style="font-size: 11px; color: var(--mb-admin-accent); text-decoration: none;">
              Manage Stock
            </a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${lowStockItems.length === 0 ? `
              <div style="text-align: center; padding: 24px; color: var(--mb-admin-muted); font-size: 12px;">
                All items have healthy inventory levels.
              </div>
            ` : lowStockItems.slice(0, 4).map(p => `
              <div style="display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: var(--mb-radius-sm); border: 1px solid var(--mb-admin-border);">
                <img src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(p.image) : '../' + p.image}" alt="" style="width: 40px; height: 48px; object-fit: cover; border-radius: 2px;">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 500; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--mb-admin-text);">
                    ${p.name}
                  </div>
                  <div style="font-size: 10px; color: var(--mb-admin-muted);">${p.sku}</div>
                </div>
                <div style="text-align: right;">
                  <span class="admin-badge ${p.stock === 0 ? 'admin-badge-danger' : 'admin-badge-warning'}">
                    ${p.stock} units
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Sync database button event handler
    container.querySelector('#btn-quick-sync')?.addEventListener('click', async () => {
      window.MB_ADMIN_SHELL.showToast('Syncing with live Supabase database...', 'info');
      try {
        if (window.MB_DATA?.loadLiveCatalog) {
          await window.MB_DATA.loadLiveCatalog();
        }
        await service.getProducts();
        await service.getCategories();
        await service.getOrders();
        await service.getCustomers();
        window.MB_ADMIN_SHELL.showToast('Database synchronization complete', 'success');
        window.location.reload();
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast('Sync failed: ' + (err.message || 'Unknown error'), 'error');
      }
    });
  }
};
