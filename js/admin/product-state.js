/**
 * MARSH BARBARY — PRODUCT BUILDER STATE STORE (js/admin/product-state.js)
 * Clean, isolated, reactive state store strictly separating Main Gallery from Color Variant Galleries.
 */

window.MB_PRODUCT_FORM_STATE = (() => {
  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Default clean state
  function createInitialState() {
    return {
      id: null, // null for new, UUID for existing
      activeTab: 'basic', // 'basic' | 'variants'
      basicInfo: {
        name: '',
        slug: '',
        categoryId: '',
        categorySlug: '',
        basePrice: '',
        salePrice: '',
        description: '',
        fabric: '',
        care: '',
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: false,
        isNewArrival: false
      },
      mainGallery: [], // Max 5 image URLs strictly for main garment
      colorVariants: [
        {
          tempId: 'col_' + Date.now(),
          colorName: 'Standard',
          colorHex: '#C4B5A5',
          images: [], // Max 5 image URLs strictly for this color
          sizes: [
            { size: 'S', sku: '', stock: 5, active: true, variantId: null },
            { size: 'M', sku: '', stock: 5, active: true, variantId: null },
            { size: 'L', sku: '', stock: 5, active: true, variantId: null }
          ],
          isCollapsed: false
        }
      ],
      errors: {}
    };
  }

  let currentState = createInitialState();
  const listeners = new Set();

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    listeners.forEach(fn => {
      try { fn(getState()); } catch (e) { console.error('Form state subscriber error:', e); }
    });
  }

  function getState() {
    return JSON.parse(JSON.stringify(currentState));
  }

  function setState(updater) {
    if (typeof updater === 'function') {
      currentState = updater(currentState);
    } else {
      currentState = { ...currentState, ...updater };
    }
    notify();
  }

  function generateSlug(text) {
    return (text || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function generateSku(productName, categorySlug, colorName, size) {
    const pPart = (productName || 'MB')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'PRD';
    const cPart = (colorName && colorName !== 'Standard')
      ? colorName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
      : 'STD';
    const sPart = (size || 'M').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `MB-${pPart}-${cPart}-${sPart}`;
  }

  /**
   * Hydrate state from an existing product record (Edit Mode) or reset (Create Mode)
   */
  function initProduct(product = null, categories = []) {
    if (!product) {
      currentState = createInitialState();
      if (categories.length > 0) {
        currentState.basicInfo.categoryId = categories[0].id;
        currentState.basicInfo.categorySlug = categories[0].slug;
      }
      notify();
      return;
    }

    // Resolve category
    let matchedCat = categories.find(c => c.id === product.categoryId || c.id === product.category_id || c.slug === product.category);
    if (!matchedCat && categories.length > 0) matchedCat = categories[0];

    // Separate main gallery strictly from color galleries
    let mainImgs = [];
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      mainImgs = product.gallery.filter(Boolean).slice(0, 5);
    } else if (product.image) {
      mainImgs = [product.image];
    }

    // Group variants by color
    const rawVariants = Array.isArray(product.variants) ? product.variants : [];
    const colorMap = new Map();

    rawVariants.forEach(v => {
      const cName = (v.color || 'Standard').trim();
      if (!colorMap.has(cName)) {
        colorMap.set(cName, []);
      }
      colorMap.get(cName).push(v);
    });

    const colorVariants = [];
    if (colorMap.size === 0) {
      // Default single color variant
      colorVariants.push({
        tempId: 'col_' + Date.now(),
        colorName: 'Standard',
        colorHex: '#C4B5A5',
        images: [],
        sizes: [
          { size: 'S', sku: generateSku(product.name, matchedCat?.slug, 'Standard', 'S'), stock: 5, active: true, variantId: null },
          { size: 'M', sku: generateSku(product.name, matchedCat?.slug, 'Standard', 'M'), stock: 5, active: true, variantId: null }
        ],
        isCollapsed: false
      });
    } else {
      let idx = 0;
      colorMap.forEach((vList, cName) => {
        // Resolve images for this color
        const cImgs = (product.colorGalleries && product.colorGalleries[cName]) || [];
        const sizes = vList.map(v => ({
          size: v.size || 'M',
          sku: v.sku || generateSku(product.name, matchedCat?.slug, cName, v.size),
          stock: typeof v.stock_qty === 'number' ? v.stock_qty : (typeof v.stock === 'number' ? v.stock : 0),
          active: v.is_active !== false,
          variantId: v.id || null
        }));

        colorVariants.push({
          tempId: 'col_' + (++idx) + '_' + Date.now(),
          colorName: cName,
          colorHex: '#C4B5A5',
          images: cImgs.slice(0, 5),
          sizes: sizes,
          isCollapsed: false
        });
      });
    }

    currentState = {
      id: product.id || null,
      activeTab: 'basic',
      basicInfo: {
        name: product.name || '',
        slug: product.slug || generateSlug(product.name),
        categoryId: matchedCat?.id || product.category_id || '',
        categorySlug: matchedCat?.slug || product.category || '',
        basePrice: product.base_price ?? product.basePrice ?? product.price ?? '',
        salePrice: product.sale_price ?? product.salePrice ?? '',
        description: product.description || product.shortDescription || '',
        fabric: product.fabric || '',
        care: product.care || product.care_instructions || '',
        lowStockThreshold: product.lowStockThreshold || product.low_stock_threshold || 5,
        isActive: product.is_active !== false && product.status !== 'draft',
        isFeatured: Boolean(product.is_featured || product.featured),
        isNewArrival: Boolean(product.is_featured || product.newArrival)
      },
      mainGallery: mainImgs,
      colorVariants: colorVariants,
      errors: {}
    };

    notify();
  }

  // --- ACTIONS ---

  function updateBasicInfo(fields, silent = false) {
    currentState.basicInfo = { ...currentState.basicInfo, ...fields };
    if (fields.name && !currentState.id && (!currentState.basicInfo.slug || currentState.basicInfo.slugAuto !== false)) {
      currentState.basicInfo.slug = generateSlug(fields.name);
    }
    if (!silent) {
      notify();
    }
  }

  function addMainImage(url) {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    if (!clean) return;
    if (currentState.mainGallery.length >= 5) {
      return { error: 'Maximum 5 main product images reached' };
    }
    if (currentState.mainGallery.includes(clean)) {
      return { error: 'Image already present in main gallery' };
    }
    currentState.mainGallery.push(clean);
    notify();
    return { success: true };
  }

  function removeMainImage(index) {
    if (index >= 0 && index < currentState.mainGallery.length) {
      currentState.mainGallery.splice(index, 1);
      notify();
    }
  }

  function addColorVariant(name = '') {
    const nextNum = currentState.colorVariants.length + 1;
    const cName = name.trim() || `Color ${nextNum}`;
    const pName = currentState.basicInfo.name || 'GARMENT';
    const catSlug = currentState.basicInfo.categorySlug || 'STYLE';

    currentState.colorVariants.push({
      tempId: 'col_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      colorName: cName,
      colorHex: '#C4B5A5',
      images: [],
      sizes: [
        { size: 'S', sku: generateSku(pName, catSlug, cName, 'S'), stock: 5, active: true, variantId: null },
        { size: 'M', sku: generateSku(pName, catSlug, cName, 'M'), stock: 5, active: true, variantId: null },
        { size: 'L', sku: generateSku(pName, catSlug, cName, 'L'), stock: 5, active: true, variantId: null }
      ],
      isCollapsed: false
    });
    notify();
  }

  function removeColorVariant(tempId) {
    if (currentState.colorVariants.length <= 1) {
      return { error: 'At least one color variant group is required.' };
    }
    currentState.colorVariants = currentState.colorVariants.filter(c => c.tempId !== tempId);
    notify();
    return { success: true };
  }

  function updateColorVariant(tempId, updates, silent = false) {
    const cv = currentState.colorVariants.find(c => c.tempId === tempId);
    if (!cv) return;
    Object.assign(cv, updates);
    if (!silent) {
      notify();
    }
  }

  function addColorImage(tempId, url) {
    const cv = currentState.colorVariants.find(c => c.tempId === tempId);
    if (!cv) return { error: 'Color variant not found' };
    const clean = (url || '').trim();
    if (!clean) return { error: 'Invalid image URL' };
    if (cv.images.length >= 5) {
      return { error: 'Maximum 5 images allowed for this colour' };
    }
    if (cv.images.includes(clean)) {
      return { error: 'Image already in this colour gallery' };
    }
    cv.images.push(clean);
    notify();
    return { success: true };
  }

  function removeColorImage(tempId, imgIdx) {
    const cv = currentState.colorVariants.find(c => c.tempId === tempId);
    if (!cv) return;
    if (imgIdx >= 0 && imgIdx < cv.images.length) {
      cv.images.splice(imgIdx, 1);
      notify();
    }
  }

  function useMainImageInColor(mainImgUrl, targetTempId) {
    if (!mainImgUrl) return;
    const cv = currentState.colorVariants.find(c => c.tempId === targetTempId);
    if (!cv) return;
    if (cv.images.length >= 5) {
      return { error: 'This colour already has 5 images' };
    }
    if (!cv.images.includes(mainImgUrl)) {
      cv.images.push(mainImgUrl);
      notify();
    }
    return { success: true };
  }

  function toggleSizeInColor(tempId, sizeName, isChecked) {
    const cv = currentState.colorVariants.find(c => c.tempId === tempId);
    if (!cv) return;

    const existing = cv.sizes.find(s => s.size.toUpperCase() === sizeName.toUpperCase());
    if (existing) {
      existing.active = isChecked;
    } else if (isChecked) {
      const pName = currentState.basicInfo.name || 'GARMENT';
      const catSlug = currentState.basicInfo.categorySlug || 'STYLE';
      cv.sizes.push({
        size: sizeName.toUpperCase(),
        sku: generateSku(pName, catSlug, cv.colorName, sizeName),
        stock: 5,
        active: true,
        variantId: null
      });
    }
    notify();
  }

  function updateSizeRow(tempId, sizeName, field, value, silent = false) {
    const cv = currentState.colorVariants.find(c => c.tempId === tempId);
    if (!cv) return;
    const target = cv.sizes.find(s => s.size.toUpperCase() === sizeName.toUpperCase());
    if (!target) return;

    if (field === 'stock') {
      target.stock = Math.max(0, parseInt(value, 10) || 0);
    } else if (field === 'sku') {
      target.sku = (value || '').trim();
    }
    if (!silent) {
      notify();
    }
  }

  function setActiveTab(tab) {
    currentState.activeTab = tab;
    notify();
  }

  /**
   * Validate entire state model before persistence
   */
  function validate() {
    const errors = {};
    const b = currentState.basicInfo;

    if (!b.name || !b.name.trim()) {
      errors.name = 'Garment name is required';
    }
    if (!b.slug || !b.slug.trim()) {
      errors.slug = 'Garment slug is required';
    }
    if (!b.basePrice || isNaN(Number(b.basePrice)) || Number(b.basePrice) <= 0) {
      errors.basePrice = 'Valid base price is required (e.g. 1999)';
    }

    if (currentState.mainGallery.length === 0) {
      errors.mainGallery = 'At least 1 main product image is required';
    }

    // Check variants
    const skus = new Set();
    let totalActiveVariants = 0;

    currentState.colorVariants.forEach((cv, cIdx) => {
      const activeSizes = cv.sizes.filter(s => s.active);
      totalActiveVariants += activeSizes.length;

      activeSizes.forEach(s => {
        if (!s.sku || !s.sku.trim()) {
          errors[`sku_${cv.tempId}_${s.size}`] = `SKU required for ${cv.colorName} / ${s.size}`;
        } else {
          const upperSku = s.sku.trim().toUpperCase();
          if (skus.has(upperSku)) {
            errors[`sku_${cv.tempId}_${s.size}`] = `Duplicate SKU "${upperSku}" detected`;
          }
          skus.add(upperSku);
        }

        if (s.stock < 0 || isNaN(s.stock)) {
          errors[`stock_${cv.tempId}_${s.size}`] = `Stock for ${s.size} must be non-negative integer`;
        }
      });
    });

    if (totalActiveVariants === 0) {
      errors.variants = 'At least one active size variant must be enabled';
    }

    currentState.errors = errors;
    notify();
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  return {
    STANDARD_SIZES,
    getState,
    initProduct,
    updateBasicInfo,
    addMainImage,
    removeMainImage,
    addColorVariant,
    removeColorVariant,
    updateColorVariant,
    addColorImage,
    removeColorImage,
    useMainImageInColor,
    toggleSizeInColor,
    updateSizeRow,
    setActiveTab,
    validate,
    subscribe,
    generateSku,
    generateSlug
  };
})();
