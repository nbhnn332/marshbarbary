/**
 * MARSH BARBARY — GLOBAL IMAGE SOURCE SYSTEM (js/admin/admin-image-source.js)
 * Reusable architectural component for managing image assets and direct URLs with
 * strict mutual exclusivity, format/size validation, live previews, and error handling.
 */

window.MB_IMAGE_SOURCE = (() => {
  // Preset curated editorial assets available for quick selection
  const WORKSPACE_ASSETS = [];

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  /**
   * Resolves a stored image value for browser display inside /admin/
   */
  function resolveDisplayUrl(pathOrUrl) {
    if (!pathOrUrl) return '';
    const trimmed = String(pathOrUrl).trim();
    if (trimmed.includes('unsplash.com')) {
      return window.MB_FALLBACK_SVG || '';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.includes('assets/images/')) {
      return window.MB_FALLBACK_SVG || '';
    }
    // If it's a relative path, return as is
    return trimmed;
  }

  /**
   * Parse initial value into structured state
   */
  function parseInitialState(initial) {
    if (!initial) {
      return {
        sourceType: 'asset',
        assetPath: '',
        url: '',
        activeValue: ''
      };
    }

    if (typeof initial === 'object') {
      const type = initial.sourceType === 'url' ? 'url' : 'asset';
      const active = type === 'url' ? (initial.url || '') : (initial.assetPath || '');
      return {
        sourceType: type,
        assetPath: initial.assetPath || (type === 'asset' ? active : ''),
        url: initial.url || (type === 'url' ? active : ''),
        activeValue: active
      };
    }

    const str = String(initial).trim();
    const isUrl = str.startsWith('http://') || str.startsWith('https://');
    return {
      sourceType: isUrl ? 'url' : 'asset',
      assetPath: isUrl ? '' : str,
      url: isUrl ? str : '',
      activeValue: str
    };
  }

  /**
   * Mount a single ImageSource control into container
   */
  function render(containerOrSelector, options = {}) {
    const container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;

    if (!container) {
      console.warn('[MB_IMAGE_SOURCE] Container not found:', containerOrSelector);
      return null;
    }

    const id = options.id || 'img-' + Math.random().toString(36).substring(2, 9);
    const label = options.label || 'Image Source';
    const state = parseInitialState(options.initialValue);
    const compact = !!options.compact;

    container.innerHTML = `
      <div class="image-source-widget ${compact ? 'image-source-compact' : ''}" id="widget-${id}">
        ${label ? `<label class="admin-label">${label}</label>` : ''}

        <!-- Mutually Exclusive Radio Selector -->
        <div class="image-source-radios">
          <label class="image-source-radio-label">
            <input type="radio" name="source_type_${id}" value="asset" ${state.sourceType === 'asset' ? 'checked' : ''}>
            <span>Upload / Local Asset</span>
          </label>
          <label class="image-source-radio-label">
            <input type="radio" name="source_type_${id}" value="url" ${state.sourceType === 'url' ? 'checked' : ''}>
            <span>Direct Image URL</span>
          </label>
        </div>

        <!-- Mode 1: Asset / File Selection Panel -->
        <div class="image-source-panel" id="panel-asset-${id}" style="display: ${state.sourceType === 'asset' ? 'block' : 'none'};">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
            <div style="flex: 1; min-width: 200px;">
              <select class="admin-select image-source-asset-select" id="select-asset-${id}">
                <option value="">— Select from Workspace Assets —</option>
                ${WORKSPACE_ASSETS.map(a => `<option value="${a}" ${state.assetPath === a ? 'selected' : ''}>${a}</option>`).join('')}
                <option value="custom" ${state.assetPath && !WORKSPACE_ASSETS.includes(state.assetPath) ? 'selected' : ''}>Custom Asset Path / Uploaded File</option>
              </select>
            </div>
            <div>
              <label class="admin-btn admin-btn-outline admin-btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Upload File</span>
                <input type="file" id="file-upload-${id}" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" style="display: none;">
              </label>
            </div>
          </div>

          <div id="custom-path-wrap-${id}" style="display: ${state.assetPath && !WORKSPACE_ASSETS.includes(state.assetPath) ? 'block' : 'none'}; margin-bottom: 8px;">
            <input type="text" class="admin-input image-source-asset-input" id="input-asset-${id}" placeholder="https://... or data:image/..." value="${state.assetPath}">
          </div>
        </div>

        <!-- Mode 2: Direct URL Input Panel -->
        <div class="image-source-panel" id="panel-url-${id}" style="display: ${state.sourceType === 'url' ? 'block' : 'none'};">
          <div class="admin-form-group" style="margin-bottom: 8px;">
            <input type="url" class="admin-input image-source-url-input" id="input-url-${id}" placeholder="https://example.com/editorial-dress.jpg" value="${state.url}">
            <div style="font-size: 11px; color: var(--mb-admin-muted); margin-top: 4px;">Must be a direct, publicly accessible image link (HTTPS).</div>
          </div>
        </div>

        <!-- Validation / Error Banner -->
        <div class="image-source-error" id="error-${id}" style="display: none;"></div>

        <!-- Live Visual Preview Box -->
        <div class="image-source-preview-box" id="preview-box-${id}">
          <div class="image-source-preview-inner">
            <img id="img-preview-${id}" src="${resolveDisplayUrl(state.activeValue)}" alt="Preview" style="display: ${state.activeValue ? 'block' : 'none'};">
            <div id="empty-preview-${id}" class="image-source-empty" style="display: ${state.activeValue ? 'none' : 'flex'};">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>No image selected</span>
            </div>
          </div>

          <div class="image-source-actions" id="actions-${id}" style="display: ${state.activeValue ? 'flex' : 'none'};">
            <span class="image-source-badge" id="badge-${id}">
              ${state.sourceType === 'url' ? 'External URL' : 'Local Asset'}
            </span>
            <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-replace" id="btn-replace-${id}">Replace</button>
            <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-remove" id="btn-remove-${id}" style="color: #9C382A;">Remove</button>
          </div>
        </div>
      </div>
    `;

    // Elements
    const widget = container.querySelector(`#widget-${id}`);
    const radioAsset = widget.querySelector(`input[name="source_type_${id}"][value="asset"]`);
    const radioUrl = widget.querySelector(`input[name="source_type_${id}"][value="url"]`);
    const panelAsset = widget.querySelector(`#panel-asset-${id}`);
    const panelUrl = widget.querySelector(`#panel-url-${id}`);
    const selectAsset = widget.querySelector(`#select-asset-${id}`);
    const fileUpload = widget.querySelector(`#file-upload-${id}`);
    const customPathWrap = widget.querySelector(`#custom-path-wrap-${id}`);
    const inputAsset = widget.querySelector(`#input-asset-${id}`);
    const inputUrl = widget.querySelector(`#input-url-${id}`);
    const errorEl = widget.querySelector(`#error-${id}`);
    const imgPreview = widget.querySelector(`#img-preview-${id}`);
    const emptyPreview = widget.querySelector(`#empty-preview-${id}`);
    const actions = widget.querySelector(`#actions-${id}`);
    const badge = widget.querySelector(`#badge-${id}`);
    const btnReplace = widget.querySelector(`#btn-replace-${id}`);
    const btnRemove = widget.querySelector(`#btn-remove-${id}`);

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }

    function clearError() {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    function notifyChange() {
      if (typeof options.onChange === 'function') {
        options.onChange({ ...state });
      }
    }

    function updatePreview() {
      clearError();
      if (!state.activeValue) {
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        emptyPreview.style.display = 'flex';
        actions.style.display = 'none';
        return;
      }

      const displayUrl = resolveDisplayUrl(state.activeValue);
      imgPreview.src = displayUrl;
      imgPreview.style.display = 'block';
      emptyPreview.style.display = 'none';
      actions.style.display = 'flex';
      badge.textContent = state.sourceType === 'url' ? 'External URL' : 'Local Asset';

      // Test load validation for URLs
      if (state.sourceType === 'url') {
        const testImg = new Image();
        testImg.onload = () => clearError();
        testImg.onerror = () => {
          showError('Unable to load image from direct URL. Please verify that the image link is valid and allows cross-origin loading.');
        };
        testImg.src = displayUrl;
      }
    }

    // Switch to ASSET source mode (Strict Mutual Exclusivity)
    function setModeAsset() {
      state.sourceType = 'asset';
      radioAsset.checked = true;
      panelAsset.style.display = 'block';
      panelUrl.style.display = 'none';
      
      // Clear URL to maintain strict mutual exclusivity
      state.url = '';
      inputUrl.value = '';
      inputUrl.disabled = true;
      selectAsset.disabled = false;
      inputAsset.disabled = false;

      state.activeValue = state.assetPath;
      updatePreview();
      notifyChange();
    }

    // Switch to URL source mode (Strict Mutual Exclusivity)
    function setModeUrl() {
      state.sourceType = 'url';
      radioUrl.checked = true;
      panelAsset.style.display = 'none';
      panelUrl.style.display = 'block';

      // Clear Asset to maintain strict mutual exclusivity
      state.assetPath = '';
      selectAsset.value = '';
      inputAsset.value = '';
      selectAsset.disabled = true;
      inputAsset.disabled = true;
      inputUrl.disabled = false;

      state.activeValue = state.url;
      updatePreview();
      notifyChange();
    }

    // Radio event listeners
    radioAsset.addEventListener('change', () => {
      if (radioAsset.checked) setModeAsset();
    });

    radioUrl.addEventListener('change', () => {
      if (radioUrl.checked) setModeUrl();
    });

    // Preset asset dropdown change
    selectAsset.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'custom') {
        customPathWrap.style.display = 'block';
        state.assetPath = inputAsset.value.trim();
      } else {
        customPathWrap.style.display = 'none';
        state.assetPath = val;
        inputAsset.value = val;
      }
      state.activeValue = state.assetPath;
      updatePreview();
      notifyChange();
    });

    // Custom asset text input change
    inputAsset.addEventListener('input', (e) => {
      state.assetPath = e.target.value.trim();
      state.activeValue = state.assetPath;
      updatePreview();
      notifyChange();
    });

    // Direct URL input change
    inputUrl.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.url = val;
      state.activeValue = val;
      
      if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
        showError('Direct image URL must start with http:// or https://');
      } else {
        clearError();
      }

      updatePreview();
      notifyChange();
    });

    // File upload event
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      clearError();

      // Format validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        showError(`Unsupported format "${file.type}". Please upload JPEG, PNG, WebP, or AVIF.`);
        fileUpload.value = '';
        return;
      }

      // Size validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`);
        fileUpload.value = '';
        return;
      }

      // Convert to local session preview using FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        // Store as self-contained dataUrl
        state.assetPath = dataUrl;
        state.activeValue = dataUrl;
        selectAsset.value = 'custom';
        customPathWrap.style.display = 'block';
        inputAsset.value = dataUrl;

        updatePreview();
        notifyChange();
      };
      reader.readAsDataURL(file);
    });

    // Actions
    btnReplace.addEventListener('click', () => {
      if (state.sourceType === 'asset') {
        fileUpload.click();
      } else {
        inputUrl.focus();
        inputUrl.select();
      }
    });

    btnRemove.addEventListener('click', () => {
      state.assetPath = '';
      state.url = '';
      state.activeValue = '';
      selectAsset.value = '';
      inputAsset.value = '';
      inputUrl.value = '';
      updatePreview();
      notifyChange();
    });

    // Expose controller on widget DOM node
    widget.__mbImageSource = {
      getState: () => ({ ...state }),
      setValue: (val) => {
        const parsed = parseInitialState(val);
        state.sourceType = parsed.sourceType;
        state.assetPath = parsed.assetPath;
        state.url = parsed.url;
        state.activeValue = parsed.activeValue;
        if (state.sourceType === 'asset') {
          setModeAsset();
        } else {
          setModeUrl();
        }
      }
    };

    // Initial load verification
    updatePreview();

    return widget.__mbImageSource;
  }

  /**
   * Helper to retrieve value from a rendered widget container
   */
  function getValue(containerOrSelector) {
    const container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;
    const widget = container?.querySelector('.image-source-widget') || container;
    if (widget && widget.__mbImageSource) {
      return widget.__mbImageSource.getState();
    }
    return { sourceType: 'asset', assetPath: '', url: '', activeValue: '' };
  }

  /**
   * Reusable Gallery Builder:
   * Renders multiple gallery slots where each slot independently uses MB_IMAGE_SOURCE.
   */
  function renderGallery(containerOrSelector, options = {}) {
    const container = typeof containerOrSelector === 'string'
      ? document.querySelector(containerOrSelector)
      : containerOrSelector;

    if (!container) return null;

    let items = (options.initialImages || []).map((img, i) => ({
      id: 'gal-' + i + '-' + Math.random().toString(36).substring(2, 6),
      value: img
    }));

    function renderList() {
      container.innerHTML = `
        <div class="image-gallery-builder">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mb-admin-text);">
              Editorial Gallery Photography (${items.length} images)
            </div>
            <button type="button" class="admin-btn admin-btn-outline admin-btn-sm" id="btn-add-gallery-item">
              + Add Gallery Photo
            </button>
          </div>

          <div class="image-gallery-grid" id="gallery-items-mount" style="display: flex; flex-direction: column; gap: 14px;">
          </div>
        </div>
      `;

      const mount = container.querySelector('#gallery-items-mount');
      items.forEach((item, index) => {
        const itemWrap = document.createElement('div');
        itemWrap.className = 'image-gallery-card';
        itemWrap.style.cssText = 'border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); padding: 12px; background: var(--mb-admin-bg); position: relative;';
        
        itemWrap.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--mb-admin-muted);">Photo #${index + 1}</span>
            <button type="button" class="btn-del-gallery-item" data-index="${index}" style="background:none; border:none; color:#9C382A; font-size:16px; cursor:pointer;" title="Remove this gallery slot">&times;</button>
          </div>
          <div id="slot-${item.id}"></div>
        `;

        mount.appendChild(itemWrap);

        render(itemWrap.querySelector(`#slot-${item.id}`), {
          id: item.id,
          label: '',
          compact: true,
          initialValue: item.value,
          onChange: (data) => {
            items[index].value = data.activeValue;
            if (typeof options.onChange === 'function') {
              options.onChange(getValues());
            }
          }
        });

        itemWrap.querySelector('.btn-del-gallery-item').addEventListener('click', () => {
          items.splice(index, 1);
          renderList();
          if (typeof options.onChange === 'function') {
            options.onChange(getValues());
          }
        });
      });

      container.querySelector('#btn-add-gallery-item').addEventListener('click', () => {
        items.push({
          id: 'gal-' + items.length + '-' + Math.random().toString(36).substring(2, 6),
          value: window.MB_FALLBACK_SVG || ''
        });
        renderList();
        if (typeof options.onChange === 'function') {
          options.onChange(getValues());
        }
      });
    }

    function getValues() {
      return items.map(it => it.value).filter(Boolean);
    }

    renderList();

    return {
      getValues,
      setValues: (newVals) => {
        items = (newVals || []).map((img, i) => ({
          id: 'gal-' + i + '-' + Math.random().toString(36).substring(2, 6),
          value: img
        }));
        renderList();
      }
    };
  }

  return {
    render,
    getValue,
    renderGallery,
    resolveDisplayUrl,
    WORKSPACE_ASSETS
  };
})();
