/**
 * MARSH BARBARY — ADMIN VIEW: PRODUCT EDIT / CREATE (js/admin/views/product-edit.js)
 * Simplified garment editor:
 * - Direct basic info (Title, Category, Price, Sale Price, Summary, Status)
 * - Main Image URL (URL only with preview)
 * - Color Variants: Color Name, Variant Image URL (URL only), Sizes with stock for each
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

    // Group flat variants by Color
    function groupVariants(vars) {
      const groups = new Map();
      if (Array.isArray(vars) && vars.length > 0) {
        vars.forEach(v => {
          const col = (v.color || 'Natural').trim();
          if (!groups.has(col)) {
            groups.set(col, {
              color: col,
              image_url: v.image_url || '',
              sizes: []
            });
          }
          const g = groups.get(col);
          if (!g.image_url && v.image_url) g.image_url = v.image_url;
          g.sizes.push({
            size: v.size || 'M',
            stock: v.stock ?? v.stock_qty ?? 5,
            sku: v.sku || ''
          });
        });
      }

      if (groups.size === 0) {
        groups.set('Natural', {
          color: 'Natural',
          image_url: product.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85',
          sizes: [
            { size: 'XS', stock: 5 },
            { size: 'S', stock: 10 },
            { size: 'M', stock: 15 },
            { size: 'L', stock: 10 },
            { size: 'XL', stock: 5 }
          ]
        });
      }
      return Array.from(groups.values());
    }

    let colorVariants = groupVariants(product.variants);

    function renderView() {
      container.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 4px;">
              <a href="#/products" style="color: inherit; text-decoration: none;">← Back to Products</a>
            </div>
            <h1 style="font-family: var(--font-serif); font-size: 26px; font-weight: 500; margin: 0; color: var(--mb-admin-text);">
              ${isNew ? 'Create New Garment' : `Edit: ${product.name}`}
            </h1>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/products" class="admin-btn admin-btn-outline admin-btn-sm">Cancel</a>
            <button type="button" id="btn-save-product" class="admin-btn admin-btn-primary admin-btn-sm" style="padding: 7px 20px;">
              ${isNew ? 'Publish Garment' : 'Save Changes'}
            </button>
          </div>
        </div>

        <form id="product-simple-form">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: start;">
            
            <!-- LEFT COLUMN: Basic Info & Primary Image -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              
              <!-- Card 1: Product Essentials -->
              <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border); border-radius: 8px; padding: 20px;">
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 16px; color: var(--mb-admin-text); border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 8px;">
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
                    <label class="admin-label" for="pe-sale-price">Sale Price (INR ₹, optional)</label>
                    <input type="number" id="pe-sale-price" class="admin-input" min="0" value="${product.salePrice || ''}" placeholder="Leave blank" style="width: 100%;">
                  </div>
                </div>

                <div class="admin-form-group" style="margin-bottom: 14px;">
                  <label class="admin-label" for="pe-desc">Description / Editorial Story</label>
                  <textarea id="pe-desc" class="admin-textarea" rows="3" placeholder="Crafted in 100% pure organic flax linen with relaxed silhouette..." style="width: 100%;">${product.description || product.shortDescription || ''}</textarea>
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

              <!-- Card 2: Main Garment Visual -->
              <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border); border-radius: 8px; padding: 20px;">
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 16px; color: var(--mb-admin-text); border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 8px;">
                  2. Primary Product Image
                </div>

                <div class="admin-form-group">
                  <label class="admin-label" for="pe-main-img-url">Main Image URL (URL Only) *</label>
                  <div style="display: flex; gap: 14px; align-items: center; margin-top: 6px;">
                    <div id="main-img-preview-box" style="width: 70px; height: 90px; border-radius: 6px; overflow: hidden; background: #F6F4F0; border: 1px solid #DDD; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                      <img src="${product.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';">
                    </div>
                    <div style="flex: 1;">
                      <input type="url" id="pe-main-img-url" class="admin-input" required value="${product.image || ''}" placeholder="https://images.unsplash.com/... or direct image URL" style="width: 100%; padding: 8px 10px; font-size: 13px;">
                      <p style="font-size: 11px; color: var(--mb-admin-muted); margin: 4px 0 0 0;">Enter direct photo URL. Displays as catalog cover on shop pages.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Color & Size Variants -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="admin-card" style="background: #FFF; border: 1px solid var(--mb-admin-border); border-radius: 8px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--mb-admin-border); padding-bottom: 8px;">
                  <div>
                    <div style="font-weight: 600; font-size: 15px; color: var(--mb-admin-text);">
                      3. Color Variants & Sizes
                    </div>
                    <div style="font-size: 11.5px; color: var(--mb-admin-muted); margin-top: 2px;">
                      Add color names with image URL and stock for each size. In store, clicking the color switches to that variant's photo!
                    </div>
                  </div>
                  <button type="button" id="btn-add-color-variant" class="admin-btn admin-btn-primary admin-btn-sm" style="font-size: 12px; padding: 6px 12px; background: #26201D;">
                    + Add Color Variant
                  </button>
                </div>

                <!-- Container of Color Variants -->
                <div id="color-variants-list" style="display: flex; flex-direction: column; gap: 16px;">
                  <!-- Rendered dynamically -->
                </div>

                <div style="margin-top: 16px; padding: 12px 16px; background: #FBF9F5; border: 1px solid #EBE6DF; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12px; font-weight: 600; color: #555;">Total Inventory Stock:</span>
                  <span id="total-stock-counter" style="font-size: 15px; font-weight: 700; color: #B47154;">0 Units</span>
                </div>
              </div>
            </div>

          </div>
        </form>
      `;

      // Render Color Variant Cards
      renderColorVariantCards();
      attachFormListeners();
    }

    function renderColorVariantCards() {
      const listEl = container.querySelector('#color-variants-list');
      if (!listEl) return;

      listEl.innerHTML = colorVariants.map((vg, vIdx) => `
        <div class="color-var-card" data-vidx="${vIdx}" style="border: 1px solid #E5E5E5; border-radius: 8px; padding: 16px; background: #FFF; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
          
          <!-- Variant Top Row: Preview, Color Name, Image URL, Remove -->
          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap;">
            
            <!-- Image Preview Box -->
            <div class="var-img-preview-box" style="width: 58px; height: 72px; border-radius: 6px; overflow: hidden; background: #F6F4F0; border: 1px solid #DDD; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              ${vg.image_url 
                ? `<img src="${vg.image_url}" alt="Variant" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.opacity='0.5';">`
                : `<span style="color: #999; font-size: 10px; text-align: center;">No Image</span>`
              }
            </div>

            <!-- Color Name & URL Inputs -->
            <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #444;">
                    Color Name *
                  </label>
                  <input type="text" class="admin-input var-color-name" value="${vg.color}" placeholder="e.g. Sage Green, Terracotta" style="width: 100%; padding: 6px 10px; font-size: 13px;" required>
                </div>
                ${colorVariants.length > 1 ? `
                  <button type="button" class="btn-remove-color-var admin-btn" data-vidx="${vIdx}" style="background: transparent; color: #DC2626; border: none; font-size: 12px; cursor: pointer; align-self: flex-end; padding: 6px 8px; font-weight: 600;">
                    ✕ Remove Color
                  </button>
                ` : ''}
              </div>

              <div>
                <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #444;">
                  Variant Image URL (URL Option Only) *
                </label>
                <input type="url" class="admin-input var-img-url" value="${vg.image_url || ''}" placeholder="https://... direct photo URL" style="width: 100%; padding: 6px 10px; font-size: 12px;">
              </div>
            </div>

          </div>

          <!-- Sizes & Stock Section for this Color -->
          <div style="background: #FBF9F5; border-radius: 6px; padding: 12px; border: 1px solid #EBE6DF;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>Sizes & Stock for this Variant</span>
              <button type="button" class="btn-add-size-item admin-btn admin-btn-outline admin-btn-sm" data-vidx="${vIdx}" style="font-size: 10.5px; padding: 3px 8px; background: #FFF;">
                + Add Size
              </button>
            </div>

            <!-- Size Badges Container -->
            <div class="var-sizes-wrap" style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${(vg.sizes || []).map((s, sIdx) => `
                <div class="size-item-pill" data-sidx="${sIdx}" style="display: flex; align-items: center; gap: 6px; background: #FFF; border: 1px solid #D1D5DB; border-radius: 6px; padding: 4px 8px;">
                  <select class="admin-select size-select" style="font-weight: 700; font-size: 12px; padding: 2px 4px; border: none; background: transparent; cursor: pointer;">
                    <option value="XS" ${s.size === 'XS' ? 'selected' : ''}>XS</option>
                    <option value="S" ${s.size === 'S' ? 'selected' : ''}>S</option>
                    <option value="M" ${s.size === 'M' ? 'selected' : ''}>M</option>
                    <option value="L" ${s.size === 'L' ? 'selected' : ''}>L</option>
                    <option value="XL" ${s.size === 'XL' ? 'selected' : ''}>XL</option>
                    <option value="XXL" ${s.size === 'XXL' ? 'selected' : ''}>XXL</option>
                    <option value="Free Size" ${s.size === 'Free Size' ? 'selected' : ''}>Free Size</option>
                  </select>
                  <span style="font-size: 11px; color: #888;">Stock:</span>
                  <input type="number" class="admin-input size-stock-val" value="${s.stock}" min="0" style="width: 52px; padding: 2px 4px; font-size: 12px; text-align: center; border: 1px solid #E5E5E5; border-radius: 4px;">
                  <button type="button" class="btn-remove-size-item" data-vidx="${vIdx}" data-sidx="${sIdx}" style="background: none; border: none; color: #999; cursor: pointer; font-size: 14px; padding: 0 2px; line-height: 1;" title="Remove size">&times;</button>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `).join('');

      updateTotalStockCounter();
      attachVariantEventListeners();
    }

    function updateTotalStockCounter() {
      let total = 0;
      colorVariants.forEach(vg => {
        (vg.sizes || []).forEach(s => {
          total += parseInt(s.stock, 10) || 0;
        });
      });
      const counterEl = container.querySelector('#total-stock-counter');
      if (counterEl) counterEl.textContent = `${total} Units`;
    }

    function attachVariantEventListeners() {
      // Color Name input
      container.querySelectorAll('.var-color-name').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const card = e.target.closest('.color-var-card');
          const vIdx = parseInt(card.getAttribute('data-vidx'), 10);
          if (colorVariants[vIdx]) colorVariants[vIdx].color = e.target.value.trim();
        });
      });

      // Variant Image URL input & Live Preview
      container.querySelectorAll('.var-img-url').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const card = e.target.closest('.color-var-card');
          const vIdx = parseInt(card.getAttribute('data-vidx'), 10);
          const url = e.target.value.trim();
          if (colorVariants[vIdx]) colorVariants[vIdx].image_url = url;

          const previewBox = card.querySelector('.var-img-preview-box');
          if (previewBox) {
            if (url) {
              previewBox.innerHTML = `<img src="${url}" alt="Variant" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.opacity='0.5';">`;
            } else {
              previewBox.innerHTML = `<span style="color: #999; font-size: 10px; text-align: center;">No Image</span>`;
            }
          }
        });
      });

      // Remove Color Variant
      container.querySelectorAll('.btn-remove-color-var').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const vIdx = parseInt(e.target.getAttribute('data-vidx'), 10);
          if (colorVariants.length > 1) {
            colorVariants.splice(vIdx, 1);
            renderColorVariantCards();
          }
        });
      });

      // Add Size to Variant
      container.querySelectorAll('.btn-add-size-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const vIdx = parseInt(e.target.getAttribute('data-vidx'), 10);
          if (colorVariants[vIdx]) {
            colorVariants[vIdx].sizes.push({ size: 'M', stock: 5 });
            renderColorVariantCards();
          }
        });
      });

      // Remove Size from Variant
      container.querySelectorAll('.btn-remove-size-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const vIdx = parseInt(e.target.getAttribute('data-vidx'), 10);
          const sIdx = parseInt(e.target.getAttribute('data-sidx'), 10);
          if (colorVariants[vIdx] && colorVariants[vIdx].sizes.length > 1) {
            colorVariants[vIdx].sizes.splice(sIdx, 1);
            renderColorVariantCards();
          }
        });
      });

      // Size dropdown change
      container.querySelectorAll('.size-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const card = e.target.closest('.color-var-card');
          const pill = e.target.closest('.size-item-pill');
          const vIdx = parseInt(card.getAttribute('data-vidx'), 10);
          const sIdx = parseInt(pill.getAttribute('data-sidx'), 10);
          if (colorVariants[vIdx]?.sizes[sIdx]) {
            colorVariants[vIdx].sizes[sIdx].size = e.target.value;
          }
        });
      });

      // Stock input change
      container.querySelectorAll('.size-stock-val').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const card = e.target.closest('.color-var-card');
          const pill = e.target.closest('.size-item-pill');
          const vIdx = parseInt(card.getAttribute('data-vidx'), 10);
          const sIdx = parseInt(pill.getAttribute('data-sidx'), 10);
          const val = parseInt(e.target.value, 10) || 0;
          if (colorVariants[vIdx]?.sizes[sIdx]) {
            colorVariants[vIdx].sizes[sIdx].stock = val;
            updateTotalStockCounter();
          }
        });
      });
    }

    function attachFormListeners() {
      // Main image URL live preview
      const mainImgInp = container.querySelector('#pe-main-img-url');
      const mainPreviewBox = container.querySelector('#main-img-preview-box');
      mainImgInp?.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (mainPreviewBox) {
          mainPreviewBox.innerHTML = `<img src="${url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85'}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';">`;
        }
      });

      // Add Color Variant button
      container.querySelector('#btn-add-color-variant')?.addEventListener('click', () => {
        colorVariants.push({
          color: 'New Color',
          image_url: '',
          sizes: [
            { size: 'XS', stock: 5 },
            { size: 'S', stock: 10 },
            { size: 'M', stock: 10 },
            { size: 'L', stock: 5 },
            { size: 'XL', stock: 2 }
          ]
        });
        renderColorVariantCards();
      });

      // Save Garment handler
      const saveHandler = async (e) => {
        if (e) e.preventDefault();

        const name = container.querySelector('#pe-name')?.value.trim();
        if (!name) {
          window.MB_ADMIN_SHELL?.showToast('Please provide a garment title', 'warning');
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

        // Flatten colorVariants into database variants
        const flatVariants = [];
        let totalStock = 0;
        const cleanSkuBase = `MB-${name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

        colorVariants.forEach((vg, cIdx) => {
          const colName = vg.color.trim() || `Color ${cIdx + 1}`;
          const colImg = vg.image_url.trim() || mainImage;
          (vg.sizes || []).forEach(s => {
            const stockQty = parseInt(s.stock, 10) || 0;
            totalStock += stockQty;
            flatVariants.push({
              size: s.size,
              color: colName,
              stock: stockQty,
              stock_qty: stockQty,
              sku: `${cleanSkuBase}-${colName.substring(0, 3).toUpperCase()}-${s.size}`,
              image_url: colImg
            });
          });
        });

        // Gallery: main image + all variant images
        const gallery = [mainImage];
        colorVariants.forEach(vg => {
          if (vg.image_url && !gallery.includes(vg.image_url)) {
            gallery.push(vg.image_url);
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
          fabric: '100% Sustainable Linen Cotton',
          care: 'Hand wash cold or gentle machine cycle. Dry flat.',
          fit: 'Relaxed elegant fit.',
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
