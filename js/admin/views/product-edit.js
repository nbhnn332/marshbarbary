/**
 * MARSH BARBARY — ADMIN VIEW: PRODUCT EDIT / CREATE (js/admin/views/product-edit.js)
 * Premium Size & Colour Variant Inventory Editor Redesign
 * Hierarchy: Product → Colour Variant → Size Variants → Inventory
 * - Clean collapsible colour accordion groups
 * - Shared colour swatch & image management per colour (URL + Upload + live preview)
 * - Compact size inventory table (Size | SKU | Stock | Actions)
 * - Sensible auto-SKU generation with custom SKU support
 * - Real-time duplicate SKU & duplicate size detection with inline validation
 * - Non-negative integer stock validation
 * - Duplicate colour action with unique auto-SKUs
 * - Confirmation dialogs for destructive actions (removing colours or sizes with stock)
 * - 100% backward compatible with flat variant schema in Supabase & localStorage
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['product-edit'] = {
  title: 'Edit Garment',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const categories = await service.getCategories();
    const isNew = !params.id || params.id === 'new';

    let product = {
      id: '',
      name: '',
      slug: '',
      sku: '',
      category: 'dresses',
      categoryId: '',
      price: 2999,
      salePrice: null,
      stock: 10,
      lowStockThreshold: 5,
      status: 'active',
      featured: false,
      newArrival: true,
      shortDescription: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85',
      gallery: [],
      variants: []
    };

    if (!isNew) {
      const fetched = await service.getProductById(params.id);
      if (fetched) product = fetched;
    }

    // Standard garment sizes
    const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

    // Helper: Derives SKU prefix from product SKU or name
    function getProductSkuPrefix() {
      if (product.sku && product.sku.trim()) {
        return product.sku.trim().toUpperCase();
      }
      const nameInput = container.querySelector('#pe-name');
      const title = (nameInput?.value || product.name || 'GARMENT').trim();
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 3) || 'DRS';
      return `MB-${cleanTitle}`;
    }

    function getColCode(colorName) {
      if (!colorName) return 'COL';
      const clean = colorName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return clean.substring(0, 3) || 'COL';
    }

    function getSizeCode(sz) {
      if (!sz) return 'M';
      if (sz.toLowerCase() === 'free size') return 'FS';
      return sz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    function generateSku(prefix, col, sz) {
      return `${prefix}-${getColCode(col)}-${getSizeCode(sz)}`;
    }

    // Group flat database variants by Colour
    function groupVariants(vars) {
      const groups = new Map();
      const prefix = getProductSkuPrefix();

      if (Array.isArray(vars) && vars.length > 0) {
        vars.forEach(v => {
          const col = (v.color || 'Natural').trim();
          if (!groups.has(col)) {
            groups.set(col, {
              id: 'cg_' + Math.random().toString(36).substring(2, 9),
              color: col,
              color_code: v.color_code || '',
              image_url: v.image_url || '',
              isExpanded: true,
              sizes: []
            });
          }
          const g = groups.get(col);
          if (!g.image_url && v.image_url) g.image_url = v.image_url;
          g.sizes.push({
            id: 'sz_' + Math.random().toString(36).substring(2, 9),
            size: v.size || 'M',
            stock: v.stock ?? v.stock_qty ?? 5,
            sku: v.sku || generateSku(prefix, col, v.size || 'M'),
            customSku: Boolean(v.sku)
          });
        });
      }

      if (groups.size === 0) {
        // Initial luxury default for new product
        const initialCol = 'Natural';
        groups.set(initialCol, {
          id: 'cg_' + Math.random().toString(36).substring(2, 9),
          color: initialCol,
          color_code: '#E5DFD7',
          image_url: product.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85',
          isExpanded: true,
          sizes: [
            { id: 'sz_1', size: 'XS', stock: 5, sku: generateSku(prefix, initialCol, 'XS'), customSku: false },
            { id: 'sz_2', size: 'S', stock: 10, sku: generateSku(prefix, initialCol, 'S'), customSku: false },
            { id: 'sz_3', size: 'M', stock: 15, sku: generateSku(prefix, initialCol, 'M'), customSku: false },
            { id: 'sz_4', size: 'L', stock: 10, sku: generateSku(prefix, initialCol, 'L'), customSku: false },
            { id: 'sz_5', size: 'XL', stock: 5, sku: generateSku(prefix, initialCol, 'XL'), customSku: false }
          ]
        });
      }

      return Array.from(groups.values());
    }

    let colorVariants = groupVariants(product.variants);

    // Run deep validation on current variant state
    function validateVariantState() {
      const errors = {
        hasErrors: false,
        duplicateSkus: new Set(),
        duplicateSizesByGroup: new Map(), // groupId -> Set of duplicate sizes
        emptyColors: new Set(),
        invalidStocks: new Set(), // Set of sizeIds
        emptySkus: new Set()      // Set of sizeIds
      };

      const skuOccurrences = new Map();
      colorVariants.forEach(cg => {
        (cg.sizes || []).forEach(s => {
          const skuTrim = (s.sku || '').trim().toUpperCase();
          if (skuTrim) {
            skuOccurrences.set(skuTrim, (skuOccurrences.get(skuTrim) || 0) + 1);
          } else {
            errors.emptySkus.add(s.id);
            errors.hasErrors = true;
          }
        });
      });

      skuOccurrences.forEach((count, sku) => {
        if (count > 1) {
          errors.duplicateSkus.add(sku);
          errors.hasErrors = true;
        }
      });

      colorVariants.forEach(cg => {
        if (!cg.color || !cg.color.trim()) {
          errors.emptyColors.add(cg.id);
          errors.hasErrors = true;
        }

        const sizeCounts = new Map();
        (cg.sizes || []).forEach(s => {
          const sz = (s.size || '').trim().toUpperCase();
          if (sz) {
            sizeCounts.set(sz, (sizeCounts.get(sz) || 0) + 1);
          }

          const stockNum = Number(s.stock);
          if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
            errors.invalidStocks.add(s.id);
            errors.hasErrors = true;
          }
        });

        const dupSizes = new Set();
        sizeCounts.forEach((cnt, sz) => {
          if (cnt > 1) dupSizes.add(sz);
        });

        if (dupSizes.size > 0) {
          errors.duplicateSizesByGroup.set(cg.id, dupSizes);
          errors.hasErrors = true;
        }
      });

      return errors;
    }

    // Modal Confirmation for Destructive Actions
    function showConfirmModal({ title, body, confirmText = 'Delete', isDestructive = true, onConfirm }) {
      const existing = document.getElementById('variant-confirm-modal');
      if (existing) existing.remove();

      const modalHtml = `
        <div id="variant-confirm-modal" class="variant-modal-backdrop">
          <div class="variant-modal-card">
            <h3 class="variant-modal-title">${title}</h3>
            <div class="variant-modal-body">${body}</div>
            <div class="variant-modal-actions">
              <button type="button" id="btn-modal-cancel" class="admin-btn admin-btn-outline admin-btn-sm">Cancel</button>
              <button type="button" id="btn-modal-confirm" class="admin-btn admin-btn-sm" style="${isDestructive ? 'background: #DC2626; color: #FFF; border: none;' : ''}">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modalEl = document.getElementById('variant-confirm-modal');
      modalEl.querySelector('#btn-modal-cancel').addEventListener('click', () => {
        modalEl.remove();
      });

      modalEl.querySelector('#btn-modal-confirm').addEventListener('click', () => {
        modalEl.remove();
        if (typeof onConfirm === 'function') onConfirm();
      });
    }

    function renderView() {
      container.innerHTML = `
        <!-- Page Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 4px;">
              <a href="#/products" style="color: inherit; text-decoration: none;">← Back to Garments</a>
            </div>
            <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0; color: var(--mb-admin-text);">
              ${isNew ? 'Create New Garment' : `Edit: ${product.name}`}
            </h1>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/products" class="admin-btn admin-btn-outline admin-btn-sm">Cancel</a>
            <button type="button" id="btn-save-product" class="admin-btn admin-btn-primary admin-btn-sm" style="padding: 7px 22px; font-weight: 600;">
              ${isNew ? 'Publish Garment' : 'Save Changes'}
            </button>
          </div>
        </div>

        <form id="product-simple-form">
          <div style="display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 24px; align-items: start;">
            
            <!-- LEFT COLUMN: Garment Details & Primary Image -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              
              <!-- Card 1: Product Essentials -->
              <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border); border-radius: 8px; padding: 20px;">
                <div style="font-weight: 600; font-size: 14.5px; margin-bottom: 16px; color: var(--mb-admin-text); border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 8px;">
                  1. Garment Details
                </div>

                <div class="admin-form-group" style="margin-bottom: 14px;">
                  <label class="admin-label" for="pe-name">Garment Title *</label>
                  <input type="text" id="pe-name" class="admin-input" required value="${product.name}" placeholder="e.g. Sienna Linen Maxi Dress" style="width: 100%;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                  <div class="admin-form-group">
                    <label class="admin-label" for="pe-category">Category *</label>
                    <select id="pe-category" class="admin-select" style="width: 100%;">
                      ${categories.map(c => `
                        <option value="${c.id}" data-slug="${c.slug}" ${(product.categoryId === c.id || product.category === c.slug || product.category === c.id) ? 'selected' : ''}>${c.name}</option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="pe-status">Store Visibility</label>
                    <select id="pe-status" class="admin-select" style="width: 100%;">
                      <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active (Visible)</option>
                      <option value="draft" ${product.status === 'draft' ? 'selected' : ''}>Draft (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                  <div class="admin-form-group">
                    <label class="admin-label" for="pe-price">Regular Price (INR ₹) *</label>
                    <input type="number" id="pe-price" class="admin-input" required min="0" value="${product.price}" style="width: 100%;">
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-label" for="pe-sale-price">Sale Price (INR ₹)</label>
                    <input type="number" id="pe-sale-price" class="admin-input" min="0" value="${product.salePrice || ''}" placeholder="Optional" style="width: 100%;">
                  </div>
                </div>

                <div class="admin-form-group" style="margin-bottom: 14px;">
                  <label class="admin-label" for="pe-desc">Description / Editorial Story</label>
                  <textarea id="pe-desc" class="admin-textarea" rows="3" placeholder="Crafted in 100% pure organic flax linen with relaxed silhouette..." style="width: 100%; font-size: 12.5px;">${product.description || product.shortDescription || ''}</textarea>
                </div>

                <div style="display: flex; gap: 20px; align-items: center; padding-top: 10px; border-top: 1px solid var(--mb-admin-border);">
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mb-admin-text); cursor: pointer;">
                    <input type="checkbox" id="pe-featured" ${product.featured ? 'checked' : ''} style="accent-color: #B47154;">
                    Feature on Homepage
                  </label>
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mb-admin-text); cursor: pointer;">
                    <input type="checkbox" id="pe-new" ${product.newArrival ? 'checked' : ''} style="accent-color: #B47154;">
                    Mark as New Arrival
                  </label>
                </div>
              </div>

              <!-- Card 2: Primary Garment Cover Image -->
              <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border); border-radius: 8px; padding: 20px;">
                <div style="font-weight: 600; font-size: 14.5px; margin-bottom: 16px; color: var(--mb-admin-text); border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 8px;">
                  2. Primary Product Image
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="pe-main-img-url">Cover Image URL *</label>
                  <div style="display: flex; gap: 14px; align-items: center; margin-top: 6px;">
                    <div id="main-img-preview-box" style="width: 70px; height: 90px; border-radius: 6px; overflow: hidden; background: #F6F4F0; border: 1px solid #DDD; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                      <img src="${product.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';">
                    </div>
                    <div style="flex: 1;">
                      <input type="url" id="pe-main-img-url" class="admin-input" required value="${product.image || ''}" placeholder="https://images.unsplash.com/..." style="width: 100%; padding: 8px 10px; font-size: 12.5px;">
                      <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center;">
                        <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: pointer; font-size: 11px; padding: 3px 8px;">
                          Upload Image
                          <input type="file" id="pe-main-file-input" accept="image/*" style="display: none;">
                        </label>
                        <span style="font-size: 11px; color: var(--mb-admin-muted);">Catalog cover photo.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Size & Colour Variants Redesign -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="variant-section-card">
                
                <!-- Section Header -->
                <div class="variant-section-header">
                  <div class="variant-section-title-wrap">
                    <h2 class="variant-section-title">Size & Colour Variants</h2>
                    <p class="variant-section-subtitle">Manage colours, sizes and inventory for this product.</p>
                  </div>
                  <button type="button" id="btn-add-colour" class="admin-btn admin-btn-primary admin-btn-sm" style="font-size: 12px; padding: 7px 16px; background: #26201D; display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>+ Add Colour</span>
                  </button>
                </div>

                <!-- Colour Groups Accordion List -->
                <div id="variant-color-groups-list">
                  <!-- Rendered dynamically -->
                </div>

                <!-- Total Stock Summary Bar -->
                <div class="variant-stock-summary-bar">
                  <div>
                    <div class="variant-summary-label">Total Inventory Stock</div>
                    <div id="variant-summary-breakdown" class="variant-summary-detail">0 Colours • 0 Sizes</div>
                  </div>
                  <div id="total-stock-counter" class="variant-summary-count">0 Units</div>
                </div>

              </div>
            </div>

          </div>
        </form>
      `;

      renderColorGroups();
      attachFormListeners();
    }

    // Render all colour groups with compact size inventory tables
    function renderColorGroups() {
      const listEl = container.querySelector('#variant-color-groups-list');
      if (!listEl) return;

      const errors = validateVariantState();

      listEl.innerHTML = colorVariants.map((cg, cIdx) => {
        const totalUnitsInGroup = (cg.sizes || []).reduce((acc, s) => acc + (parseInt(s.stock, 10) || 0), 0);
        const sizeCount = (cg.sizes || []).length;
        const hasColorError = errors.emptyColors.has(cg.id);
        const dupSizesForThisGroup = errors.duplicateSizesByGroup.get(cg.id) || new Set();

        return `
          <div class="variant-color-group ${cg.isExpanded ? 'is-expanded' : ''}" data-group-id="${cg.id}" data-cidx="${cIdx}">
            
            <!-- Accordion Header -->
            <div class="variant-group-header" data-action="toggle-group" data-cidx="${cIdx}">
              <div class="variant-header-left">
                <span class="variant-chevron">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
                
                <!-- Swatch Thumbnail -->
                <div class="variant-swatch-thumb">
                  ${cg.image_url 
                    ? `<img src="${cg.image_url}" alt="${cg.color}" onerror="this.style.opacity='0.4';">`
                    : (cg.color_code 
                        ? `<div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${cg.color_code}; border: 1px solid rgba(0,0,0,0.15);"></div>`
                        : `<span style="font-size: 10px; color: #8C7A6B;">Swatch</span>`
                      )
                  }
                </div>

                <div class="variant-header-info">
                  <span class="variant-color-title">${cg.color || '<em style="color:#DC2626;">Unnamed Colour</em>'}</span>
                  ${cg.color_code ? `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cg.color_code}; border:1px solid #CCC;" title="${cg.color_code}"></span>` : ''}
                  <span class="variant-count-badge">${sizeCount} ${sizeCount === 1 ? 'size' : 'sizes'} • ${totalUnitsInGroup} units</span>
                  ${hasColorError ? `<span class="variant-field-error" style="margin:0;">⚠ Colour name required</span>` : ''}
                </div>
              </div>

              <!-- Header Action Buttons -->
              <div class="variant-header-actions" onclick="event.stopPropagation();">
                <button type="button" class="variant-action-btn btn-duplicate-colour" data-cidx="${cIdx}" title="Duplicate this colour and its sizes">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Duplicate</span>
                </button>
                <button type="button" class="variant-action-btn btn-delete btn-remove-colour" data-cidx="${cIdx}" title="Remove this colour group">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Remove</span>
                </button>
              </div>
            </div>

            <!-- Group Body (Settings & Size Inventory Table) -->
            <div class="variant-group-body">
              
              <!-- Colour Details Row -->
              <div class="variant-color-controls">
                
                <!-- Swatch / Image Preview -->
                <div class="variant-image-preview-box">
                  ${cg.image_url 
                    ? `<img src="${cg.image_url}" alt="${cg.color}" onerror="this.style.opacity='0.4';">`
                    : `<span style="font-size: 11px; color: #8C7A6B; text-align: center; padding: 4px;">No Photo</span>`
                  }
                </div>

                <!-- Colour Identity Inputs -->
                <div>
                  <div style="margin-bottom: 10px;">
                    <label class="admin-label" style="font-size: 11px;">Colour Name *</label>
                    <input type="text" class="variant-input-sm var-color-name ${hasColorError ? 'has-error' : ''}" data-cidx="${cIdx}" value="${cg.color || ''}" placeholder="e.g. Natural, Terracotta, Olive" required>
                    ${hasColorError ? `<div class="variant-field-error">Colour name cannot be empty</div>` : ''}
                  </div>
                  <div>
                    <label class="admin-label" style="font-size: 11px;">Colour Swatch Code / Hex (Optional)</label>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <input type="color" class="var-color-picker" data-cidx="${cIdx}" value="${cg.color_code || '#B47154'}" style="width: 32px; height: 32px; border: 1px solid #D5CBC2; border-radius: 4px; padding: 2px; cursor: pointer; background: transparent;">
                      <input type="text" class="variant-input-sm var-color-code" data-cidx="${cIdx}" value="${cg.color_code || ''}" placeholder="#E5DFD7 or shade name" style="flex: 1;">
                    </div>
                  </div>
                </div>

                <!-- Shared Swatch Image URL & File Upload -->
                <div class="variant-image-inputs">
                  <label class="admin-label" style="font-size: 11px;">Shared Colour Image URL *</label>
                  <input type="url" class="variant-input-sm var-img-url" data-cidx="${cIdx}" value="${cg.image_url || ''}" placeholder="https://... direct image link">
                  <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px; flex-wrap: wrap;">
                    <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: pointer; font-size: 11px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>Upload Swatch / Photo</span>
                      <input type="file" class="var-file-upload" data-cidx="${cIdx}" accept="image/*" style="display: none;">
                    </label>
                    ${cg.image_url ? `
                      <button type="button" class="variant-action-btn btn-clear-img" data-cidx="${cIdx}" style="padding: 2px 6px; font-size: 11px; color: #8C7A6B;">
                        Clear
                      </button>
                    ` : ''}
                  </div>
                  <span style="font-size: 11px; color: var(--mb-admin-muted);">Shared photo for this colour. Displays when colour is selected in store.</span>
                </div>

              </div>

              <!-- Compact Size Inventory Table -->
              <div class="variant-size-table-wrap">
                <table class="variant-size-table">
                  <thead>
                    <tr>
                      <th style="width: 140px;">Size</th>
                      <th>SKU</th>
                      <th style="width: 110px; text-align: center;">Stock</th>
                      <th style="width: 90px; text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(cg.sizes || []).map((s, sIdx) => {
                      const cleanSku = (s.sku || '').trim().toUpperCase();
                      const isDupSku = errors.duplicateSkus.has(cleanSku);
                      const isEmptySku = errors.emptySkus.has(s.id);
                      const isDupSize = dupSizesForThisGroup.has((s.size || '').trim().toUpperCase());
                      const isInvalidStock = errors.invalidStocks.has(s.id);

                      const isStandardSize = STANDARD_SIZES.includes(s.size);

                      return `
                        <tr data-size-id="${s.id}" data-sidx="${sIdx}">
                          <!-- Size Column -->
                          <td>
                            ${isStandardSize ? `
                              <select class="variant-input-sm var-size-select ${isDupSize ? 'has-error' : ''}" data-cidx="${cIdx}" data-sidx="${sIdx}">
                                ${STANDARD_SIZES.map(opt => `
                                  <option value="${opt}" ${s.size === opt ? 'selected' : ''}>${opt}</option>
                                `).join('')}
                                <option value="__custom__">Custom Size...</option>
                              </select>
                            ` : `
                              <div style="display: flex; gap: 4px; align-items: center;">
                                <input type="text" class="variant-input-sm var-size-custom-input ${isDupSize ? 'has-error' : ''}" data-cidx="${cIdx}" data-sidx="${sIdx}" value="${s.size}" placeholder="e.g. 38, Petite">
                                <button type="button" class="btn-reset-size-select" data-cidx="${cIdx}" data-sidx="${sIdx}" title="Reset to standard dropdown" style="background:none; border:none; color:#8C7A6B; cursor:pointer; font-size:14px;">✕</button>
                              </div>
                            `}
                            ${isDupSize ? `<div class="variant-field-error">Duplicate size "${s.size}"</div>` : ''}
                          </td>

                          <!-- SKU Column -->
                          <td>
                            <input type="text" class="variant-input-sm variant-sku-input var-sku-input ${isDupSku || isEmptySku ? 'has-error' : ''}" data-cidx="${cIdx}" data-sidx="${sIdx}" value="${s.sku || ''}" placeholder="e.g. MB-DRS-001-NAT-M">
                            ${isDupSku ? `<div class="variant-field-error">⚠ Duplicate SKU across variants</div>` : ''}
                            ${isEmptySku ? `<div class="variant-field-error">SKU is required</div>` : ''}
                          </td>

                          <!-- Stock Column -->
                          <td style="text-align: center;">
                            <input type="number" min="0" step="1" class="variant-input-sm variant-stock-input var-stock-input ${isInvalidStock ? 'has-error' : ''}" data-cidx="${cIdx}" data-sidx="${sIdx}" value="${s.stock}">
                            ${isInvalidStock ? `<div class="variant-field-error">Min 0</div>` : ''}
                          </td>

                          <!-- Actions Column -->
                          <td style="text-align: right;">
                            <button type="button" class="variant-btn-remove-row btn-remove-size" data-cidx="${cIdx}" data-sidx="${sIdx}" title="Remove this size variant">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              <span style="margin-left: 4px;">Remove</span>
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>

                <!-- Table Footer: Add Size Button & Quick Shortcuts -->
                <div class="variant-table-footer">
                  <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-add-size" data-cidx="${cIdx}" style="font-size: 11.5px; padding: 4px 12px; background: #FFF;">
                    + Add Size
                  </button>

                  <div class="variant-quick-sizes">
                    <span style="font-size: 11px; color: var(--mb-admin-muted);">Quick Add:</span>
                    ${STANDARD_SIZES.filter(sz => !(cg.sizes || []).some(s => s.size === sz)).map(sz => `
                      <button type="button" class="variant-quick-chip btn-quick-add-size" data-cidx="${cIdx}" data-size="${sz}">
                        + ${sz}
                      </button>
                    `).join('')}
                  </div>
                </div>
              </div>

            </div>

          </div>
        `;
      }).join('');

      updateTotalStockDisplay();
      attachVariantListeners();
    }

    function updateTotalStockDisplay() {
      let totalUnits = 0;
      let totalVariants = 0;

      colorVariants.forEach(cg => {
        (cg.sizes || []).forEach(s => {
          totalUnits += parseInt(s.stock, 10) || 0;
          totalVariants += 1;
        });
      });

      const totalStockEl = container.querySelector('#total-stock-counter');
      if (totalStockEl) totalStockEl.textContent = `${totalUnits} Units`;

      const breakdownEl = container.querySelector('#variant-summary-breakdown');
      if (breakdownEl) {
        const colCount = colorVariants.length;
        breakdownEl.textContent = `${colCount} ${colCount === 1 ? 'Colour' : 'Colours'} • ${totalVariants} Variant Combinations`;
      }
    }

    // Attach event listeners for all variant interactions
    function attachVariantListeners() {
      // Toggle Accordion Group
      container.querySelectorAll('.variant-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
          // Ignore clicks on action buttons
          if (e.target.closest('.variant-header-actions')) return;
          const cIdx = parseInt(header.getAttribute('data-cidx'), 10);
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].isExpanded = !colorVariants[cIdx].isExpanded;
            renderColorGroups();
          }
        });
      });

      // Duplicate Colour Action
      container.querySelectorAll('.btn-duplicate-colour').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const orig = colorVariants[cIdx];
          if (!orig) return;

          const prefix = getProductSkuPrefix();
          const newColorName = `${orig.color} (Copy)`;
          const clonedSizes = (orig.sizes || []).map(s => ({
            id: 'sz_' + Math.random().toString(36).substring(2, 9),
            size: s.size,
            stock: s.stock,
            sku: generateSku(prefix, newColorName, s.size),
            customSku: false
          }));

          const clonedGroup = {
            id: 'cg_' + Math.random().toString(36).substring(2, 9),
            color: newColorName,
            color_code: orig.color_code || '',
            image_url: orig.image_url || '',
            isExpanded: true,
            sizes: clonedSizes
          };

          colorVariants.splice(cIdx + 1, 0, clonedGroup);
          renderColorGroups();
          window.MB_ADMIN_SHELL?.showToast(`Duplicated colour "${orig.color}"`, 'success');
        });
      });

      // Remove Colour Action (with destructive confirmation if stock exists)
      container.querySelectorAll('.btn-remove-colour').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg) return;

          if (colorVariants.length <= 1) {
            window.MB_ADMIN_SHELL?.showToast('A garment must have at least one colour variant', 'warning');
            return;
          }

          const totalStock = (cg.sizes || []).reduce((acc, s) => acc + (parseInt(s.stock, 10) || 0), 0);
          const sizeCount = (cg.sizes || []).length;

          if (totalStock > 0) {
            showConfirmModal({
              title: `Remove Colour "${cg.color}"?`,
              body: `This colour variant has <strong>${sizeCount} sizes</strong> with a total of <strong>${totalStock} units</strong> in stock. Removing it will permanently delete this inventory allocation.`,
              confirmText: 'Remove Colour',
              isDestructive: true,
              onConfirm: () => {
                colorVariants.splice(cIdx, 1);
                renderColorGroups();
                window.MB_ADMIN_SHELL?.showToast(`Colour "${cg.color}" removed`, 'info');
              }
            });
          } else {
            colorVariants.splice(cIdx, 1);
            renderColorGroups();
          }
        });
      });

      // Colour Name Input
      container.querySelectorAll('.var-color-name').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const val = e.target.value;
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].color = val;
            
            // Auto-update non-custom SKUs in this group
            const prefix = getProductSkuPrefix();
            (colorVariants[cIdx].sizes || []).forEach(s => {
              if (!s.customSku) {
                s.sku = generateSku(prefix, val, s.size);
              }
            });
          }
        });

        inp.addEventListener('blur', () => {
          renderColorGroups();
        });
      });

      // Colour Code / Hex Input & Picker
      container.querySelectorAll('.var-color-picker').forEach(picker => {
        picker.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const hex = e.target.value;
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].color_code = hex;
            const textInp = container.querySelector(`.var-color-code[data-cidx="${cIdx}"]`);
            if (textInp) textInp.value = hex;
          }
        });
      });

      container.querySelectorAll('.var-color-code').forEach(textInp => {
        textInp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const val = e.target.value.trim();
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].color_code = val;
            if (/^#[0-9A-F]{6}$/i.test(val)) {
              const picker = container.querySelector(`.var-color-picker[data-cidx="${cIdx}"]`);
              if (picker) picker.value = val;
            }
          }
        });
      });

      // Shared Image URL input & Live Preview
      container.querySelectorAll('.var-img-url').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const url = e.target.value.trim();
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].image_url = url;
            const groupEl = e.target.closest('.variant-color-group');
            const previewImg = groupEl?.querySelector('.variant-image-preview-box img');
            if (previewImg) previewImg.src = url || '';
          }
        });

        inp.addEventListener('blur', () => {
          renderColorGroups();
        });
      });

      // File upload for colour swatch / photo
      container.querySelectorAll('.var-file-upload').forEach(fileInp => {
        fileInp.addEventListener('change', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const file = e.target.files?.[0];
          if (!file || !colorVariants[cIdx]) return;

          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target.result;
            colorVariants[cIdx].image_url = dataUrl;
            renderColorGroups();
          };
          reader.readAsDataURL(file);
        });
      });

      // Clear image button
      container.querySelectorAll('.btn-clear-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].image_url = '';
            renderColorGroups();
          }
        });
      });

      // Add Size Button
      container.querySelectorAll('.btn-add-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg) return;

          const prefix = getProductSkuPrefix();
          // Pick next unselected standard size if available
          const existingSizes = new Set((cg.sizes || []).map(s => s.size));
          const nextAvailable = STANDARD_SIZES.find(sz => !existingSizes.has(sz)) || 'M';

          cg.sizes.push({
            id: 'sz_' + Math.random().toString(36).substring(2, 9),
            size: nextAvailable,
            stock: 5,
            sku: generateSku(prefix, cg.color, nextAvailable),
            customSku: false
          });

          renderColorGroups();
        });
      });

      // Quick Add Size Chip
      container.querySelectorAll('.btn-quick-add-size').forEach(chip => {
        chip.addEventListener('click', (e) => {
          const cIdx = parseInt(chip.getAttribute('data-cidx'), 10);
          const sz = chip.getAttribute('data-size');
          const cg = colorVariants[cIdx];
          if (!cg || !sz) return;

          const prefix = getProductSkuPrefix();
          cg.sizes.push({
            id: 'sz_' + Math.random().toString(36).substring(2, 9),
            size: sz,
            stock: 5,
            sku: generateSku(prefix, cg.color, sz),
            customSku: false
          });

          renderColorGroups();
        });
      });

      // Remove Size Variant Row (with confirmation if stock > 0)
      container.querySelectorAll('.btn-remove-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(btn.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg || !cg.sizes?.[sIdx]) return;

          if (cg.sizes.length <= 1) {
            window.MB_ADMIN_SHELL?.showToast('A colour variant must have at least one size', 'warning');
            return;
          }

          const s = cg.sizes[sIdx];
          const stock = parseInt(s.stock, 10) || 0;

          if (stock > 0) {
            showConfirmModal({
              title: `Remove Size "${s.size}"?`,
              body: `This size has <strong>${stock} units</strong> in stock (SKU: <code>${s.sku}</code>). Are you sure you want to remove it?`,
              confirmText: 'Remove Size',
              isDestructive: true,
              onConfirm: () => {
                cg.sizes.splice(sIdx, 1);
                renderColorGroups();
              }
            });
          } else {
            cg.sizes.splice(sIdx, 1);
            renderColorGroups();
          }
        });
      });

      // Size Select Dropdown change
      container.querySelectorAll('.var-size-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg || !cg.sizes?.[sIdx]) return;

          const val = e.target.value;
          if (val === '__custom__') {
            cg.sizes[sIdx].size = 'Custom';
            renderColorGroups();
            return;
          }

          cg.sizes[sIdx].size = val;
          if (!cg.sizes[sIdx].customSku) {
            cg.sizes[sIdx].sku = generateSku(getProductSkuPrefix(), cg.color, val);
          }
          renderColorGroups();
        });
      });

      // Custom Size text input
      container.querySelectorAll('.var-size-custom-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg || !cg.sizes?.[sIdx]) return;

          const val = e.target.value.trim();
          cg.sizes[sIdx].size = val;
          if (!cg.sizes[sIdx].customSku) {
            cg.sizes[sIdx].sku = generateSku(getProductSkuPrefix(), cg.color, val);
          }
        });

        inp.addEventListener('blur', () => {
          renderColorGroups();
        });
      });

      // Reset Custom Size back to standard dropdown
      container.querySelectorAll('.btn-reset-size-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(btn.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (cg && cg.sizes?.[sIdx]) {
            cg.sizes[sIdx].size = 'M';
            renderColorGroups();
          }
        });
      });

      // SKU input change
      container.querySelectorAll('.var-sku-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg || !cg.sizes?.[sIdx]) return;

          cg.sizes[sIdx].sku = e.target.value.trim().toUpperCase();
          cg.sizes[sIdx].customSku = true; // User manually customized this SKU
        });

        inp.addEventListener('blur', () => {
          renderColorGroups();
        });
      });

      // Stock input change
      container.querySelectorAll('.var-stock-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg || !cg.sizes?.[sIdx]) return;

          const val = parseInt(e.target.value, 10);
          cg.sizes[sIdx].stock = isNaN(val) ? 0 : Math.max(0, val);
          updateTotalStockDisplay();
        });

        inp.addEventListener('blur', () => {
          renderColorGroups();
        });
      });
    }

    function attachFormListeners() {
      // Primary cover image live preview
      const mainImgInp = container.querySelector('#pe-main-img-url');
      const mainPreviewBox = container.querySelector('#main-img-preview-box');
      mainImgInp?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (mainPreviewBox) {
          mainPreviewBox.innerHTML = `<img src="${url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';">`;
        }
      });

      // Primary cover image file upload
      const mainFileInput = container.querySelector('#pe-main-file-input');
      mainFileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;
          if (mainImgInp) mainImgInp.value = dataUrl;
          if (mainPreviewBox) {
            mainPreviewBox.innerHTML = `<img src="${dataUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
        };
        reader.readAsDataURL(file);
      });

      // When Garment Title changes, update auto-generated SKUs
      const nameInp = container.querySelector('#pe-name');
      nameInp?.addEventListener('blur', () => {
        const prefix = getProductSkuPrefix();
        colorVariants.forEach(cg => {
          (cg.sizes || []).forEach(s => {
            if (!s.customSku) {
              s.sku = generateSku(prefix, cg.color, s.size);
            }
          });
        });
        renderColorGroups();
      });

      // + Add Colour Button
      container.querySelector('#btn-add-colour')?.addEventListener('click', () => {
        const prefix = getProductSkuPrefix();
        const existingColorNames = new Set(colorVariants.map(c => c.color.toLowerCase()));
        
        let newName = 'Olive';
        const candidateNames = ['Olive', 'Terracotta', 'Sage Green', 'Noir Black', 'Ivory Cream', 'Rose Sand'];
        for (const cand of candidateNames) {
          if (!existingColorNames.has(cand.toLowerCase())) {
            newName = cand;
            break;
          }
        }

        const newGroup = {
          id: 'cg_' + Math.random().toString(36).substring(2, 9),
          color: newName,
          color_code: '#8C7A6B',
          image_url: '',
          isExpanded: true,
          sizes: [
            { id: 'sz_' + Math.random().toString(36).substring(2, 9), size: 'XS', stock: 5, sku: generateSku(prefix, newName, 'XS'), customSku: false },
            { id: 'sz_' + Math.random().toString(36).substring(2, 9), size: 'S', stock: 10, sku: generateSku(prefix, newName, 'S'), customSku: false },
            { id: 'sz_' + Math.random().toString(36).substring(2, 9), size: 'M', stock: 15, sku: generateSku(prefix, newName, 'M'), customSku: false },
            { id: 'sz_' + Math.random().toString(36).substring(2, 9), size: 'L', stock: 10, sku: generateSku(prefix, newName, 'L'), customSku: false },
            { id: 'sz_' + Math.random().toString(36).substring(2, 9), size: 'XL', stock: 5, sku: generateSku(prefix, newName, 'XL'), customSku: false }
          ]
        };

        colorVariants.push(newGroup);
        renderColorGroups();

        // Focus colour name input on the newly added group
        setTimeout(() => {
          const newInp = container.querySelector(`.variant-color-group[data-group-id="${newGroup.id}"] .var-color-name`);
          if (newInp) {
            newInp.focus();
            newInp.select();
          }
        }, 50);
      });

      // Save Garment Handler
      const saveHandler = async (e) => {
        if (e) e.preventDefault();

        const name = container.querySelector('#pe-name')?.value.trim();
        if (!name) {
          window.MB_ADMIN_SHELL?.showToast('Please provide a garment title', 'warning');
          container.querySelector('#pe-name')?.focus();
          return;
        }

        // Validate variants
        const validation = validateVariantState();
        if (validation.hasErrors) {
          // Expand all groups that have errors
          colorVariants.forEach(cg => {
            if (
              validation.emptyColors.has(cg.id) || 
              validation.duplicateSizesByGroup.has(cg.id) ||
              (cg.sizes || []).some(s => validation.duplicateSkus.has((s.sku || '').trim().toUpperCase()) || validation.invalidStocks.has(s.id) || validation.emptySkus.has(s.id))
            ) {
              cg.isExpanded = true;
            }
          });
          renderColorGroups();

          let msg = 'Please resolve variant validation errors before saving';
          if (validation.duplicateSkus.size > 0) {
            msg = `Duplicate SKU found: ${Array.from(validation.duplicateSkus).join(', ')}. All SKUs must be unique.`;
          } else if (validation.duplicateSizesByGroup.size > 0) {
            msg = 'Duplicate size variants found within the same colour.';
          } else if (validation.emptyColors.size > 0) {
            msg = 'Please provide a name for all colour variants.';
          }
          window.MB_ADMIN_SHELL?.showToast(msg, 'error');
          return;
        }

        const price = parseFloat(container.querySelector('#pe-price')?.value) || 0;
        const salePriceVal = container.querySelector('#pe-sale-price')?.value;
        const salePrice = salePriceVal ? parseFloat(salePriceVal) : null;
        const catSelect = container.querySelector('#pe-category');
        const selectedOpt = catSelect?.options[catSelect.selectedIndex];
        const categoryId = selectedOpt?.value || '';
        const categorySlug = selectedOpt?.getAttribute('data-slug') || 'dresses';
        const status = container.querySelector('#pe-status')?.value || 'active';
        const desc = container.querySelector('#pe-desc')?.value.trim() || '';
        const featured = container.querySelector('#pe-featured')?.checked || false;
        const newArrival = container.querySelector('#pe-new')?.checked || false;
        const mainImage = container.querySelector('#pe-main-img-url')?.value.trim() || 
          colorVariants[0]?.image_url || 
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';

        // Flatten colour-grouped variants back into database-compatible flat variants
        const flatVariants = [];
        let totalStock = 0;
        const cleanSkuBase = getProductSkuPrefix();

        colorVariants.forEach((cg, cIdx) => {
          const colName = (cg.color || `Colour ${cIdx + 1}`).trim();
          const colImg = cg.image_url?.trim() || mainImage;

          (cg.sizes || []).forEach(s => {
            const stockQty = parseInt(s.stock, 10) || 0;
            totalStock += stockQty;
            const finalSku = (s.sku || generateSku(cleanSkuBase, colName, s.size)).trim().toUpperCase();

            flatVariants.push({
              size: s.size,
              color: colName,
              color_code: cg.color_code || null,
              stock: stockQty,
              stock_qty: stockQty,
              sku: finalSku,
              image_url: colImg
            });
          });
        });

        // Assemble Gallery: Cover image + distinct variant images
        const gallery = [mainImage];
        colorVariants.forEach(cg => {
          if (cg.image_url && cg.image_url.trim() && !gallery.includes(cg.image_url.trim())) {
            gallery.push(cg.image_url.trim());
          }
        });

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const updatedProduct = {
          id: product.id || `prod-${Date.now()}`,
          name,
          slug,
          sku: cleanSkuBase,
          category: categorySlug,
          categoryId: categoryId,
          price,
          salePrice,
          stock: totalStock,
          lowStockThreshold: 5,
          status,
          featured,
          newArrival,
          shortDescription: desc,
          description: desc,
          fabric: product.fabric || '100% Sustainable Linen Cotton',
          care: product.care || 'Hand wash cold or gentle machine cycle. Dry flat.',
          fit: product.fit || 'Relaxed elegant fit.',
          image: mainImage,
          gallery,
          variants: flatVariants
        };

        try {
          const saveBtn = container.querySelector('#btn-save-product');
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
          }
          await service.saveProduct(updatedProduct);
          window.MB_ADMIN_SHELL?.showToast(`Garment "${name}" successfully saved!`, 'success');
          window.location.hash = '#/products';
        } catch (err) {
          console.error('[ProductEdit] Save error:', err);
          window.MB_ADMIN_SHELL?.showToast(err.message || 'Error saving garment', 'error');
          const saveBtn = container.querySelector('#btn-save-product');
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
          }
        }
      };

      container.querySelector('#btn-save-product')?.addEventListener('click', saveHandler);
      container.querySelector('#product-simple-form')?.addEventListener('submit', saveHandler);
    }

    renderView();
  }
};
