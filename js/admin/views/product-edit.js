/**
 * MARSH BARBARY — ADMIN VIEW: PRODUCT EDIT / CREATE (js/admin/views/product-edit.js)
 * Tabbed Product & Variant Builder Modal (Stack Shack Nutrition Interaction Pattern)
 * 
 * Hierarchy & Architecture:
 * - Centred modal titled "Add Product" / "Edit Product" with fixed header, tabs, and footer
 * - Tab 1: Basic Info (Product Name, Slug, Prices, Category, Description, Flags, Main Images max 5)
 * - Tab 2: Variants (Main Images reuse, Colour Variants, Independent max 5 images per colour,
 *                   Selectable Size Checkbox Grid, Checked-Only Size Inventory Table)
 * - Checked sizes = Active sellable variants
 * - Unchecked sizes = Inactive/unavailable, draft stock preserved in memory
 * - 100% backward compatible with existing Supabase & localStorage persistence
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['product-edit'] = {
  title: 'Garment Builder',

  async render(container, params = {}) {
    const service = window.MB_ADMIN_SERVICE;
    const categories = await service.getCategories();
    const isNew = !params.id || params.id === 'new';

    const FALLBACK_GARMENT_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0Y0RUZFQSIvPjxwYXRoIGQ9Ik03MCAzMCBRMTAwIDUwIDEzMCAzMCBMMTYwIDcwIEwxNDAgODUgTDEzMCA3NSBMMTM1IDIyMCBMNjUgMjIwIEw3MCA3NSBMNjAgODUgTDQwIDcwIFoiIGZpbGw9IiNENUNCQzIiIHN0cm9rZT0iI0I0NzE1NCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTAwIiB5PSIxNDUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjExIiBmaWxsPSIjOEM3QTZCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj5BVEVMSUVSIFBJRUNFPC90ZXh0Pjwvc3ZnPg==";

    // Base product model
    let product = {
      id: '',
      name: '',
      slug: '',
      sku: '',
      category: 'dresses',
      categoryId: '',
      price: 2999,
      salePrice: null,
      stock: 0,
      lowStockThreshold: 5,
      status: 'active',
      featured: false,
      bestSeller: false,
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

    // Supported size list (standard luxury modest sizes + custom if existing)
    const BASE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
    const customExistingSizes = (product.variants || [])
      .map(v => v.size)
      .filter(sz => sz && !BASE_SIZES.includes(sz));
    const ALL_SUPPORTED_SIZES = [...new Set([...BASE_SIZES, ...customExistingSizes])];

    // Main product gallery (up to 5 images independently)
    let mainImages = [];
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      mainImages = product.gallery.filter(Boolean).slice(0, 5);
    } else if (product.image) {
      mainImages = [product.image];
    } else {
      mainImages = ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'];
    }

    // Active Modal Tab state: 'basic' or 'variants'
    let activeTab = 'basic';

    // Helper: Derives SKU prefix from product SKU or name
    function getProductSkuPrefix() {
      const nameInput = document.getElementById('pe-name');
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

    function generateDefaultSku(prefix, col, sz) {
      return `${prefix}-${getColCode(col)}-${getSizeCode(sz)}`;
    }

    // Sync input values from DOM into product model before tab switching or saving
    function syncBasicInfoFromDom() {
      const nameInp = document.getElementById('pe-name');
      if (nameInp) product.name = nameInp.value;

      const slugInp = document.getElementById('pe-slug');
      if (slugInp) product.slug = slugInp.value;

      const priceInp = document.getElementById('pe-price');
      if (priceInp) product.price = parseFloat(priceInp.value) || 0;

      const salePriceInp = document.getElementById('pe-sale-price');
      if (salePriceInp) product.salePrice = salePriceInp.value ? parseFloat(salePriceInp.value) : null;

      const catSelect = document.getElementById('pe-category');
      if (catSelect) {
        const opt = catSelect.options[catSelect.selectedIndex];
        product.categoryId = opt?.value || '';
        product.category = opt?.getAttribute('data-slug') || 'dresses';
      }

      const descInp = document.getElementById('pe-desc');
      if (descInp) product.description = descInp.value;

      const activeCheck = document.getElementById('pe-active');
      if (activeCheck) product.status = activeCheck.checked ? 'active' : 'draft';

      const featCheck = document.getElementById('pe-featured');
      if (featCheck) product.featured = featCheck.checked;

      const bsCheck = document.getElementById('pe-bestseller');
      if (bsCheck) product.bestSeller = bsCheck.checked;

      const newCheck = document.getElementById('pe-new');
      if (newCheck) product.newArrival = newCheck.checked;
    }

    // Group existing flat variants by colour into structured Colour Variant Groups
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
              images: v.image_url ? [v.image_url] : [],
              isExpanded: true,
              sizeConfigs: new Map()
            });
          }
          const g = groups.get(col);
          if (v.image_url && !g.images.includes(v.image_url) && g.images.length < 5) {
            g.images.push(v.image_url);
          }
          const sz = v.size || 'M';
          g.sizeConfigs.set(sz, {
            checked: true,
            stock: v.stock ?? v.stock_qty ?? 5,
            draftStock: v.stock ?? v.stock_qty ?? 5,
            sku: v.sku || generateDefaultSku(prefix, col, sz),
            customSku: Boolean(v.sku)
          });
        });
      }

      // If new product or no variants, provide initial colour
      if (groups.size === 0) {
        const initialCol = 'Natural';
        const defaultConfigs = new Map();
        ALL_SUPPORTED_SIZES.forEach(sz => {
          const isStandardChecked = ['S', 'M', 'L'].includes(sz);
          defaultConfigs.set(sz, {
            checked: isStandardChecked,
            stock: isStandardChecked ? 10 : 5,
            draftStock: 5,
            sku: generateDefaultSku(prefix, initialCol, sz),
            customSku: false
          });
        });

        groups.set(initialCol, {
          id: 'cg_' + Math.random().toString(36).substring(2, 9),
          color: initialCol,
          color_code: '#E5DFD7',
          images: mainImages.length ? [mainImages[0]] : [],
          isExpanded: true,
          sizeConfigs: defaultConfigs
        });
      } else {
        // Ensure all supported sizes exist in each group's sizeConfigs (checked or unchecked)
        groups.forEach((g, col) => {
          ALL_SUPPORTED_SIZES.forEach(sz => {
            if (!g.sizeConfigs.has(sz)) {
              g.sizeConfigs.set(sz, {
                checked: false,
                stock: 5,
                draftStock: 5,
                sku: generateDefaultSku(prefix, col, sz),
                customSku: false
              });
            }
          });
        });
      }

      return Array.from(groups.values());
    }

    let colorVariants = groupVariants(product.variants);

    // Validation checker
    function validateVariantState() {
      const errors = {
        hasErrors: false,
        duplicateSkus: new Set(),
        emptyColors: new Set(),
        noCheckedSizes: new Set(), // groupId
        invalidStocks: new Set()   // sizeId
      };

      const skuOccurrences = new Map();

      colorVariants.forEach(cg => {
        if (!cg.color || !cg.color.trim()) {
          errors.emptyColors.add(cg.id);
          errors.hasErrors = true;
        }

        let checkedCount = 0;
        cg.sizeConfigs.forEach((cfg, sz) => {
          if (cfg.checked) {
            checkedCount++;
            const skuTrim = (cfg.sku || '').trim().toUpperCase();
            if (skuTrim) {
              skuOccurrences.set(skuTrim, (skuOccurrences.get(skuTrim) || 0) + 1);
            }

            const stockNum = Number(cfg.stock);
            if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
              errors.invalidStocks.add(`${cg.id}_${sz}`);
              errors.hasErrors = true;
            }
          }
        });

        if (checkedCount === 0) {
          errors.noCheckedSizes.add(cg.id);
          errors.hasErrors = true;
        }
      });

      skuOccurrences.forEach((count, sku) => {
        if (count > 1) {
          errors.duplicateSkus.add(sku);
          errors.hasErrors = true;
        }
      });

      return errors;
    }

    // Modal Confirmation for destructive actions
    function showConfirmModal({ title, body, confirmText = 'Delete', isDestructive = true, onConfirm }) {
      const existing = document.getElementById('variant-confirm-modal');
      if (existing) existing.remove();

      const modalHtml = `
        <div id="variant-confirm-modal" class="variant-modal-backdrop" style="z-index: 10050;">
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
      modalEl.querySelector('#btn-modal-cancel').addEventListener('click', () => modalEl.remove());
      modalEl.querySelector('#btn-modal-confirm').addEventListener('click', () => {
        modalEl.remove();
        if (typeof onConfirm === 'function') onConfirm();
      });
    }

    // Assign main image to a colour variant modal
    function promptAssignMainImageToColor(src) {
      if (colorVariants.length === 0) {
        window.MB_ADMIN_SHELL?.showToast('Please add a colour variant first', 'warning');
        return;
      }
      if (colorVariants.length === 1) {
        const cg = colorVariants[0];
        cg.images = cg.images || [];
        if (cg.images.length >= 5) {
          window.MB_ADMIN_SHELL?.showToast(`Colour "${cg.color}" already has 5 images (maximum limit)`, 'warning');
          return;
        }
        if (cg.images.includes(src)) {
          window.MB_ADMIN_SHELL?.showToast(`Image is already in "${cg.color}" gallery`, 'info');
          return;
        }
        cg.images.push(src);
        renderTabContent();
        window.MB_ADMIN_SHELL?.showToast(`Image assigned to colour "${cg.color}"`, 'success');
        return;
      }

      const existing = document.getElementById('assign-image-modal');
      if (existing) existing.remove();

      const modalHtml = `
        <div id="assign-image-modal" class="variant-modal-backdrop" style="z-index: 10050;">
          <div class="variant-modal-card" style="max-width: 380px;">
            <h3 class="variant-modal-title" style="font-size: 18px; margin-bottom: 6px;">Assign to Colour Variant</h3>
            <p style="font-size: 12.5px; color: #655850; margin-bottom: 16px;">Select which colour gallery should receive this image:</p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
              ${colorVariants.map((c, i) => `
                <button type="button" class="btn-select-assign-col admin-btn admin-btn-outline" data-cidx="${i}" style="justify-content: flex-start; gap: 10px; padding: 8px 12px; font-size: 13px;">
                  <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${c.color_code || '#B47154'}; border: 1px solid rgba(0,0,0,0.15);"></span>
                  <span style="font-weight: 600;">${c.color}</span>
                  <span style="font-size: 11px; color: #8C7A6B; margin-left: auto;">${(c.images || []).length}/5 images</span>
                </button>
              `).join('')}
            </div>
            <div style="text-align: right;">
              <button type="button" id="btn-close-assign-modal" class="admin-btn admin-btn-sm admin-btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modalEl = document.getElementById('assign-image-modal');
      modalEl.querySelector('#btn-close-assign-modal')?.addEventListener('click', () => modalEl.remove());
      modalEl.querySelectorAll('.btn-select-assign-col').forEach(btn => {
        btn.addEventListener('click', () => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const cg = colorVariants[cIdx];
          modalEl.remove();
          if (!cg) return;
          cg.images = cg.images || [];
          if (cg.images.length >= 5) {
            window.MB_ADMIN_SHELL?.showToast(`Colour "${cg.color}" already has 5 images (maximum limit)`, 'warning');
            return;
          }
          if (cg.images.includes(src)) {
            window.MB_ADMIN_SHELL?.showToast(`Image is already in "${cg.color}" gallery`, 'info');
            return;
          }
          cg.images.push(src);
          renderTabContent();
          window.MB_ADMIN_SHELL?.showToast(`Image assigned to "${cg.color}"`, 'success');
        });
      });
    }

    // Render the Centred Product Builder Modal
    function renderView() {
      container.innerHTML = `
        <div class="mb-product-modal-backdrop" id="product-modal-backdrop">
          <div class="mb-product-modal-dialog" id="product-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-main-title">
            
            <!-- 1. Fixed Header -->
            <div class="mb-product-modal-header">
              <div>
                <div class="mb-modal-kicker">Marsh Barbary Atelier Catalog</div>
                <h2 class="mb-modal-title" id="modal-main-title">
                  ${isNew ? 'Add Product' : `Edit: ${product.name || 'Garment'}`}
                </h2>
              </div>
              <button type="button" class="mb-modal-close-btn" id="btn-modal-close" title="Close & Cancel">
                &times;
              </button>
            </div>

            <!-- 2. Fixed Tab Bar -->
            <div class="mb-product-modal-tabs">
              <button type="button" class="mb-product-modal-tab ${activeTab === 'basic' ? 'active' : ''}" data-tab="basic" id="tab-btn-basic">
                <span>1. Basic Info</span>
              </button>
              <button type="button" class="mb-product-modal-tab ${activeTab === 'variants' ? 'active' : ''}" data-tab="variants" id="tab-btn-variants">
                <span>2. Variants</span>
                <span class="mb-tab-pill" id="tab-variants-pill">
                  ${colorVariants.length} ${colorVariants.length === 1 ? 'colour' : 'colours'}
                </span>
              </button>
            </div>

            <!-- 3. Scrollable Modal Body -->
            <div class="mb-product-modal-body" id="modal-body-container">
              <!-- Rendered via renderTabContent() -->
            </div>

            <!-- 4. Fixed Footer -->
            <div class="mb-product-modal-footer">
              <div class="mb-footer-summary">
                <span>Total Inventory:</span>
                <span id="footer-total-units" class="mb-footer-stock-highlight">0 Units</span>
                <span style="color: #A09387;">•</span>
                <span id="footer-active-variants-count">0 Active Variants</span>
              </div>
              <div class="mb-footer-actions">
                <button type="button" id="btn-footer-cancel" class="admin-btn admin-btn-outline admin-btn-sm" style="padding: 7px 18px;">
                  Cancel
                </button>
                <button type="button" id="btn-save-product" class="admin-btn admin-btn-primary admin-btn-sm" style="padding: 7px 22px; font-weight: 600;">
                  ${isNew ? 'Publish Product' : 'Save Product'}
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      renderTabContent();
      attachGlobalModalListeners();
      updateFooterStockSummary();
    }

    // Render Tab Content (Preserves all state between tab switches)
    function renderTabContent() {
      const bodyEl = container.querySelector('#modal-body-container');
      if (!bodyEl) return;

      if (activeTab === 'basic') {
        renderBasicInfoTab(bodyEl);
      } else {
        renderVariantsTab(bodyEl);
      }
    }

    /* --------------------------------------------------------------------------
       TAB 1: BASIC INFO
       -------------------------------------------------------------------------- */
    function renderBasicInfoTab(bodyEl) {
      const isMaxMainImages = mainImages.length >= 5;

      bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Section A: Main Product Images (Max 5 images) -->
          <div class="mb-image-section-card">
            <div class="mb-image-section-header">
              <div>
                <span class="mb-size-section-label">Main Product Images</span>
                <div style="font-size: 12px; color: #8C7A6B; margin-top: 2px;">
                  Upload up to 5 photos for the main product. The first photo is the primary cover image.
                </div>
              </div>
              <span class="mb-image-counter-pill ${isMaxMainImages ? 'limit-reached' : ''}">
                ${mainImages.length}/5 images ${isMaxMainImages ? '(Limit Reached)' : ''}
              </span>
            </div>

            <!-- Image Add Bar -->
            <div class="mb-image-input-bar">
              <input type="url" id="inp-main-img-url" class="admin-input" placeholder="https://images.unsplash.com/... or direct image link" style="flex: 1; min-width: 260px;" ${isMaxMainImages ? 'disabled' : ''}>
              <button type="button" id="btn-add-main-url" class="admin-btn admin-btn-outline admin-btn-sm" ${isMaxMainImages ? 'disabled' : ''}>
                + Add URL
              </button>
              <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: ${isMaxMainImages ? 'not-allowed' : 'pointer'}; opacity: ${isMaxMainImages ? '0.5' : '1'}; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Upload Image</span>
                <input type="file" id="inp-main-img-file" accept="image/*" style="display: none;" ${isMaxMainImages ? 'disabled' : ''}>
              </label>
            </div>

            <!-- Image Gallery Grid -->
            <div class="mb-gallery-grid" id="main-gallery-grid">
              ${mainImages.map((src, idx) => `
                <div class="mb-gallery-card ${idx === 0 ? 'is-primary' : ''}">
                  <div class="mb-gallery-card-img-wrap">
                    <img src="${src}" alt="Main view ${idx + 1}" onerror="this.onerror=null; this.src='${FALLBACK_GARMENT_SVG}';">
                    ${idx === 0 ? '<span class="mb-primary-badge">★ Primary Cover</span>' : ''}
                  </div>
                  <div class="mb-gallery-card-actions">
                    ${idx !== 0 ? `
                      <button type="button" class="mb-btn-set-primary btn-set-main-primary" data-idx="${idx}">
                        Set Primary
                      </button>
                    ` : '<span style="font-size:10px; font-weight:700; color:#B47154;">Primary</span>'}
                    <button type="button" class="mb-btn-remove-gallery-img btn-del-main-img" data-idx="${idx}" title="Remove image">
                      &times;
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section B: General Information -->
          <div class="admin-card" style="padding: 20px; border: 1px solid #E6DDD5; border-radius: 8px;">
            <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #443E3A; margin-bottom: 16px; border-bottom: 1px solid #EFEAE3; padding-bottom: 8px;">
              Product Details & Attributes
            </div>

            <!-- Product Title & Slug -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
              <div class="admin-form-group" style="margin: 0;">
                <label class="admin-label" for="pe-name">Product Name *</label>
                <input type="text" id="pe-name" class="admin-input" required value="${product.name}" placeholder="e.g. Sienna Linen Maxi Dress" style="width: 100%;">
              </div>
              <div class="admin-form-group" style="margin: 0;">
                <label class="admin-label" for="pe-slug">URL Slug *</label>
                <input type="text" id="pe-slug" class="admin-input" required value="${product.slug || ''}" placeholder="sienna-linen-maxi-dress" style="width: 100%;">
              </div>
            </div>

            <!-- Price, Compare-At Price, Category -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 14px;">
              <div class="admin-form-group" style="margin: 0;">
                <label class="admin-label" for="pe-price">Base Price (INR ₹) *</label>
                <input type="number" id="pe-price" class="admin-input" required min="0" value="${product.price}" style="width: 100%;">
              </div>
              <div class="admin-form-group" style="margin: 0;">
                <label class="admin-label" for="pe-sale-price">Compare-at Price (INR ₹)</label>
                <input type="number" id="pe-sale-price" class="admin-input" min="0" value="${product.salePrice || ''}" placeholder="Leave blank if no sale" style="width: 100%;">
              </div>
              <div class="admin-form-group" style="margin: 0;">
                <label class="admin-label" for="pe-category">Category *</label>
                <select id="pe-category" class="admin-select" style="width: 100%;">
                  ${categories.map(c => `
                    <option value="${c.id}" data-slug="${c.slug}" ${(product.categoryId === c.id || product.category === c.slug || product.category === c.id) ? 'selected' : ''}>${c.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Description -->
            <div class="admin-form-group" style="margin-bottom: 16px;">
              <label class="admin-label" for="pe-desc">Description / Editorial Story</label>
              <textarea id="pe-desc" class="admin-textarea" rows="3" placeholder="Crafted from 100% pure organic flax linen with a relaxed silhouette..." style="width: 100%; font-size: 13px;">${product.description || product.shortDescription || ''}</textarea>
            </div>

            <!-- Storefront Flags -->
            <div style="display: flex; gap: 24px; align-items: center; padding-top: 12px; border-top: 1px solid #EFEAE3; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: #26201D; cursor: pointer;">
                <input type="checkbox" id="pe-active" ${product.status === 'active' ? 'checked' : ''} style="accent-color: #B47154; width: 15px; height: 15px;">
                Enabled & Visible in Store
              </label>
              <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: #26201D; cursor: pointer;">
                <input type="checkbox" id="pe-featured" ${product.featured ? 'checked' : ''} style="accent-color: #B47154; width: 15px; height: 15px;">
                Featured Product
              </label>
              <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: #26201D; cursor: pointer;">
                <input type="checkbox" id="pe-bestseller" ${product.bestSeller ? 'checked' : ''} style="accent-color: #B47154; width: 15px; height: 15px;">
                Best Seller
              </label>
              <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: #26201D; cursor: pointer;">
                <input type="checkbox" id="pe-new" ${product.newArrival ? 'checked' : ''} style="accent-color: #B47154; width: 15px; height: 15px;">
                New Arrival
              </label>
            </div>
          </div>

        </div>
      `;

      attachBasicInfoListeners();
    }

    function attachBasicInfoListeners() {
      const nameInp = document.getElementById('pe-name');
      const slugInp = document.getElementById('pe-slug');

      nameInp?.addEventListener('input', (e) => {
        product.name = e.target.value;
        const autoSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (slugInp && (!product.slug || product.slug === autoSlug.slice(0, -1))) {
          slugInp.value = autoSlug;
          product.slug = autoSlug;
        }

        // Auto-update non-custom variant SKUs
        const prefix = getProductSkuPrefix();
        colorVariants.forEach(cg => {
          cg.sizeConfigs.forEach((cfg, sz) => {
            if (!cfg.customSku) {
              cfg.sku = generateDefaultSku(prefix, cg.color, sz);
            }
          });
        });
      });

      slugInp?.addEventListener('input', (e) => {
        product.slug = e.target.value.trim();
      });

      // Add main image via direct URL
      const addUrlBtn = document.getElementById('btn-add-main-url');
      const urlInp = document.getElementById('inp-main-img-url');

      const handleAddMainUrl = () => {
        const url = urlInp?.value.trim();
        if (!url) return;
        if (mainImages.length >= 5) {
          window.MB_ADMIN_SHELL?.showToast('Main product gallery can contain a maximum of 5 images', 'warning');
          return;
        }
        mainImages.push(url);
        urlInp.value = '';
        renderTabContent();
      };

      addUrlBtn?.addEventListener('click', handleAddMainUrl);
      urlInp?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddMainUrl();
        }
      });

      // Upload main image via file picker
      const fileInp = document.getElementById('inp-main-img-file');
      fileInp?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (mainImages.length >= 5) {
          window.MB_ADMIN_SHELL?.showToast('Main product gallery can contain a maximum of 5 images', 'warning');
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          mainImages.push(evt.target.result);
          renderTabContent();
        };
        reader.readAsDataURL(file);
      });

      // Set as primary cover image
      container.querySelectorAll('.btn-set-main-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (idx > 0 && idx < mainImages.length) {
            const [selected] = mainImages.splice(idx, 1);
            mainImages.unshift(selected);
            renderTabContent();
            window.MB_ADMIN_SHELL?.showToast('Primary cover image updated', 'info');
          }
        });
      });

      // Delete main image
      container.querySelectorAll('.btn-del-main-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-idx'), 10);
          if (mainImages.length <= 1) {
            window.MB_ADMIN_SHELL?.showToast('A product requires at least one cover image', 'warning');
            return;
          }
          mainImages.splice(idx, 1);
          renderTabContent();
        });
      });
    }

    /* --------------------------------------------------------------------------
       TAB 2: VARIANTS
       -------------------------------------------------------------------------- */
    function renderVariantsTab(bodyEl) {
      const errors = validateVariantState();

      bodyEl.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Section 1: Main Product Images Reuse Panel -->
          <div class="mb-variant-main-images-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <span class="mb-size-section-label">Main Product Images</span>
                <div style="font-size: 12px; color: #8C7A6B;">
                  Click "+ Use in Colour" on any main image below to assign it to a colour variant without re-uploading.
                </div>
              </div>
              <span class="mb-counter-badge" style="font-size: 11px; color: #8C7A6B;">
                ${mainImages.length} available
              </span>
            </div>

            <div class="mb-main-images-strip">
              ${mainImages.map((src, idx) => `
                <div class="mb-main-image-thumb-card">
                  <img src="${src}" alt="Main view ${idx + 1}" onerror="this.onerror=null; this.src='${FALLBACK_GARMENT_SVG}';">
                  <button type="button" class="mb-btn-use-main-img btn-reuse-main-img" data-src="${src}">
                    + Use in Colour
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: Product Variants Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; border-bottom: 1px solid #E6DDD5; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-family: var(--admin-font-serif); font-size: 22px; font-weight: 600; color: #26201D; margin: 0 0 4px 0;">
                Product Variants
              </h3>
              <p style="font-size: 12.5px; color: #8C7A6B; margin: 0;">
                Add colours and select which sizes are available for each colour.
              </p>
            </div>
            <button type="button" id="btn-add-colour-variant" class="admin-btn admin-btn-primary admin-btn-sm" style="font-size: 12px; padding: 7px 16px; background: #26201D; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>+ Add Colour Variant</span>
            </button>
          </div>

          <!-- Section 3: Colour Variant Cards Accordion -->
          <div id="colour-variants-cards-list" style="display: flex; flex-direction: column; gap: 16px;">
            ${colorVariants.map((cg, cIdx) => {
              const checkedSizes = [];
              let totalUnitsInGroup = 0;
              cg.sizeConfigs.forEach((cfg, sz) => {
                if (cfg.checked) {
                  checkedSizes.push({ size: sz, ...cfg });
                  totalUnitsInGroup += parseInt(cfg.stock, 10) || 0;
                }
              });

              const isMaxColorImages = (cg.images || []).length >= 5;
              const hasNoCheckedSizes = errors.noCheckedSizes.has(cg.id);
              const hasColorNameError = errors.emptyColors.has(cg.id);

              return `
                <div class="variant-color-group ${cg.isExpanded ? 'is-expanded' : ''}" data-cidx="${cIdx}" data-group-id="${cg.id}">
                  
                  <!-- Card Header Bar -->
                  <div class="variant-group-header" data-action="toggle-colour-group" data-cidx="${cIdx}">
                    <div class="variant-header-left">
                      <span class="variant-chevron">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                      
                      <!-- Swatch Thumbnail -->
                      <div class="variant-swatch-thumb">
                        ${cg.images && cg.images.length > 0
                          ? `<img src="${cg.images[0]}" alt="${cg.color}" onerror="this.onerror=null; this.src='${FALLBACK_GARMENT_SVG}';">`
                          : (cg.color_code 
                              ? `<div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${cg.color_code}; border: 1px solid rgba(0,0,0,0.15);"></div>`
                              : `<span style="font-size: 10px; color: #8C7A6B;">Swatch</span>`
                            )
                        }
                      </div>

                      <div class="variant-header-info">
                        <span class="variant-color-title">${cg.color || '<em style="color:#DC2626;">Unnamed Colour</em>'}</span>
                        ${cg.color_code ? `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${cg.color_code}; border:1px solid #CCC;" title="${cg.color_code}"></span>` : ''}
                        <span class="variant-count-badge">${(cg.images || []).length}/5 images • ${checkedSizes.length} active sizes • ${totalUnitsInGroup} units</span>
                        ${hasNoCheckedSizes ? `<span class="variant-field-error" style="margin:0;">⚠ No sizes selected</span>` : ''}
                      </div>
                    </div>

                    <!-- Header Action Buttons -->
                    <div class="variant-header-actions" onclick="event.stopPropagation();">
                      <button type="button" class="variant-action-btn btn-duplicate-colour" data-cidx="${cIdx}" title="Duplicate this colour and checked sizes">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>Duplicate</span>
                      </button>
                      <button type="button" class="variant-action-btn btn-delete btn-remove-colour" data-cidx="${cIdx}" title="Remove colour">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  <!-- Card Body -->
                  <div class="variant-group-body">
                    
                    <!-- Colour Identity & Images Row -->
                    <div style="display: grid; grid-template-columns: 240px 1fr; gap: 20px; align-items: start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #F0EAE2;">
                      
                      <!-- Left: Colour Name & Hex -->
                      <div>
                        <div style="margin-bottom: 12px;">
                          <label class="admin-label" style="font-size: 11px;">Colour Name *</label>
                          <input type="text" class="variant-input-sm var-color-name-input ${hasColorNameError ? 'has-error' : ''}" data-cidx="${cIdx}" value="${cg.color || ''}" placeholder="e.g. Natural, Noir Black" required>
                          ${hasColorNameError ? `<div class="variant-field-error">Colour name is required</div>` : ''}
                        </div>
                        <div>
                          <label class="admin-label" style="font-size: 11px;">Swatch Tone / Hex (Optional)</label>
                          <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="color" class="var-color-picker" data-cidx="${cIdx}" value="${cg.color_code || '#B47154'}" style="width: 32px; height: 32px; border: 1px solid #D5CBC2; border-radius: 4px; padding: 2px; cursor: pointer; background: transparent;">
                            <input type="text" class="variant-input-sm var-color-code-input" data-cidx="${cIdx}" value="${cg.color_code || ''}" placeholder="#E5DFD7">
                          </div>
                        </div>
                      </div>

                      <!-- Right: Colour Variant Images (Independent Max 5 images) -->
                      <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <label class="admin-label" style="font-size: 11px; margin: 0;">Colour Photos (${(cg.images || []).length}/5 images)</label>
                          <span class="mb-image-counter-pill ${isMaxColorImages ? 'limit-reached' : ''}" style="font-size: 10px;">
                            ${isMaxColorImages ? 'Max 5 Reached' : 'Up to 5 images'}
                          </span>
                        </div>

                        <div class="mb-image-input-bar" style="margin-bottom: 8px;">
                          <input type="url" class="variant-input-sm var-img-url-input" data-cidx="${cIdx}" placeholder="https://... direct image link" style="flex: 1;" ${isMaxColorImages ? 'disabled' : ''}>
                          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-add-color-img-url" data-cidx="${cIdx}" ${isMaxColorImages ? 'disabled' : ''}>
                            + Add URL
                          </button>
                          <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: ${isMaxColorImages ? 'not-allowed' : 'pointer'}; opacity: ${isMaxColorImages ? '0.5' : '1'}; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span>Upload</span>
                            <input type="file" class="var-img-file-input" data-cidx="${cIdx}" accept="image/*" style="display: none;" ${isMaxColorImages ? 'disabled' : ''}>
                          </label>
                        </div>

                        <!-- Colour Images Thumbnails Strip -->
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                          ${(cg.images || []).map((imgUrl, imgIdx) => `
                            <div style="width: 60px; height: 75px; border-radius: 4px; overflow: hidden; border: 1px solid #DDD3C8; position: relative; background: #FAF8F5;">
                              <img src="${imgUrl}" alt="Colour photo ${imgIdx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${FALLBACK_GARMENT_SVG}';">
                              <button type="button" class="btn-del-color-img" data-cidx="${cIdx}" data-imgidx="${imgIdx}" title="Remove photo" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.65); color: #FFF; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">
                                &times;
                              </button>
                            </div>
                          `).join('')}
                          ${(!cg.images || cg.images.length === 0) ? `
                            <span style="font-size: 11.5px; color: #8C7A6B; align-self: center;">No photos added yet for this colour.</span>
                          ` : ''}
                        </div>
                      </div>

                    </div>

                    <!-- AVAILABLE SIZES CHECKBOX GRID -->
                    <div class="mb-size-checkbox-section">
                      <div class="mb-size-section-label">Available Sizes</div>
                      <div class="mb-size-section-sub">
                        Select which sizes are available for <strong>${cg.color || 'this colour'}</strong>. Only checked sizes have active stock and become purchasable in store.
                      </div>

                      <div class="mb-size-checkbox-grid">
                        ${ALL_SUPPORTED_SIZES.map(sz => {
                          const cfg = cg.sizeConfigs.get(sz) || { checked: false, stock: 5 };
                          const isChecked = cfg.checked;

                          return `
                            <label class="mb-size-tile ${isChecked ? 'is-checked' : ''}" data-cidx="${cIdx}" data-size="${sz}">
                              <input type="checkbox" class="mb-size-tile-checkbox var-size-checkbox" data-cidx="${cIdx}" data-size="${sz}" ${isChecked ? 'checked' : ''}>
                              <span>${sz}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <!-- STOCK CONFIGURATION FOR CHECKED SIZES ONLY -->
                    <div class="mb-checked-sizes-table-wrap">
                      ${checkedSizes.length > 0 ? `
                        <table class="mb-checked-sizes-table">
                          <thead>
                            <tr>
                              <th style="width: 120px;">Size</th>
                              <th>SKU</th>
                              <th style="width: 130px; text-align: center;">Stock Qty</th>
                              <th style="width: 90px; text-align: right;">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${checkedSizes.map(s => {
                              const cleanSku = (s.sku || '').trim().toUpperCase();
                              const isDupSku = errors.duplicateSkus.has(cleanSku);
                              const isInvalidStock = errors.invalidStocks.has(`${cg.id}_${s.size}`);

                              return `
                                <tr>
                                  <td>
                                    <span class="mb-size-badge-pill">${s.size}</span>
                                  </td>
                                  <td>
                                    <input type="text" class="variant-input-sm variant-sku-input var-sku-input ${isDupSku ? 'has-error' : ''}" data-cidx="${cIdx}" data-size="${s.size}" value="${s.sku || ''}" placeholder="e.g. MB-DRS-001-NAT-${s.size}">
                                    ${isDupSku ? `<div class="variant-field-error">⚠ Duplicate SKU across variants</div>` : ''}
                                  </td>
                                  <td style="text-align: center;">
                                    <input type="number" min="0" step="1" class="variant-input-sm variant-stock-input var-stock-input ${isInvalidStock ? 'has-error' : ''}" data-cidx="${cIdx}" data-size="${s.size}" value="${s.stock}">
                                    ${isInvalidStock ? `<div class="variant-field-error">Min 0</div>` : ''}
                                  </td>
                                  <td style="text-align: right;">
                                    <button type="button" class="variant-btn-remove-row btn-uncheck-size" data-cidx="${cIdx}" data-size="${s.size}" title="Mark size unavailable">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      <span>Remove</span>
                                    </button>
                                  </td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      ` : `
                        <div style="padding: 24px; text-align: center; color: #8C7A6B; font-size: 13px;">
                          No sizes selected for this colour. Check one or more available sizes above to configure inventory and SKUs.
                        </div>
                      `}
                    </div>

                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>
      `;

      attachVariantsTabListeners();
    }

    function attachVariantsTabListeners() {
      const prefix = getProductSkuPrefix();

      // + Add Colour Variant Button
      document.getElementById('btn-add-colour-variant')?.addEventListener('click', () => {
        const existingColNames = new Set(colorVariants.map(c => c.color.toLowerCase()));
        const candidateNames = ['Black', 'Olive', 'Sage Green', 'Terracotta', 'Noir Black', 'Ivory Cream', 'Rose Sand'];
        let newColName = 'Black';
        for (const cand of candidateNames) {
          if (!existingColNames.has(cand.toLowerCase())) {
            newColName = cand;
            break;
          }
        }

        const newSizeConfigs = new Map();
        ALL_SUPPORTED_SIZES.forEach(sz => {
          const isStandard = ['S', 'M', 'L'].includes(sz);
          newSizeConfigs.set(sz, {
            checked: isStandard,
            stock: isStandard ? 10 : 5,
            draftStock: 5,
            sku: generateDefaultSku(prefix, newColName, sz),
            customSku: false
          });
        });

        const newGroup = {
          id: 'cg_' + Math.random().toString(36).substring(2, 9),
          color: newColName,
          color_code: '#8C7A6B',
          images: [],
          isExpanded: true,
          sizeConfigs: newSizeConfigs
        };

        colorVariants.push(newGroup);
        renderTabContent();
        updateFooterStockSummary();
        window.MB_ADMIN_SHELL?.showToast(`Added colour "${newColName}"`, 'success');
      });

      // Expand / Collapse Colour Card
      container.querySelectorAll('.variant-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
          if (e.target.closest('.variant-header-actions')) return;
          const cIdx = parseInt(header.getAttribute('data-cidx'), 10);
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].isExpanded = !colorVariants[cIdx].isExpanded;
            renderTabContent();
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

          const newName = `${orig.color} (Copy)`;
          const clonedConfigs = new Map();
          orig.sizeConfigs.forEach((cfg, sz) => {
            clonedConfigs.set(sz, {
              checked: cfg.checked,
              stock: cfg.stock,
              draftStock: cfg.draftStock,
              sku: generateDefaultSku(prefix, newName, sz),
              customSku: false
            });
          });

          const clonedGroup = {
            id: 'cg_' + Math.random().toString(36).substring(2, 9),
            color: newName,
            color_code: orig.color_code || '',
            images: [...(orig.images || [])],
            isExpanded: true,
            sizeConfigs: clonedConfigs
          };

          colorVariants.splice(cIdx + 1, 0, clonedGroup);
          renderTabContent();
          updateFooterStockSummary();
          window.MB_ADMIN_SHELL?.showToast(`Duplicated colour "${orig.color}"`, 'success');
        });
      });

      // Remove Colour Action (with confirmation modal if it has stock)
      container.querySelectorAll('.btn-remove-colour').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const cg = colorVariants[cIdx];
          if (!cg) return;

          if (colorVariants.length <= 1) {
            window.MB_ADMIN_SHELL?.showToast('A product requires at least one colour variant', 'warning');
            return;
          }

          let totalStock = 0;
          let activeSizes = 0;
          cg.sizeConfigs.forEach(cfg => {
            if (cfg.checked) {
              activeSizes++;
              totalStock += parseInt(cfg.stock, 10) || 0;
            }
          });

          if (totalStock > 0) {
            showConfirmModal({
              title: `Remove Colour "${cg.color}"?`,
              body: `Colour "${cg.color}" contains <strong>${activeSizes} active sizes</strong> with <strong>${totalStock} units in stock</strong>. Are you sure you want to remove it?`,
              confirmText: 'Remove Colour',
              isDestructive: true,
              onConfirm: () => {
                colorVariants.splice(cIdx, 1);
                renderTabContent();
                updateFooterStockSummary();
                window.MB_ADMIN_SHELL?.showToast(`Colour "${cg.color}" removed`, 'info');
              }
            });
          } else {
            colorVariants.splice(cIdx, 1);
            renderTabContent();
            updateFooterStockSummary();
          }
        });
      });

      // Colour Name input
      container.querySelectorAll('.var-color-name-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const val = e.target.value;
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].color = val;
            // Update non-custom SKUs
            colorVariants[cIdx].sizeConfigs.forEach((cfg, sz) => {
              if (!cfg.customSku) {
                cfg.sku = generateDefaultSku(prefix, val, sz);
              }
            });
          }
        });

        inp.addEventListener('blur', () => {
          renderTabContent();
        });
      });

      // Colour Code / Hex picker & input
      container.querySelectorAll('.var-color-picker').forEach(picker => {
        picker.addEventListener('input', (e) => {
          const cIdx = parseInt(e.target.getAttribute('data-cidx'), 10);
          const hex = e.target.value;
          if (colorVariants[cIdx]) {
            colorVariants[cIdx].color_code = hex;
            const textInp = container.querySelector(`.var-color-code-input[data-cidx="${cIdx}"]`);
            if (textInp) textInp.value = hex;
          }
        });
      });

      container.querySelectorAll('.var-color-code-input').forEach(textInp => {
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

      // Add Colour Image URL
      container.querySelectorAll('.btn-add-color-img-url').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const group = colorVariants[cIdx];
          if (!group) return;

          const urlInp = container.querySelector(`.var-img-url-input[data-cidx="${cIdx}"]`);
          const url = urlInp?.value.trim();
          if (!url) return;

          if ((group.images || []).length >= 5) {
            window.MB_ADMIN_SHELL?.showToast('A colour variant can contain up to 5 images', 'warning');
            return;
          }

          group.images = group.images || [];
          group.images.push(url);
          urlInp.value = '';
          renderTabContent();
        });
      });

      // Upload Colour Image File
      container.querySelectorAll('.var-img-file-input').forEach(fileInp => {
        fileInp.addEventListener('change', (e) => {
          const cIdx = parseInt(fileInp.getAttribute('data-cidx'), 10);
          const group = colorVariants[cIdx];
          const file = e.target.files?.[0];
          if (!file || !group) return;

          if ((group.images || []).length >= 5) {
            window.MB_ADMIN_SHELL?.showToast('A colour variant can contain up to 5 images', 'warning');
            return;
          }

          const reader = new FileReader();
          reader.onload = (evt) => {
            group.images = group.images || [];
            group.images.push(evt.target.result);
            renderTabContent();
          };
          reader.readAsDataURL(file);
        });
      });

      // Delete Colour Image
      container.querySelectorAll('.btn-del-color-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const imgIdx = parseInt(btn.getAttribute('data-imgidx'), 10);
          const group = colorVariants[cIdx];
          if (group && group.images) {
            group.images.splice(imgIdx, 1);
            renderTabContent();
          }
        });
      });

      // Reuse Main Image in Colour Variant
      container.querySelectorAll('.btn-reuse-main-img').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const src = btn.getAttribute('data-src');
          if (src) promptAssignMainImageToColor(src);
        });
      });

      // TOGGLE SIZE CHECKBOX (Mandatory checkbox behaviour)
      container.querySelectorAll('.var-size-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const cIdx = parseInt(chk.getAttribute('data-cidx'), 10);
          const sz = chk.getAttribute('data-size');
          const cg = colorVariants[cIdx];
          if (!cg) return;

          const cfg = cg.sizeConfigs.get(sz);
          if (!cfg) return;

          const isNowChecked = chk.checked;
          if (!isNowChecked) {
            // Unchecking: preserve stock as draftStock, mark unavailable
            cfg.draftStock = cfg.stock;
            cfg.checked = false;
            window.MB_ADMIN_SHELL?.showToast(`Size ${sz} marked unavailable for ${cg.color}`, 'info');
          } else {
            // Checking: restore previous draftStock, generate SKU if not set
            cfg.checked = true;
            cfg.stock = cfg.draftStock || 5;
            if (!cfg.sku) {
              cfg.sku = generateDefaultSku(prefix, cg.color, sz);
            }
          }

          renderTabContent();
          updateFooterStockSummary();
        });
      });

      // Uncheck / Remove size row from inventory table
      container.querySelectorAll('.btn-uncheck-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cIdx = parseInt(btn.getAttribute('data-cidx'), 10);
          const sz = btn.getAttribute('data-size');
          const cg = colorVariants[cIdx];
          if (!cg) return;

          const cfg = cg.sizeConfigs.get(sz);
          if (cfg) {
            cfg.draftStock = cfg.stock;
            cfg.checked = false;
            renderTabContent();
            updateFooterStockSummary();
            window.MB_ADMIN_SHELL?.showToast(`Size ${sz} marked unavailable`, 'info');
          }
        });
      });

      // SKU input
      container.querySelectorAll('.var-sku-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(inp.getAttribute('data-cidx'), 10);
          const sz = inp.getAttribute('data-size');
          const cg = colorVariants[cIdx];
          if (!cg) return;

          const cfg = cg.sizeConfigs.get(sz);
          if (cfg) {
            cfg.sku = e.target.value.trim().toUpperCase();
            cfg.customSku = true; // User manually edited SKU
          }
        });

        inp.addEventListener('blur', () => {
          renderTabContent();
        });
      });

      // Stock input
      container.querySelectorAll('.var-stock-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const cIdx = parseInt(inp.getAttribute('data-cidx'), 10);
          const sz = inp.getAttribute('data-size');
          const cg = colorVariants[cIdx];
          if (!cg) return;

          const cfg = cg.sizeConfigs.get(sz);
          if (cfg) {
            const val = parseInt(e.target.value, 10);
            cfg.stock = isNaN(val) ? 0 : Math.max(0, val);
            cfg.draftStock = cfg.stock;
            updateFooterStockSummary();
          }
        });

        inp.addEventListener('blur', () => {
          renderTabContent();
        });
      });
    }

    // Attach global modal listeners (Tabs, Cancel, Save, Close)
    function attachGlobalModalListeners() {
      // Tab Switching (Preserves all state!)
      container.querySelector('#tab-btn-basic')?.addEventListener('click', () => {
        if (activeTab === 'basic') syncBasicInfoFromDom();
        activeTab = 'basic';
        container.querySelector('#tab-btn-basic').classList.add('active');
        container.querySelector('#tab-btn-variants').classList.remove('active');
        renderTabContent();
      });

      container.querySelector('#tab-btn-variants')?.addEventListener('click', () => {
        if (activeTab === 'basic') syncBasicInfoFromDom();
        activeTab = 'variants';
        container.querySelector('#tab-btn-variants').classList.add('active');
        container.querySelector('#tab-btn-basic').classList.remove('active');
        renderTabContent();
      });

      // Cancel / Close Buttons
      const handleClose = () => {
        window.location.hash = '#/products';
      };

      container.querySelector('#btn-modal-close')?.addEventListener('click', handleClose);
      container.querySelector('#btn-footer-cancel')?.addEventListener('click', handleClose);
      container.querySelector('#product-modal-backdrop')?.addEventListener('click', (e) => {
        if (e.target.id === 'product-modal-backdrop') {
          handleClose();
        }
      });

      // Save Product Handler
      const saveHandler = async (e) => {
        if (e) e.preventDefault();

        // Sync inputs from Tab 1 if currently open or previously populated
        syncBasicInfoFromDom();

        // 1. Validate Product Name
        const name = (product.name || '').trim();
        if (!name) {
          activeTab = 'basic';
          renderTabContent();
          window.MB_ADMIN_SHELL?.showToast('Please provide a product name', 'warning');
          document.getElementById('pe-name')?.focus();
          return;
        }

        // 2. Validate Price
        const price = Number(product.price);
        if (isNaN(price) || price < 0) {
          activeTab = 'basic';
          renderTabContent();
          window.MB_ADMIN_SHELL?.showToast('Please enter a valid base price (≥ 0)', 'warning');
          document.getElementById('pe-price')?.focus();
          return;
        }

        // 3. Category & Slug
        const categorySlug = product.category || 'dresses';
        const categoryId = product.categoryId || '';
        const slug = (product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

        // 4. Validate Variants
        const validation = validateVariantState();
        if (validation.hasErrors) {
          activeTab = 'variants';
          // Expand all groups that have errors
          colorVariants.forEach(cg => {
            if (validation.emptyColors.has(cg.id) || validation.noCheckedSizes.has(cg.id)) {
              cg.isExpanded = true;
            }
          });
          renderTabContent();

          let msg = 'Please resolve variant validation errors before saving';
          if (validation.emptyColors.size > 0) {
            msg = 'All colour variants must have a colour name.';
          } else if (validation.noCheckedSizes.size > 0) {
            msg = 'Each colour variant must have at least one checked available size.';
          } else if (validation.duplicateSkus.size > 0) {
            msg = `Duplicate SKU found: ${Array.from(validation.duplicateSkus).join(', ')}. All SKUs must be unique.`;
          } else if (validation.invalidStocks.size > 0) {
            msg = 'Stock quantities must be non-negative integers (≥ 0).';
          }

          window.MB_ADMIN_SHELL?.showToast(msg, 'error');
          return;
        }

        // 5. Build purchasable variants from ONLY checked sizes
        const flatVariants = [];
        let totalStockUnits = 0;
        const cleanSkuBase = getProductSkuPrefix();
        const mainCover = mainImages[0] || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';

        colorVariants.forEach(cg => {
          const colName = cg.color.trim();
          const colImg = (cg.images && cg.images.length > 0) ? cg.images[0] : mainCover;

          cg.sizeConfigs.forEach((cfg, sz) => {
            if (cfg.checked) {
              const stockNum = parseInt(cfg.stock, 10) || 0;
              totalStockUnits += stockNum;
              const sku = (cfg.sku || generateDefaultSku(cleanSkuBase, colName, sz)).trim().toUpperCase();

              flatVariants.push({
                size: sz,
                color: colName,
                color_code: cg.color_code || null,
                stock: stockNum,
                stock_qty: stockNum,
                sku: sku,
                image_url: colImg
              });
            }
          });
        });

        // 6. Assemble Complete Gallery (Main product images + distinct colour variant images)
        const combinedGallery = [...mainImages];
        colorVariants.forEach(cg => {
          (cg.images || []).forEach(img => {
            if (img && !combinedGallery.includes(img)) {
              combinedGallery.push(img);
            }
          });
        });

        // 7. Build complete updated Product object
        const updatedProduct = {
          id: product.id || `prod-${Date.now()}`,
          name,
          slug,
          sku: cleanSkuBase,
          category: categorySlug,
          categoryId: categoryId,
          price,
          salePrice: product.salePrice,
          stock: totalStockUnits,
          lowStockThreshold: 5,
          status: product.status || 'active',
          featured: Boolean(product.featured),
          bestSeller: Boolean(product.bestSeller),
          newArrival: Boolean(product.newArrival),
          shortDescription: product.description || '',
          description: product.description || '',
          fabric: product.fabric || '100% Sustainable Linen Cotton',
          care: product.care || 'Hand wash cold or gentle machine cycle. Dry flat.',
          fit: product.fit || 'Relaxed elegant fit.',
          image: mainCover,
          gallery: combinedGallery,
          variants: flatVariants
        };

        // 8. Persist using existing backend service
        const saveBtn = container.querySelector('#btn-save-product');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving Product...';
        }

        try {
          await service.saveProduct(updatedProduct);
          window.MB_ADMIN_SHELL?.showToast(`Product "${name}" successfully saved!`, 'success');
          window.location.hash = '#/products';
        } catch (err) {
          console.error('[ProductBuilderModal] Save error:', err);
          window.MB_ADMIN_SHELL?.showToast(err.message || 'Error saving product', 'error');
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = isNew ? 'Publish Product' : 'Save Product';
          }
        }
      };

      container.querySelector('#btn-save-product')?.addEventListener('click', saveHandler);
    }

    function updateFooterStockSummary() {
      let totalUnits = 0;
      let activeVariantsCount = 0;

      colorVariants.forEach(cg => {
        cg.sizeConfigs.forEach(cfg => {
          if (cfg.checked) {
            activeVariantsCount++;
            totalUnits += parseInt(cfg.stock, 10) || 0;
          }
        });
      });

      const unitsEl = container.querySelector('#footer-total-units');
      if (unitsEl) unitsEl.textContent = `${totalUnits} Units`;

      const variantsEl = container.querySelector('#footer-active-variants-count');
      if (variantsEl) {
        variantsEl.textContent = `${activeVariantsCount} Active Size ${activeVariantsCount === 1 ? 'Variant' : 'Variants'}`;
      }

      const tabPill = container.querySelector('#tab-variants-pill');
      if (tabPill) {
        tabPill.textContent = `${colorVariants.length} ${colorVariants.length === 1 ? 'colour' : 'colours'} • ${activeVariantsCount} sizes`;
      }
    }

    renderView();
  }
};
