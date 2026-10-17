/**
 * MARSH BARBARY — ADMIN VIEW: PRODUCT EDIT / CREATE (js/admin/views/product-edit.js)
 * Comprehensive garment editor with variants, pricing, sustainability specs, and SEO preview.
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
      price: 2999,
      salePrice: null,
      stock: 10,
      lowStockThreshold: 5,
      status: 'active',
      featured: false,
      newArrival: true,
      shortDescription: '',
      description: '',
      fabric: '100% Certified Organic European Linen',
      care: 'Hand wash cold or gentle machine cycle. Dry flat.',
      fit: 'Relaxed modest fit.',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85',
      gallery: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85'],
      variants: [
        { size: 'XS', color: 'Natural', stock: 2, sku: '' },
        { size: 'S', color: 'Natural', stock: 4, sku: '' },
        { size: 'M', color: 'Natural', stock: 3, sku: '' },
        { size: 'L', color: 'Natural', stock: 1, sku: '' }
      ],
      seoTitle: '',
      seoDescription: ''
    };

    if (!isNew) {
      const fetched = await service.getProductById(params.id);
      if (fetched) product = fetched;
    }

    container.innerHTML = `
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
          <button id="btn-save-product" class="admin-btn admin-btn-primary admin-btn-sm">
            ${isNew ? 'Publish Garment' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form id="product-edit-form">
        <div class="admin-grid admin-grid-3">
          
          <!-- Left 2 Cols: Main Product Attributes -->
          <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- General Information -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                General Information
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-name">Garment Title *</label>
                <input type="text" id="pe-name" class="admin-input" required value="${product.name}" placeholder="e.g. Sienna Maxi Dress">
              </div>

              <div class="admin-grid admin-grid-2">
                <div class="admin-form-group">
                  <label class="admin-label" for="pe-slug">URL Handle / Slug</label>
                  <input type="text" id="pe-slug" class="admin-input" value="${product.slug}" placeholder="sienna-maxi-dress">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="pe-sku">Master SKU *</label>
                  <input type="text" id="pe-sku" class="admin-input" required value="${product.sku}" placeholder="MB-DRS-001">
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-short-desc">Short Editorial Summary</label>
                <input type="text" id="pe-short-desc" class="admin-input" value="${product.shortDescription || ''}" placeholder="Ethereal tiered maxi silhouette in organic linen cotton.">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-desc">Full Editorial Description</label>
                <textarea id="pe-desc" class="admin-textarea" rows="4" placeholder="Detailed brand story and garment narrative...">${product.description || ''}</textarea>
              </div>
            </div>

            <!-- Material, Sustainability & Fit -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                Craftsmanship, Fabric & Care
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-fabric">Fabric & Sustainability Certification</label>
                <input type="text" id="pe-fabric" class="admin-input" value="${product.fabric || ''}" placeholder="70% Certified Organic European Linen, 30% Long-Staple Cotton">
              </div>

              <div class="admin-grid admin-grid-2">
                <div class="admin-form-group">
                  <label class="admin-label" for="pe-care">Care Instructions</label>
                  <input type="text" id="pe-care" class="admin-input" value="${product.care || ''}" placeholder="Hand wash cold or gentle machine cycle.">
                </div>
                <div class="admin-form-group">
                  <label class="admin-label" for="pe-fit">Fit & Silhouette Advice</label>
                  <input type="text" id="pe-fit" class="admin-input" value="${product.fit || ''}" placeholder="Relaxed modest fit, ankle-length hem.">
                </div>
              </div>
            </div>

            <!-- Variant Matrix -->
            <div class="admin-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 500; font-size: 14px; color: var(--mb-admin-text);">Size & Colour Variants</div>
                  <div style="font-size: 11px; color: var(--mb-admin-muted);">Each variant can have its own colour name, product image, and stock allocation</div>
                </div>
                <button type="button" id="btn-add-variant" class="admin-btn admin-btn-outline admin-btn-sm" style="font-size: 11px;">
                  + Add Variant
                </button>
              </div>

              <div id="variants-list" style="display: flex; flex-direction: column; gap: 12px;">
                ${(product.variants || []).map((v, idx) => `
                  <div class="variant-row-card" data-idx="${idx}" style="border: 1px solid var(--mb-admin-border); border-radius: 6px; padding: 12px; background: var(--mb-admin-bg); display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap;">
                      <!-- Size -->
                      <div style="display: flex; flex-direction: column; gap: 4px; min-width: 80px;">
                        <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Size</label>
                        <select class="admin-select var-size" style="padding: 5px 8px; font-size: 12px;">
                          <option value="XS" ${v.size === 'XS' ? 'selected' : ''}>XS</option>
                          <option value="S" ${v.size === 'S' ? 'selected' : ''}>S</option>
                          <option value="M" ${v.size === 'M' ? 'selected' : ''}>M</option>
                          <option value="L" ${v.size === 'L' ? 'selected' : ''}>L</option>
                          <option value="XL" ${v.size === 'XL' ? 'selected' : ''}>XL</option>
                          <option value="XXL" ${v.size === 'XXL' ? 'selected' : ''}>XXL</option>
                          <option value="Free Size" ${v.size === 'Free Size' ? 'selected' : ''}>Free Size</option>
                        </select>
                      </div>
                      <!-- Colour Name -->
                      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px;">
                        <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Colour Name</label>
                        <input type="text" class="admin-input var-color" style="padding: 5px 8px; font-size: 12px;" value="${v.color || 'Natural'}" placeholder="e.g. Terracotta">
                      </div>
                      <!-- Variant SKU -->
                      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px;">
                        <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">SKU</label>
                        <input type="text" class="admin-input var-sku" style="padding: 5px 8px; font-size: 12px;" value="${v.sku || ''}" placeholder="MB-DRS-001-M-TER">
                      </div>
                      <!-- Stock -->
                      <div style="display: flex; flex-direction: column; gap: 4px; width: 80px;">
                        <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Stock</label>
                        <input type="number" class="admin-input var-stock" style="padding: 5px 8px; font-size: 12px;" min="0" value="${v.stock || v.stock_qty || 0}">
                      </div>
                      <!-- Delete -->
                      <div style="display: flex; align-items: flex-end; padding-bottom: 2px;">
                        <button type="button" class="btn-remove-var" style="background:none; border:none; color:#9C382A; cursor:pointer; font-size:18px; line-height:1; padding: 4px 6px;" title="Remove variant">&times;</button>
                      </div>
                    </div>
                    <!-- Variant Image Row -->
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">
                        Variant Image (shown as swatch thumbnail on product cards)
                      </label>
                      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <div class="var-img-preview-wrap" style="width: 48px; height: 60px; border: 1px solid var(--mb-admin-border); border-radius: 4px; overflow: hidden; background: #EDE8E1; flex-shrink: 0;">
                          ${v.image_url
                            ? `<img src="${v.image_url}" alt="Variant" style="width:100%;height:100%;object-fit:cover;" class="var-img-preview">`
                            : `<div class="var-img-preview-empty" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9A8678;font-size:18px;">+</div>`
                          }
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                          <input type="url" class="admin-input var-image-url" style="padding: 5px 8px; font-size: 12px;" value="${v.image_url || ''}" placeholder="https://... or image URL">
                          <div style="display: flex; gap: 6px; align-items: center;">
                            <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor:pointer; font-size:11px; display:inline-flex; align-items:center; gap:5px; padding: 4px 10px;">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              Upload
                              <input type="file" class="var-img-upload" accept="image/jpeg,image/png,image/webp" style="display:none;">
                            </label>
                            <span style="font-size: 10px; color: var(--mb-admin-muted);">or paste URL above</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- SEO & Metadata -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                Search Engine Optimization (SEO)
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-seo-title">SEO Page Title</label>
                <input type="text" id="pe-seo-title" class="admin-input" value="${product.seoTitle || ''}" placeholder="${product.name} | Marsh Barbary">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-seo-desc">SEO Meta Description</label>
                <textarea id="pe-seo-desc" class="admin-textarea" rows="2" placeholder="Luxury modest fashion silhouette...">${product.seoDescription || ''}</textarea>
              </div>

              <!-- Search engine mockup snippet -->
              <div style="padding: 12px; background: #F8F7F4; border-radius: 4px; border: 1px solid var(--mb-admin-border); margin-top: 10px;">
                <div style="font-size: 11px; color: #5f6368; margin-bottom: 2px;">https://marshbarbary.com/product.html?id=${product.id || 'slug'}</div>
                <div id="seo-preview-title" style="color: #1a0dab; font-size: 14px; font-weight: 500; text-decoration: underline; margin-bottom: 4px;">
                  ${product.seoTitle || product.name || 'Garment Title | Marsh Barbary'}
                </div>
                <div id="seo-preview-desc" style="color: #4d5156; font-size: 12px; line-height: 1.4;">
                  ${product.seoDescription || product.shortDescription || 'Experience artisanal luxury and conscious craftsmanship.'}
                </div>
              </div>
            </div>

          </div>

          <!-- Right 1 Col: Status, Category, Pricing, Imagery -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Publishing Status & Organization -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                Publishing & Category
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-status">Garment Status</label>
                <select id="pe-status" class="admin-select">
                  <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active (Visible in Store)</option>
                  <option value="draft" ${product.status === 'draft' ? 'selected' : ''}>Draft (Hidden)</option>
                </select>
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-category">Category *</label>
                <select id="pe-category" class="admin-select">
                  ${categories.map(c => `
                    <option value="${c.id}" data-slug="${c.slug}" ${(product.categoryId === c.id || product.category === c.slug || product.category === c.id) ? 'selected' : ''}>${c.name}</option>
                  `).join('')}
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--mb-admin-border);">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--mb-admin-text); cursor: pointer;">
                  <input type="checkbox" id="pe-featured" ${product.featured ? 'checked' : ''}>
                  Feature on Homepage
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--mb-admin-text); cursor: pointer;">
                  <input type="checkbox" id="pe-new" ${product.newArrival ? 'checked' : ''}>
                  Mark as New Arrival
                </label>
              </div>
            </div>

            <!-- Pricing & Total Stock -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                Pricing & Inventory
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-price">Regular Price (INR ₹) *</label>
                <input type="number" id="pe-price" class="admin-input" required min="0" value="${product.price}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-sale-price">Sale Price (INR ₹, Optional)</label>
                <input type="number" id="pe-sale-price" class="admin-input" min="0" value="${product.salePrice || ''}" placeholder="Leave blank for regular price">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-stock">Total Stock Units *</label>
                <input type="number" id="pe-stock" class="admin-input" required min="0" value="${product.stock}">
              </div>

              <div class="admin-form-group">
                <label class="admin-label" for="pe-threshold">Low Stock Alert Threshold</label>
                <input type="number" id="pe-threshold" class="admin-input" min="1" value="${product.lowStockThreshold || 5}">
              </div>
            </div>

            <!-- Visual Assets & Photography -->
            <div class="admin-card">
              <div style="font-weight: 500; font-size: 14px; margin-bottom: 16px; color: var(--mb-admin-text);">
                Visual Assets & Photography
              </div>

              <!-- Main Product Image -->
              <div class="admin-form-group" style="margin-bottom: 24px;">
                <label class="admin-label">Primary Product Visual (Shop & Hero) *</label>
                <div id="pe-main-img-mount"></div>
              </div>

              <!-- Gallery Builder -->
              <div style="border-top: 1px solid var(--mb-admin-border); padding-top: 16px;">
                <div id="pe-gallery-builder-mount"></div>
              </div>
            </div>

          </div>
        </div>
      </form>
    `;

    // Mount Primary Image Source and Gallery Builder
    let mainImgCtrl = null;
    let galleryCtrl = null;

    if (window.MB_IMAGE_SOURCE) {
      mainImgCtrl = window.MB_IMAGE_SOURCE.render('#pe-main-img-mount', {
        id: 'pe-main-img',
        label: '',
        initialValue: product.image
      });

      const initialGallery = (product.gallery && product.gallery.length)
        ? product.gallery
        : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85']);

      galleryCtrl = window.MB_IMAGE_SOURCE.renderGallery('#pe-gallery-builder-mount', {
        initialImages: initialGallery
      });
    }

    // Live update SEO snippet & Auto-slug generation
    const peNameInput = document.getElementById('pe-name');
    const peSlugInput = document.getElementById('pe-slug');
    let userEditedProdSlug = !isNew && Boolean(product.slug);

    peNameInput?.addEventListener('input', (e) => {
      const val = e.target.value;
      if (!userEditedProdSlug && peSlugInput) {
        peSlugInput.value = val
          .toLowerCase()
          .trim()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      const titleEl = document.getElementById('seo-preview-title');
      if (titleEl && !document.getElementById('pe-seo-title')?.value) {
        titleEl.textContent = val || 'Title';
      }
    });

    peSlugInput?.addEventListener('input', () => {
      userEditedProdSlug = true;
    });

    document.getElementById('pe-seo-title')?.addEventListener('input', (e) => {
      const el = document.getElementById('seo-preview-title');
      if (el) el.textContent = e.target.value || document.getElementById('pe-name')?.value || 'Title';
    });
    document.getElementById('pe-seo-desc')?.addEventListener('input', (e) => {
      const el = document.getElementById('seo-preview-desc');
      if (el) el.textContent = e.target.value || 'Description';
    });

    // ─── Variant helpers ───────────────────────────────────────────────────────

    /** Wire image upload + URL preview for a single variant card */
    function wireVariantCard(card) {
      const urlInput = card.querySelector('.var-image-url');
      const previewWrap = card.querySelector('.var-img-preview-wrap');
      const fileInput = card.querySelector('.var-img-upload');
      const removeBtn = card.querySelector('.btn-remove-var');

      function updatePreview(src) {
        if (src) {
          previewWrap.innerHTML = `<img src="${src}" alt="Variant" style="width:100%;height:100%;object-fit:cover;" class="var-img-preview">`;
        } else {
          previewWrap.innerHTML = `<div class="var-img-preview-empty" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9A8678;font-size:18px;">+</div>`;
        }
      }

      urlInput?.addEventListener('input', (e) => updatePreview(e.target.value.trim()));

      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          if (urlInput) urlInput.value = dataUrl;
          updatePreview(dataUrl);
        };
        reader.readAsDataURL(file);
      });

      removeBtn?.addEventListener('click', () => card.remove());
    }

    /** Build HTML for a new blank variant card */
    function buildVariantCardHtml() {
      return `
        <div class="variant-row-card" style="border: 1px solid var(--mb-admin-border); border-radius: 6px; padding: 12px; background: var(--mb-admin-bg); display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 80px;">
              <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Size</label>
              <select class="admin-select var-size" style="padding: 5px 8px; font-size: 12px;">
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Free Size">Free Size</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px;">
              <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Colour Name</label>
              <input type="text" class="admin-input var-color" style="padding: 5px 8px; font-size: 12px;" value="Natural" placeholder="e.g. Terracotta">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 100px;">
              <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">SKU</label>
              <input type="text" class="admin-input var-sku" style="padding: 5px 8px; font-size: 12px;" placeholder="MB-DRS-001-M-TER">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; width: 80px;">
              <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">Stock</label>
              <input type="number" class="admin-input var-stock" style="padding: 5px 8px; font-size: 12px;" min="0" value="5">
            </div>
            <div style="display: flex; align-items: flex-end; padding-bottom: 2px;">
              <button type="button" class="btn-remove-var" style="background:none; border:none; color:#9C382A; cursor:pointer; font-size:18px; line-height:1; padding: 4px 6px;" title="Remove variant">&times;</button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mb-admin-muted);">
              Variant Image (shown as swatch thumbnail on product cards)
            </label>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <div class="var-img-preview-wrap" style="width: 48px; height: 60px; border: 1px solid var(--mb-admin-border); border-radius: 4px; overflow: hidden; background: #EDE8E1; flex-shrink: 0;">
                <div class="var-img-preview-empty" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9A8678;font-size:18px;">+</div>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                <input type="url" class="admin-input var-image-url" style="padding: 5px 8px; font-size: 12px;" placeholder="https://... or image URL">
                <div style="display: flex; gap: 6px; align-items: center;">
                  <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor:pointer; font-size:11px; display:inline-flex; align-items:center; gap:5px; padding: 4px 10px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload
                    <input type="file" class="var-img-upload" accept="image/jpeg,image/png,image/webp" style="display:none;">
                  </label>
                  <span style="font-size: 10px; color: var(--mb-admin-muted);">or paste URL above</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Wire existing variant cards
    container.querySelectorAll('.variant-row-card').forEach(card => wireVariantCard(card));

    // Add new variant card
    document.getElementById('btn-add-variant')?.addEventListener('click', () => {
      const list = document.getElementById('variants-list');
      const div = document.createElement('div');
      div.innerHTML = buildVariantCardHtml();
      const card = div.firstElementChild;
      list.appendChild(card);
      wireVariantCard(card);
    });

    // ─── Form submission ────────────────────────────────────────────────────────
    const saveHandler = async (e) => {
      if (e) e.preventDefault();

      const name = document.getElementById('pe-name').value.trim();
      const sku = document.getElementById('pe-sku').value.trim();
      if (!name || !sku) {
        window.MB_ADMIN_SHELL.showToast('Please provide both garment name and SKU', 'warning');
        return;
      }

      // Collect variants (now from card-style rows)
      const variants = [];
      container.querySelectorAll('#variants-list .variant-row-card').forEach(card => {
        variants.push({
          size: card.querySelector('.var-size').value,
          color: card.querySelector('.var-color').value.trim(),
          sku: card.querySelector('.var-sku').value.trim() || `${sku}-${card.querySelector('.var-size').value}`,
          stock: parseInt(card.querySelector('.var-stock').value, 10) || 0,
          image_url: card.querySelector('.var-image-url')?.value.trim() || null
        });
      });

      // Main image & gallery extraction
      let mainImage = product.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=85';
      if (window.MB_IMAGE_SOURCE) {
        const mainVal = window.MB_IMAGE_SOURCE.getValue('#pe-main-img-mount');
        if (mainVal && mainVal.activeValue) {
          mainImage = mainVal.activeValue;
        }
      }

      let galleryImages = galleryCtrl ? galleryCtrl.getValues() : (product.gallery || [mainImage]);
      if (!galleryImages || !galleryImages.length) {
        galleryImages = [mainImage];
      }

      const catSelect = document.getElementById('pe-category');
      const selectedOption = catSelect?.options[catSelect.selectedIndex];
      const categoryId = selectedOption?.value || '';
      const categorySlug = selectedOption?.getAttribute('data-slug') || '';

      const updatedProduct = {
        id: product.id || `prod-${Date.now()}`,
        name,
        slug: document.getElementById('pe-slug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku,
        category: categorySlug,
        categoryId: categoryId,
        price: parseFloat(document.getElementById('pe-price').value) || 0,
        salePrice: document.getElementById('pe-sale-price').value ? parseFloat(document.getElementById('pe-sale-price').value) : null,
        stock: parseInt(document.getElementById('pe-stock').value, 10) || 0,
        lowStockThreshold: parseInt(document.getElementById('pe-threshold').value, 10) || 5,
        status: document.getElementById('pe-status').value,
        featured: document.getElementById('pe-featured').checked,
        newArrival: document.getElementById('pe-new').checked,
        shortDescription: document.getElementById('pe-short-desc').value.trim(),
        description: document.getElementById('pe-desc').value.trim(),
        fabric: document.getElementById('pe-fabric').value.trim(),
        care: document.getElementById('pe-care').value.trim(),
        fit: document.getElementById('pe-fit').value.trim(),
        image: mainImage,
        gallery: galleryImages,
        variants,
        seoTitle: document.getElementById('pe-seo-title').value.trim(),
        seoDescription: document.getElementById('pe-seo-desc').value.trim()
      };

      try {
        await service.saveProduct(updatedProduct);
        window.MB_ADMIN_SHELL.showToast(`Garment "${name}" successfully saved`, 'success');
        window.location.hash = '#/products';
      } catch (err) {
        window.MB_ADMIN_SHELL.showToast(err.message || 'Error saving product', 'error');
      }
    };

    document.getElementById('btn-save-product')?.addEventListener('click', saveHandler);
    document.getElementById('product-edit-form')?.addEventListener('submit', saveHandler);
  }
};
