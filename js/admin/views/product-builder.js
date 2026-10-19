/**
 * MARSH BARBARY — LUXURY PRODUCT & VARIANT BUILDER (js/admin/views/product-builder.js)
 * Clean, production-ready, unified modal builder for Add Product and Edit Product.
 * Powered by MB_PRODUCT_FORM_STATE and MB_PRODUCT_PERSISTENCE.
 */

window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};

window.MB_ADMIN_VIEWS['product-edit'] = {
  title: 'Garment Builder',

  async render(container, params = {}) {
    const productId = params.id && params.id !== 'new' ? params.id : null;
    const isEditMode = Boolean(productId);

    // Fetch categories from service
    let categories = [];
    if (window.MB_ADMIN_SERVICE?.getCategories) {
      categories = await window.MB_ADMIN_SERVICE.getCategories();
    }

    // Initialize state
    if (isEditMode) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 400px; color: var(--mb-admin-muted);">
          <div style="text-align: center;">
            <div style="display: inline-block; width: 24px; height: 24px; border: 2px solid var(--mb-admin-accent); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <div style="margin-top: 12px; font-family: var(--font-serif); font-size: 15px;">Loading atelier garment specifications...</div>
          </div>
        </div>
      `;
      const prodData = await window.MB_PRODUCT_PERSISTENCE.getProductForEdit(productId);
      window.MB_PRODUCT_FORM_STATE.initProduct(prodData, categories);
    } else {
      window.MB_PRODUCT_FORM_STATE.initProduct(null, categories);
    }

    // Subscribe to state changes and render UI
    let unsubscribe = null;

    function renderModal(state) {
      // Preserve active input focus and cursor position in case of re-render
      const activeEl = document.activeElement;
      const activeId = activeEl?.id;
      const activeClass = activeEl ? Array.from(activeEl.classList || []).find(c => c.startsWith('inp-')) : null;
      const activeTempId = activeEl?.dataset?.tempId;
      const activeSize = activeEl?.dataset?.size;
      const selStart = (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) ? activeEl.selectionStart : null;
      const selEnd = (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) ? activeEl.selectionEnd : null;

      const isBasic = state.activeTab === 'basic';
      const b = state.basicInfo;
      const mainImgs = state.mainGallery || [];
      const cvs = state.colorVariants || [];
      const errors = state.errors || {};

      container.innerHTML = `
        <style>
          .mb-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(18, 16, 14, 0.75);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
          }
          .mb-modal-window {
            background: #FFFFFF;
            width: 100%;
            max-width: 960px;
            max-height: 90vh;
            border-radius: 8px;
            box-shadow: 0 24px 60px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #E8E4DF;
          }
          .mb-modal-header {
            padding: 20px 28px;
            border-bottom: 1px solid #ECE7E1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FAF8F5;
          }
          .mb-modal-title {
            font-family: var(--font-serif, "Cinzel", Georgia, serif);
            font-size: 20px;
            font-weight: 500;
            color: #1A1816;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .mb-modal-tab-bar {
            display: flex;
            background: #FAF8F5;
            border-bottom: 1px solid #ECE7E1;
            padding: 0 28px;
            gap: 24px;
          }
          .mb-modal-tab {
            padding: 12px 4px;
            font-size: 13px;
            font-weight: 600;
            color: #8C827A;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            transition: all 0.2s;
            background: none;
            border-top: none; border-left: none; border-right: none;
          }
          .mb-modal-tab.active {
            color: #1A1816;
            border-bottom-color: #1A1816;
          }
          .mb-modal-body {
            padding: 28px;
            overflow-y: auto;
            flex: 1;
            box-sizing: border-box;
          }
          .mb-modal-footer {
            padding: 16px 28px;
            border-top: 1px solid #ECE7E1;
            background: #FAF8F5;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .mb-form-group {
            margin-bottom: 20px;
          }
          .mb-form-label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #4A443E;
            margin-bottom: 6px;
          }
          .mb-input, .mb-select, .mb-textarea {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #D6CEBE;
            border-radius: 4px;
            font-size: 14px;
            color: #1A1816;
            background: #FFFFFF;
            box-sizing: border-box;
            transition: border-color 0.2s;
          }
          .mb-input:focus, .mb-select:focus, .mb-textarea:focus {
            outline: none;
            border-color: #1A1816;
          }
          .mb-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .mb-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
          }
          .mb-image-tray {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
          }
          .mb-image-card {
            width: 100px;
            height: 125px;
            border-radius: 4px;
            border: 1px solid #D6CEBE;
            position: relative;
            overflow: hidden;
            background: #FAF8F5;
          }
          .mb-image-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .mb-image-del {
            position: absolute;
            top: 4px; right: 4px;
            width: 22px; height: 22px;
            background: rgba(0,0,0,0.65);
            color: #FFF;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
          }
          .mb-color-card {
            border: 1px solid #D6CEBE;
            border-radius: 6px;
            background: #FAF8F5;
            margin-bottom: 20px;
            overflow: hidden;
          }
          .mb-color-card-header {
            padding: 14px 20px;
            background: #F4EFEA;
            border-bottom: 1px solid #ECE7E1;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .mb-color-card-body {
            padding: 20px;
            background: #FFFFFF;
          }
          .mb-size-btn-group {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .mb-size-pill {
            padding: 6px 14px;
            border-radius: 4px;
            border: 1px solid #D6CEBE;
            background: #FAF8F5;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }
          .mb-size-pill.active {
            background: #1A1816;
            color: #FFFFFF;
            border-color: #1A1816;
          }
          .mb-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          .mb-table th {
            text-align: left;
            padding: 8px 12px;
            background: #FAF8F5;
            border-bottom: 1px solid #ECE7E1;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6B625B;
          }
          .mb-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ECE7E1;
          }
          .mb-error-banner {
            padding: 10px 16px;
            background: #FDF2F2;
            border-left: 3px solid #E02424;
            color: #9B1C1C;
            font-size: 12px;
            margin-bottom: 16px;
            border-radius: 2px;
          }
        </style>

        <div class="mb-modal-overlay">
          <div class="mb-modal-window">
            
            <!-- HEADER -->
            <div class="mb-modal-header">
              <div class="mb-modal-title">
                <span>${isEditMode ? 'Edit Garment' : 'Create New Garment'}</span>
                <span id="mb-modal-title-name" style="font-size: 14px; color: #8C827A; font-family: sans-serif;">${b.name ? '— ' + b.name : ''}</span>
              </div>
              <button type="button" id="btn-close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #8C827A;">&times;</button>
            </div>

            <!-- TABS -->
            <div class="mb-modal-tab-bar">
              <button type="button" class="mb-modal-tab ${isBasic ? 'active' : ''}" data-tab="basic">
                1. Basic Info & Main Photos (${mainImgs.length}/5)
              </button>
              <button type="button" class="mb-modal-tab ${!isBasic ? 'active' : ''}" data-tab="variants">
                2. Colour & Size Variants (${cvs.length} Colours)
              </button>
            </div>

            <!-- BODY -->
            <div class="mb-modal-body">
              ${Object.keys(errors).length > 0 ? `
                <div class="mb-error-banner">
                  <strong>Please correct the following:</strong>
                  <ul style="margin: 4px 0 0 16px; padding: 0;">
                    ${Object.values(errors).slice(0, 3).map(e => `<li>${e}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${isBasic ? renderBasicTab(b, mainImgs, categories, errors) : renderVariantsTab(cvs, mainImgs, errors)}
            </div>

            <!-- FOOTER -->
            <div class="mb-modal-footer">
              <div>
                <button type="button" id="btn-cancel-modal" class="admin-btn admin-btn-outline admin-btn-sm">
                  Cancel
                </button>
              </div>
              <div style="display: flex; gap: 12px; align-items: center;">
                ${isBasic ? `
                  <button type="button" id="btn-goto-variants" class="admin-btn admin-btn-primary admin-btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                    Next: Configure Variants &rarr;
                  </button>
                ` : `
                  <button type="button" id="btn-back-basic" class="admin-btn admin-btn-outline admin-btn-sm">
                    &larr; Back to Basic Info
                  </button>
                  <button type="button" id="btn-save-product" class="admin-btn admin-btn-primary admin-btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Product
                  </button>
                `}
              </div>
            </div>

          </div>
        </div>
      `;

      attachModalEvents(container);

      // Restore focus & cursor selection if applicable
      if (activeId && container.querySelector('#' + activeId)) {
        const el = container.querySelector('#' + activeId);
        el.focus();
        if (selStart !== null && selEnd !== null && typeof el.setSelectionRange === 'function') {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      } else if (activeClass && activeTempId) {
        let sel = `.${activeClass}[data-temp-id="${activeTempId}"]`;
        if (activeSize) sel += `[data-size="${activeSize}"]`;
        const el = container.querySelector(sel);
        if (el) {
          el.focus();
          if (selStart !== null && selEnd !== null && typeof el.setSelectionRange === 'function') {
            try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
          }
        }
      }
    }

    // --- TAB 1: BASIC INFO & MAIN PRODUCT GALLERY ---
    function renderBasicTab(b, mainImgs, categories, errors) {
      return `
        <div class="mb-grid-2">
          <div class="mb-form-group">
            <label class="mb-form-label">Garment Title *</label>
            <input type="text" id="inp-name" class="mb-input" placeholder="e.g. Linen Kaftan Silhouette" value="${b.name}">
            ${errors.name ? `<span style="color: #E02424; font-size: 11px;">${errors.name}</span>` : ''}
          </div>

          <div class="mb-form-group">
            <label class="mb-form-label">Slug / URL Key *</label>
            <input type="text" id="inp-slug" class="mb-input" placeholder="linen-kaftan-silhouette" value="${b.slug}">
            ${errors.slug ? `<span style="color: #E02424; font-size: 11px;">${errors.slug}</span>` : ''}
          </div>
        </div>

        <div class="mb-grid-3">
          <div class="mb-form-group">
            <label class="mb-form-label">Category *</label>
            <select id="inp-category" class="mb-select">
              ${categories.map(c => `
                <option value="${c.id}" ${b.categoryId === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="mb-form-group">
            <label class="mb-form-label">Base Price (INR ₹) *</label>
            <input type="number" id="inp-price" class="mb-input" placeholder="3499" value="${b.basePrice}">
            ${errors.basePrice ? `<span style="color: #E02424; font-size: 11px;">${errors.basePrice}</span>` : ''}
          </div>

          <div class="mb-form-group">
            <label class="mb-form-label">Sale Price (Optional ₹)</label>
            <input type="number" id="inp-sale-price" class="mb-input" placeholder="Leave empty if none" value="${b.salePrice || ''}">
          </div>
        </div>

        <div class="mb-form-group">
          <label class="mb-form-label">Editorial Description</label>
          <textarea id="inp-desc" class="mb-textarea" rows="3" placeholder="Flowing silhouette woven from pure European flax linen...">${b.description}</textarea>
        </div>

        <div class="mb-grid-2">
          <div class="mb-form-group">
            <label class="mb-form-label">Fabric Composition</label>
            <input type="text" id="inp-fabric" class="mb-input" placeholder="100% Organic European Flax Linen" value="${b.fabric}">
          </div>

          <div class="mb-form-group">
            <label class="mb-form-label">Care Instructions</label>
            <input type="text" id="inp-care" class="mb-input" placeholder="Gentle cold hand wash, line dry in shade" value="${b.care}">
          </div>
        </div>

        <!-- MERCHANDISING FLAGS -->
        <div style="background: #FAF8F5; border: 1px solid #ECE7E1; border-radius: 4px; padding: 14px 18px; margin-bottom: 24px; display: flex; gap: 24px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="chk-active" ${b.isActive ? 'checked' : ''}>
            <span>Active & Visible in Atelier Store</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="chk-featured" ${b.isFeatured ? 'checked' : ''}>
            <span>Featured Collection</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="chk-new" ${b.isNewArrival ? 'checked' : ''}>
            <span>New Arrival Badge</span>
          </label>
        </div>

        <!-- MAIN PRODUCT GALLERY -->
        <div style="border-top: 1px solid #ECE7E1; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <div>
              <span class="mb-form-label" style="font-size: 13px; margin-bottom: 2px;">Main Product Gallery</span>
              <span style="font-size: 12px; color: #8C827A;">General garment photography displayed on catalog cards and default hero view.</span>
            </div>
            <span style="font-size: 12px; font-weight: 600; color: ${mainImgs.length >= 5 ? '#C27803' : '#4A443E'};">
              ${mainImgs.length}/5 Images
            </span>
          </div>

          ${errors.mainGallery ? `<div style="color: #E02424; font-size: 11px; margin-bottom: 8px;">${errors.mainGallery}</div>` : ''}

          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="url" id="inp-main-img-url" class="mb-input" placeholder="Paste direct image URL (https://...)" style="flex: 1;" ${mainImgs.length >= 5 ? 'disabled' : ''}>
            <button type="button" id="btn-add-main-url" class="admin-btn admin-btn-outline admin-btn-sm" ${mainImgs.length >= 5 ? 'disabled' : ''}>
              + Add URL
            </button>
            <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; ${mainImgs.length >= 5 ? 'pointer-events: none; opacity: 0.5;' : ''}">
              <span>Upload</span>
              <input type="file" id="inp-main-file" accept="image/*" style="display: none;" ${mainImgs.length >= 5 ? 'disabled' : ''}>
            </label>
          </div>

          <div class="mb-image-tray">
            ${mainImgs.map((src, idx) => `
              <div class="mb-image-card">
                <img src="${src}" alt="Main ${idx + 1}" onerror="this.src=window.MB_FALLBACK_SVG || '';">
                <button type="button" class="mb-image-del btn-del-main-img" data-index="${idx}" title="Remove image">&times;</button>
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #FFF; font-size: 10px; text-align: center; padding: 2px;">
                  ${idx === 0 ? 'Primary' : `#${idx + 1}`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // --- TAB 2: VARIANTS & INVENTORY ---
    function renderVariantsTab(cvs, mainImgs, errors) {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-family: var(--font-serif); font-size: 18px; margin: 0 0 4px 0; color: #1A1816;">Product Colour & Size Variants</h3>
            <p style="font-size: 13px; color: #8C827A; margin: 0;">Add colours, assign colour-specific imagery, and configure individual size stock and SKUs.</p>
          </div>
          <button type="button" id="btn-add-color-variant" class="admin-btn admin-btn-primary admin-btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Add Colour
          </button>
        </div>

        ${errors.variants ? `<div class="mb-error-banner">${errors.variants}</div>` : ''}

        <div id="color-variants-list">
          ${cvs.map((cv, cIdx) => renderColorCard(cv, cIdx, mainImgs, cvs.length)).join('')}
        </div>
      `;
    }

    function renderColorCard(cv, cIdx, mainImgs, totalColors) {
      const activeSizes = cv.sizes.filter(s => s.active);
      const totalColorStock = activeSizes.reduce((sum, s) => sum + (s.stock || 0), 0);
      const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

      return `
        <div class="mb-color-card" data-temp-id="${cv.tempId}">
          <!-- CARD HEADER -->
          <div class="mb-color-card-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="color-card-dot" data-temp-id="${cv.tempId}" style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: ${cv.colorHex || '#C4B5A5'}; border: 1px solid #B0A79C;"></span>
              <strong class="color-card-title" data-temp-id="${cv.tempId}" style="font-size: 14px; color: #1A1816;">${cv.colorName || 'Standard'}</strong>
              <span style="font-size: 11px; color: #8C827A; background: #FFF; padding: 2px 8px; border-radius: 12px; border: 1px solid #ECE7E1;">
                ${activeSizes.length} Active Sizes &bull; ${totalColorStock} Total Units
              </span>
            </div>
            <div style="display: flex; gap: 8px;">
              ${totalColors > 1 ? `
                <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-del-color" data-temp-id="${cv.tempId}" style="color: #9B1C1C; padding: 4px 8px;">
                  Remove Colour
                </button>
              ` : ''}
            </div>
          </div>

          <!-- CARD BODY -->
          <div class="mb-color-card-body">
            <div class="mb-grid-2" style="margin-bottom: 16px;">
              <div>
                <label class="mb-form-label">Colour / Variant Name (Optional)</label>
                <input type="text" class="mb-input inp-color-name" data-temp-id="${cv.tempId}" placeholder="e.g. Natural, Olive, Terracotta" value="${cv.colorName === 'Standard' ? '' : cv.colorName}">
              </div>
              <div>
                <label class="mb-form-label">Colour Swatch Indicator</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="color" class="inp-color-hex" data-temp-id="${cv.tempId}" value="${cv.colorHex || '#C4B5A5'}" style="width: 42px; height: 38px; border: 1px solid #D6CEBE; border-radius: 4px; padding: 2px; cursor: pointer; background: #FFF;">
                  <input type="text" class="mb-input inp-color-hex-text" data-temp-id="${cv.tempId}" value="${cv.colorHex || '#C4B5A5'}" style="flex: 1;" placeholder="#C4B5A5">
                </div>
              </div>
            </div>

            <!-- COLOUR GALLERY (Max 5) -->
            <div style="margin-bottom: 20px; border: 1px solid #ECE7E1; border-radius: 4px; padding: 14px; background: #FAF8F5;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <div>
                  <span class="mb-form-label" style="font-size: 12px; margin-bottom: 2px;">
                    ${cv.colorName || 'Standard'} Specific Photography (Max 5)
                  </span>
                  <span style="font-size: 11px; color: #8C827A;">
                    Displayed on storefront when patron selects this colour swatch.
                  </span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: ${(cv.images || []).length >= 5 ? '#C27803' : '#4A443E'};">
                  ${(cv.images || []).length}/5 Images
                </span>
              </div>

              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="url" class="mb-input inp-color-img-url" data-temp-id="${cv.tempId}" placeholder="Add image URL for this colour..." style="flex: 1;" ${(cv.images || []).length >= 5 ? 'disabled' : ''}>
                <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-add-color-url" data-temp-id="${cv.tempId}" ${(cv.images || []).length >= 5 ? 'disabled' : ''}>
                  + Add URL
                </button>
                <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; ${(cv.images || []).length >= 5 ? 'pointer-events: none; opacity: 0.5;' : ''}">
                  <span>Upload</span>
                  <input type="file" class="inp-color-file" data-temp-id="${cv.tempId}" accept="image/*" style="display: none;" ${(cv.images || []).length >= 5 ? 'disabled' : ''}>
                </label>
              </div>

              <!-- Quick Reuse from Main Images Tray -->
              ${mainImgs.length > 0 ? `
                <div style="font-size: 11px; color: #8C827A; margin-bottom: 6px;">
                  Quick-add from Main Product Gallery:
                </div>
                <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
                  ${mainImgs.map((mSrc, mIdx) => `
                    <button type="button" class="admin-btn admin-btn-outline btn-use-main-img" data-temp-id="${cv.tempId}" data-src="${mSrc}" style="font-size: 11px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
                      <img src="${mSrc}" style="width: 14px; height: 14px; object-fit: cover; border-radius: 2px;">
                      <span>Use Main #${mIdx + 1}</span>
                    </button>
                  `).join('')}
                </div>
              ` : ''}

              <div class="mb-image-tray">
                ${(cv.images || []).map((src, imgIdx) => `
                  <div class="mb-image-card">
                    <img src="${src}" alt="${cv.colorName} ${imgIdx + 1}" onerror="this.src=window.MB_FALLBACK_SVG || '';">
                    <button type="button" class="mb-image-del btn-del-color-img" data-temp-id="${cv.tempId}" data-index="${imgIdx}">&times;</button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- SIZE CHECKBOXES -->
            <div>
              <label class="mb-form-label">Available Sizes in this Colour</label>
              <div class="mb-size-btn-group">
                ${allSizes.map(sz => {
                  const isChecked = cv.sizes.some(s => s.size.toUpperCase() === sz && s.active);
                  return `
                    <button type="button" class="mb-size-pill ${isChecked ? 'active' : ''} btn-toggle-size" data-temp-id="${cv.tempId}" data-size="${sz}">
                      ${isChecked ? '✓ ' : '+ '}${sz}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- SIZE INVENTORY TABLE (FOR CHECKED SIZES ONLY) -->
            ${activeSizes.length > 0 ? `
              <div style="border: 1px solid #ECE7E1; border-radius: 4px; overflow: hidden;">
                <table class="mb-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">Size</th>
                      <th>SKU (Stock Keeping Unit)</th>
                      <th style="width: 140px;">Stock Units</th>
                      <th style="width: 80px; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeSizes.map(s => `
                      <tr>
                        <td><strong style="color: #1A1816;">${s.size}</strong></td>
                        <td>
                          <input type="text" class="mb-input inp-size-sku" data-temp-id="${cv.tempId}" data-size="${s.size}" value="${s.sku}" style="padding: 6px 10px; font-size: 13px;">
                        </td>
                        <td>
                          <input type="number" min="0" class="mb-input inp-size-stock" data-temp-id="${cv.tempId}" data-size="${s.size}" value="${s.stock}" style="padding: 6px 10px; font-size: 13px;">
                        </td>
                        <td style="text-align: right;">
                          <button type="button" class="btn-remove-size-row" data-temp-id="${cv.tempId}" data-size="${s.size}" style="background: none; border: none; color: #9B1C1C; cursor: pointer; font-size: 12px;">
                            Disable
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 16px; background: #FAF8F5; border-radius: 4px; text-align: center; color: #8C827A; font-size: 12px;">
                No sizes selected for ${cv.colorName || 'this colour'}. Click a size button above to enable inventory.
              </div>
            `}

          </div>
        </div>
      `;
    }

    // --- EVENT ATTACHMENTS ---
    function attachModalEvents(root) {
      // Close modal
      root.querySelector('#btn-close-modal')?.addEventListener('click', () => {
        window.location.hash = '#/products';
      });
      root.querySelector('#btn-cancel-modal')?.addEventListener('click', () => {
        window.location.hash = '#/products';
      });

      // Tab switching
      root.querySelectorAll('.mb-modal-tab').forEach(t => {
        t.addEventListener('click', () => {
          window.MB_PRODUCT_FORM_STATE.setActiveTab(t.dataset.tab);
        });
      });
      root.querySelector('#btn-goto-variants')?.addEventListener('click', () => {
        window.MB_PRODUCT_FORM_STATE.setActiveTab('variants');
      });
      root.querySelector('#btn-back-basic')?.addEventListener('click', () => {
        window.MB_PRODUCT_FORM_STATE.setActiveTab('basic');
      });

      // Basic tab inputs
      const inpName = root.querySelector('#inp-name');
      const inpSlug = root.querySelector('#inp-slug');

      inpName?.addEventListener('input', e => {
        const val = e.target.value;
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ name: val }, true);
        const titleName = root.querySelector('#mb-modal-title-name');
        if (titleName) titleName.textContent = val ? `— ${val}` : '';
        const st = window.MB_PRODUCT_FORM_STATE.getState().basicInfo;
        if (inpSlug && st.slugAuto !== false) {
          inpSlug.value = st.slug;
        }
      });

      inpSlug?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ slug: e.target.value, slugAuto: false }, true);
      });

      const inpCategory = root.querySelector('#inp-category');
      inpCategory?.addEventListener('change', e => {
        const cat = categories.find(c => c.id === e.target.value);
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ categoryId: e.target.value, categorySlug: cat?.slug || '' }, true);
      });

      const inpPrice = root.querySelector('#inp-price');
      inpPrice?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ basePrice: e.target.value }, true);
      });

      const inpSalePrice = root.querySelector('#inp-sale-price');
      inpSalePrice?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ salePrice: e.target.value }, true);
      });

      const inpDesc = root.querySelector('#inp-desc');
      inpDesc?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ description: e.target.value }, true);
      });

      const inpFabric = root.querySelector('#inp-fabric');
      inpFabric?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ fabric: e.target.value }, true);
      });

      const inpCare = root.querySelector('#inp-care');
      inpCare?.addEventListener('input', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ care: e.target.value }, true);
      });

      const chkActive = root.querySelector('#chk-active');
      chkActive?.addEventListener('change', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ isActive: e.target.checked }, true);
      });

      const chkFeatured = root.querySelector('#chk-featured');
      chkFeatured?.addEventListener('change', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ isFeatured: e.target.checked }, true);
      });

      const chkNew = root.querySelector('#chk-new');
      chkNew?.addEventListener('change', e => {
        window.MB_PRODUCT_FORM_STATE.updateBasicInfo({ isNewArrival: e.target.checked }, true);
      });

      // Main image actions
      const btnAddMainUrl = root.querySelector('#btn-add-main-url');
      const inpMainImgUrl = root.querySelector('#inp-main-img-url');
      btnAddMainUrl?.addEventListener('click', () => {
        const val = inpMainImgUrl?.value?.trim();
        if (val) {
          const res = window.MB_PRODUCT_FORM_STATE.addMainImage(val);
          if (res?.error) window.MB_ADMIN_SHELL?.showToast(res.error, 'error');
        }
      });

      const inpMainFile = root.querySelector('#inp-main-file');
      inpMainFile?.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = ev => {
            window.MB_PRODUCT_FORM_STATE.addMainImage(ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      });

      root.querySelectorAll('.btn-del-main-img').forEach(btn => {
        btn.addEventListener('click', () => {
          window.MB_PRODUCT_FORM_STATE.removeMainImage(parseInt(btn.dataset.index, 10));
        });
      });

      // Variants tab actions
      root.querySelector('#btn-add-color-variant')?.addEventListener('click', () => {
        window.MB_PRODUCT_FORM_STATE.addColorVariant();
      });

      root.querySelectorAll('.btn-del-color').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Are you sure you want to remove this colour variant?')) {
            window.MB_PRODUCT_FORM_STATE.removeColorVariant(btn.dataset.tempId);
          }
        });
      });

      root.querySelectorAll('.inp-color-name').forEach(inp => {
        inp.addEventListener('input', e => {
          const val = e.target.value.trim() || 'Standard';
          window.MB_PRODUCT_FORM_STATE.updateColorVariant(inp.dataset.tempId, { colorName: val }, true);
          const headerName = root.querySelector(`.color-card-title[data-temp-id="${inp.dataset.tempId}"]`);
          if (headerName) headerName.textContent = val;
        });
      });

      root.querySelectorAll('.inp-color-hex').forEach(inp => {
        inp.addEventListener('input', e => {
          window.MB_PRODUCT_FORM_STATE.updateColorVariant(inp.dataset.tempId, { colorHex: e.target.value }, true);
          const textInp = root.querySelector(`.inp-color-hex-text[data-temp-id="${inp.dataset.tempId}"]`);
          if (textInp) textInp.value = e.target.value;
          const dot = root.querySelector(`.color-card-dot[data-temp-id="${inp.dataset.tempId}"]`);
          if (dot) dot.style.backgroundColor = e.target.value;
        });
      });

      root.querySelectorAll('.inp-color-hex-text').forEach(inp => {
        inp.addEventListener('input', e => {
          window.MB_PRODUCT_FORM_STATE.updateColorVariant(inp.dataset.tempId, { colorHex: e.target.value }, true);
          const colorInp = root.querySelector(`.inp-color-hex[data-temp-id="${inp.dataset.tempId}"]`);
          if (colorInp && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) colorInp.value = e.target.value;
          const dot = root.querySelector(`.color-card-dot[data-temp-id="${inp.dataset.tempId}"]`);
          if (dot) dot.style.backgroundColor = e.target.value;
        });
      });

      // Color image actions
      root.querySelectorAll('.btn-add-color-url').forEach(btn => {
        btn.addEventListener('click', () => {
          const tempId = btn.dataset.tempId;
          const inp = root.querySelector(`.inp-color-img-url[data-temp-id="${tempId}"]`);
          if (inp && inp.value.trim()) {
            const res = window.MB_PRODUCT_FORM_STATE.addColorImage(tempId, inp.value.trim());
            if (res?.error) window.MB_ADMIN_SHELL?.showToast(res.error, 'error');
          }
        });
      });

      root.querySelectorAll('.inp-color-file').forEach(inp => {
        inp.addEventListener('change', e => {
          const file = e.target.files?.[0];
          const tempId = inp.dataset.tempId;
          if (file && tempId) {
            const reader = new FileReader();
            reader.onload = ev => {
              window.MB_PRODUCT_FORM_STATE.addColorImage(tempId, ev.target.result);
            };
            reader.readAsDataURL(file);
          }
        });
      });

      root.querySelectorAll('.btn-del-color-img').forEach(btn => {
        btn.addEventListener('click', () => {
          window.MB_PRODUCT_FORM_STATE.removeColorImage(btn.dataset.tempId, parseInt(btn.dataset.index, 10));
        });
      });

      root.querySelectorAll('.btn-use-main-img').forEach(btn => {
        btn.addEventListener('click', () => {
          window.MB_PRODUCT_FORM_STATE.useMainImageInColor(btn.dataset.src, btn.dataset.tempId);
        });
      });

      // Size toggle buttons
      root.querySelectorAll('.btn-toggle-size').forEach(btn => {
        btn.addEventListener('click', () => {
          const tempId = btn.dataset.tempId;
          const sz = btn.dataset.size;
          const isCurrentlyActive = btn.classList.contains('active');
          window.MB_PRODUCT_FORM_STATE.toggleSizeInColor(tempId, sz, !isCurrentlyActive);
        });
      });

      // Size row inputs
      root.querySelectorAll('.inp-size-sku').forEach(inp => {
        inp.addEventListener('input', e => {
          window.MB_PRODUCT_FORM_STATE.updateSizeRow(inp.dataset.tempId, inp.dataset.size, 'sku', e.target.value, true);
        });
      });

      root.querySelectorAll('.inp-size-stock').forEach(inp => {
        inp.addEventListener('input', e => {
          window.MB_PRODUCT_FORM_STATE.updateSizeRow(inp.dataset.tempId, inp.dataset.size, 'stock', e.target.value, true);
        });
      });

      root.querySelectorAll('.btn-remove-size-row').forEach(btn => {
        btn.addEventListener('click', () => {
          window.MB_PRODUCT_FORM_STATE.toggleSizeInColor(btn.dataset.tempId, btn.dataset.size, false);
        });
      });

      // Save handler
      const btnSave = root.querySelector('#btn-save-product');
      btnSave?.addEventListener('click', async () => {
        const valRes = window.MB_PRODUCT_FORM_STATE.validate();
        if (!valRes.isValid) {
          window.MB_ADMIN_SHELL?.showToast('Please resolve validation errors before saving', 'error');
          return;
        }

        btnSave.disabled = true;
        btnSave.innerHTML = `
          <div style="display: inline-block; width: 14px; height: 14px; border: 2px solid #FFF; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <span>Saving Garment...</span>
        `;

        try {
          const currentState = window.MB_PRODUCT_FORM_STATE.getState();
          await window.MB_PRODUCT_PERSISTENCE.saveProduct(currentState);
          window.MB_ADMIN_SHELL?.showToast('Garment & variants saved successfully', 'success');
          window.location.hash = '#/products';
        } catch (err) {
          console.error('Save error:', err);
          window.MB_ADMIN_SHELL?.showToast(`Error saving product: ${err.message}`, 'error');
          btnSave.disabled = false;
          btnSave.innerHTML = `Save Product`;
        }
      });
    }

    // Subscribe and perform initial render
    unsubscribe = window.MB_PRODUCT_FORM_STATE.subscribe(renderModal);
    renderModal(window.MB_PRODUCT_FORM_STATE.getState());
  }
};
