/**
 * MARSH BARBARY — ADMIN VIEW: PRODUCTS (js/admin/views/products.js)
 * Product catalog manager with filtering, quick stock editing, and full CRUD.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS.products = {
  title: 'Product Catalog',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const categories = await service.getCategories();

    // Query state
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const initialCategory = urlParams.get('category') || 'all';
    const initialStock = urlParams.get('stock') || 'all';
    const initialSearch = urlParams.get('q') || '';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0 0 4px 0; color: var(--mb-admin-text);">
            Atelier Products
          </h1>
          <p style="font-size: 13px; color: var(--mb-admin-muted); margin: 0;">
            Manage garment listings, variant inventories, pricing, and editorial visibility.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#/products/new" class="admin-btn admin-btn-primary admin-btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </a>
        </div>
      </div>

      <!-- Filter / Search toolbar -->
      <div class="admin-card" style="margin-bottom: 20px; padding: 16px;">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div class="admin-search-wrapper" style="flex: 1; min-width: 220px;">
            <span class="admin-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="search" id="prod-filter-search" class="admin-input admin-input-search" placeholder="Search by garment title or SKU..." value="${initialSearch}">
          </div>

          <div style="width: 170px;">
            <select id="prod-filter-cat" class="admin-select">
              <option value="all">All Categories</option>
              ${categories.map(c => `<option value="${c.slug}" ${initialCategory === c.slug ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>

          <div style="width: 170px;">
            <select id="prod-filter-stock" class="admin-select">
              <option value="all" ${initialStock === 'all' ? 'selected' : ''}>All Stock Status</option>
              <option value="low" ${initialStock === 'low' ? 'selected' : ''}>Low Stock (≤ 5)</option>
              <option value="out" ${initialStock === 'out' ? 'selected' : ''}>Out of Stock (0)</option>
              <option value="in" ${initialStock === 'in' ? 'selected' : ''}>In Stock (> 5)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 60px;">Image</th>
                <th>Garment & SKU</th>
                <th>Category</th>
                <th>Price (INR)</th>
                <th>Stock Units</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="products-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--mb-admin-muted);">Loading atelier catalog...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="products-empty-state" style="display: none; padding: 48px 24px; text-align: center; color: var(--mb-admin-muted);">
          <div style="font-family: var(--font-serif); font-size: 18px; margin-bottom: 6px; color: var(--mb-admin-text);">No matching garments found</div>
          <div style="font-size: 13px;">Adjust your filters or add a new piece to the catalog.</div>
        </div>
      </div>
    `;

    async function loadTable() {
      const search = document.getElementById('prod-filter-search')?.value || '';
      const category = document.getElementById('prod-filter-cat')?.value || 'all';
      const stockStatus = document.getElementById('prod-filter-stock')?.value || 'all';

      const items = await service.getProducts({ search, category, stockStatus });
      const tbody = document.getElementById('products-table-body');
      const emptyState = document.getElementById('products-empty-state');

      if (!items.length) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      tbody.innerHTML = items.map(p => `
        <tr>
          <td>
            <img src="${window.MB_IMAGE_SOURCE ? window.MB_IMAGE_SOURCE.resolveDisplayUrl(p.image) : '../' + p.image}" alt="" style="width: 44px; height: 56px; object-fit: cover; border-radius: 2px; border: 1px solid var(--mb-admin-border);">
          </td>
          <td>
            <a href="#/products/${p.id}/edit" style="font-weight: 500; color: var(--mb-admin-text); text-decoration: none; display: block;">
              ${p.name}
            </a>
            <div style="font-size: 11px; color: var(--mb-admin-muted); font-family: monospace;">${p.sku}</div>
          </td>
          <td style="text-transform: capitalize; font-size: 12px; color: var(--mb-admin-text-sub);">
            ${p.category}
          </td>
          <td style="font-weight: 500;">
            ₹${p.price.toLocaleString('en-IN')}
            ${p.salePrice ? `<div style="font-size: 11px; color: #9C382A; text-decoration: line-through;">₹${p.salePrice}</div>` : ''}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="admin-badge ${p.stock === 0 ? 'admin-badge-danger' : (p.stock <= (p.lowStockThreshold || 5) ? 'admin-badge-warning' : 'admin-badge-success')}">
                ${p.stock} in stock
              </span>
              <button class="admin-btn admin-btn-outline admin-btn-sm btn-quick-stock" data-id="${p.id}" data-stock="${p.stock}" title="Quick adjust stock" style="padding: 2px 6px; font-size: 10px;">
                Edit
              </button>
            </div>
          </td>
          <td>
            <span class="admin-badge ${p.status === 'active' ? 'admin-badge-success' : 'admin-badge-neutral'}">
              ${p.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <a href="#/products/${p.id}/edit" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
                Edit
              </a>
              <a href="../product.html?id=${p.id}" target="_blank" class="admin-btn admin-btn-outline admin-btn-sm" title="View customer PDP" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">
                PDP ↗
              </a>
              <button class="admin-btn admin-btn-danger admin-btn-sm btn-del-prod" data-id="${p.id}" data-name="${p.name}" style="padding: 4px 8px; font-size: 11px;" title="Delete product">
                &times;
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Wire quick stock edits
      tbody.querySelectorAll('.btn-quick-stock').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const current = e.target.getAttribute('data-stock');
          const newStock = prompt(`Update total inventory stock for this item:`, current);
          if (newStock !== null && !isNaN(parseInt(newStock, 10))) {
            service.quickUpdateStock(id, parseInt(newStock, 10)).then(() => {
              window.MB_ADMIN_SHELL.showToast('Inventory stock updated successfully', 'success');
              loadTable();
            });
          }
        });
      });

      // Wire delete product
      tbody.querySelectorAll('.btn-del-prod').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const btnEl = e.target.closest('.btn-del-prod') || e.currentTarget;
          const id = btnEl.getAttribute('data-id');
          const name = btnEl.getAttribute('data-name');
          window.MB_ADMIN_SHELL.confirmModal({
            title: `Delete ${name}?`,
            message: `Are you sure you want to permanently remove this garment from the administrative catalog? This action will be logged in the Security Audit log.`,
            confirmText: 'Delete Garment',
            confirmType: 'danger',
            onConfirm: async () => {
              try {
                await service.deleteProduct(id);
                window.MB_ADMIN_SHELL.showToast(`Deleted ${name}`, 'success');
                await loadTable();
              } catch (err) {
                window.MB_ADMIN_SHELL.showToast(err.message || 'Error deleting product', 'error');
              }
            }
          });
        });
      });
    }

    // Attach filter event listeners
    document.getElementById('prod-filter-search')?.addEventListener('input', () => loadTable());
    document.getElementById('prod-filter-cat')?.addEventListener('change', () => loadTable());
    document.getElementById('prod-filter-stock')?.addEventListener('change', () => loadTable());

    await loadTable();
  }
};
