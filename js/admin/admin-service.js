/**
 * MARSH BARBARY — ADMIN DATA SERVICE (js/admin/admin-service.js)
 * Data abstraction layer simulating backend/Supabase persistence via localStorage.
 * Every mutating operation logs to the Admin Audit Log.
 */

window.MB_ADMIN_SERVICE = (() => {
  const STORAGE_KEYS = {
    CATEGORIES: 'mb_admin_categories',
    PRODUCTS: 'mb_admin_products',
    ORDERS: 'mb_admin_orders',
    CUSTOMERS: 'mb_admin_customers',
    RETURNS: 'mb_admin_returns',
    COUPONS: 'mb_admin_coupons',
    USERS: 'mb_admin_users',
    HOMEPAGE: 'mb_admin_homepage',
    PAYMENTS: 'mb_admin_payments',
    SETTINGS: 'mb_admin_settings',
    AUDIT_LOGS: 'mb_admin_audit_logs',
    INSTAGRAM_FEED: 'mb_admin_instagram_feed',
    HOME_SLIDER: 'mb_admin_home_slider',
    ABOUT_SLIDER: 'mb_admin_about_slider'
  };

  // Helper to get or initialize collection
  function getCollection(key, seedData) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`[AdminService] Error loading ${key}:`, e);
    }
    const data = JSON.parse(JSON.stringify(seedData || []));
    setCollection(key, data);
    return data;
  }

  function setCollection(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[AdminService] Error saving ${key}:`, e);
    }
  }

  // Ensure initial seed data is loaded
  function init() {
    const models = window.MB_ADMIN_MODELS || {};
    getCollection(STORAGE_KEYS.CATEGORIES, models.seedCategories || []);
    getCollection(STORAGE_KEYS.PRODUCTS, models.seedProducts || []);
    getCollection(STORAGE_KEYS.ORDERS, models.seedOrders || []);
    getCollection(STORAGE_KEYS.CUSTOMERS, models.seedCustomers || []);
    getCollection(STORAGE_KEYS.RETURNS, models.seedReturns || []);
    getCollection(STORAGE_KEYS.COUPONS, models.seedCoupons || []);
    getCollection(STORAGE_KEYS.USERS, models.seedAdminUsers || []);
    getCollection(STORAGE_KEYS.HOMEPAGE, models.seedHomepageConfig || {});
    getCollection(STORAGE_KEYS.PAYMENTS, models.seedPaymentSettings || {});
    getCollection(STORAGE_KEYS.SETTINGS, models.seedStoreSettings || {});
    getCollection(STORAGE_KEYS.AUDIT_LOGS, models.seedAuditLogs || []);
    getCollection(STORAGE_KEYS.HOME_SLIDER, models.seedHomeSliderConfig || { mode: 'fixed', posts: models.seedInstagramFeed || [] });
    getCollection(STORAGE_KEYS.ABOUT_SLIDER, models.seedAboutSliderConfig || { mode: 'fixed', posts: models.seedInstagramFeed || [] });
  }

  // Current session helper
  function getCurrentUser() {
    if (window.MB_ADMIN_AUTH && window.MB_ADMIN_AUTH.getCurrentUser) {
      return window.MB_ADMIN_AUTH.getCurrentUser();
    }
    return null;
  }

  // AUDIT LOGGING
  function logAction(action, entity, entityId, details) {
    const logs = getCollection(STORAGE_KEYS.AUDIT_LOGS, []);
    const user = getCurrentUser() || { name: 'System', role: 'SYSTEM' };
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp,
      adminName: user.name || 'System',
      adminRole: user.role || 'SYSTEM',
      action,
      entity,
      entityId: String(entityId || 'N/A'),
      details: details || ''
    };

    logs.unshift(newLog);
    // Keep max 200 logs
    if (logs.length > 200) logs.pop();
    setCollection(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  // PRODUCTS CRUD
  async function getProducts(filters = {}) {
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${url}/rest/v1/products?select=*,images:product_images(*),variants:product_variants(*)&order=created_at.desc`, { headers }),
          fetch(`${url}/rest/v1/categories?select=*`, { headers })
        ]);

        if (prodRes.ok) {
          const liveProds = await prodRes.json();
          const catMap = new Map();
          if (catRes.ok) {
            const cats = await catRes.json();
            cats.forEach(c => catMap.set(c.id, c.slug));
          }

          const mapped = liveProds.map(p => {
            const sortedImgs = (p.images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            const mainImg = sortedImgs[0]?.storage_path || 'assets/images/prod-sienna.jpg';
            const gallery = sortedImgs.map(i => i.storage_path);
            const variants = p.variants || [];
            const totalStock = variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
            const resolvedCat = catMap.get(p.category_id) || 'dresses';

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              sku: variants[0]?.sku || `MB-${p.name.substring(0, 3).toUpperCase()}`,
              category: resolvedCat,
              price: Number(p.base_price || 0),
              salePrice: p.sale_price ? Number(p.sale_price) : null,
              stock: totalStock,
              lowStockThreshold: p.low_stock_threshold || 5,
              status: p.is_active ? 'active' : 'draft',
              featured: Boolean(p.is_featured),
              newArrival: Boolean(p.is_featured),
              shortDescription: p.description,
              description: p.description,
              fabric: p.fabric || '',
              care: p.care_instructions || '',
              image: mainImg,
              gallery: gallery.length ? gallery : [mainImg],
              variants: variants
            };
          });

          setCollection(STORAGE_KEYS.PRODUCTS, mapped);
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getProducts warning:', err);
      }
    }

    let list = getCollection(STORAGE_KEYS.PRODUCTS, []);
    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
      );
    }
    if (filters.stockStatus) {
      if (filters.stockStatus === 'low') {
        list = list.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
      } else if (filters.stockStatus === 'out') {
        list = list.filter(p => p.stock === 0);
      } else if (filters.stockStatus === 'in') {
        list = list.filter(p => p.stock > (p.lowStockThreshold || 5));
      }
    }
    return list;
  }

  async function getProductById(id) {
    const list = getCollection(STORAGE_KEYS.PRODUCTS, []);
    return list.find(p => p.id === id) || null;
  }

  async function saveProduct(productData) {
    const list = getCollection(STORAGE_KEYS.PRODUCTS, []);
    let saved;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.id);
    const isNew = !productData.id || productData.id.startsWith('new-') || productData.id.startsWith('prod-') || !isUUID;

    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      try {
        // Resolve category_id UUID from category name, slug, or ID
        let resolvedCategoryId = null;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.categoryId)) {
          resolvedCategoryId = productData.categoryId;
        } else if (productData.category) {
          try {
            const catRes = await fetch(`${url}/rest/v1/categories?select=id,slug`, { headers });
            if (catRes.ok) {
              const cats = await catRes.json();
              const match = cats.find(c => c.slug === productData.category || c.id === productData.category);
              if (match) resolvedCategoryId = match.id;
            }
          } catch(e) {}
        }

        const cleanProdSlug = (productData.slug || productData.name || 'product')
          .toLowerCase()
          .trim()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const payload = {
          name: productData.name,
          slug: cleanProdSlug,
          category_id: resolvedCategoryId,
          base_price: Number(productData.price || 0),
          sale_price: productData.salePrice ? Number(productData.salePrice) : null,
          description: productData.description || productData.shortDescription || '',
          fabric: productData.fabric || '',
          care_instructions: productData.care || '',
          low_stock_threshold: Number(productData.lowStockThreshold) || 5,
          is_active: productData.status !== 'draft' && productData.status !== 'archived',
          is_featured: Boolean(productData.featured || productData.newArrival)
        };

        let targetId = productData.id;

        if (isNew) {
          const res = await fetch(`${url}/rest/v1/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const created = await res.json();
            if (created && created[0]) {
              targetId = created[0].id;
              productData.id = targetId;
            }
          } else {
            const errText = await res.text();
            console.error('[AdminService] Supabase POST product error:', res.status, errText);
            throw new Error(`Failed to create product in database: ${errText}`);
          }
        } else {
          const res = await fetch(`${url}/rest/v1/products?id=eq.${targetId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
          });
          if (!res.ok) {
            const errText = await res.text();
            console.error('[AdminService] Supabase PATCH product error:', res.status, errText);
            throw new Error(`Failed to update product in database: ${errText}`);
          }
        }

        // Sync Product Images to product_images table in Supabase
        if (targetId) {
          const imagesToSave = [];
          const mainImg = productData.image || productData.gallery?.[0];
          if (mainImg) {
            imagesToSave.push({ product_id: targetId, storage_path: mainImg, display_order: 1 });
          }
          if (Array.isArray(productData.gallery)) {
            productData.gallery.forEach((g, idx) => {
              if (g && g !== mainImg) {
                imagesToSave.push({ product_id: targetId, storage_path: g, display_order: idx + 2 });
              }
            });
          }
          if (imagesToSave.length > 0) {
            try {
              await fetch(`${url}/rest/v1/product_images?product_id=eq.${targetId}`, { method: 'DELETE', headers });
              await fetch(`${url}/rest/v1/product_images`, {
                method: 'POST',
                headers,
                body: JSON.stringify(imagesToSave)
              });
            } catch (ie) {
              console.warn('[AdminService] Supabase product_images sync warning:', ie);
            }
          }
        }

        // Sync Variants to product_variants table in Supabase
        if (targetId && Array.isArray(productData.variants) && productData.variants.length > 0) {
          try {
            await fetch(`${url}/rest/v1/product_variants?product_id=eq.${targetId}`, { method: 'DELETE', headers });
            const varsPayload = productData.variants.map((v, idx) => ({
              product_id: targetId,
              sku: v.sku || `${productData.sku || 'MB'}-${v.size || idx}`,
              size: v.size || 'M',
              color: v.color || 'Default',
              stock_qty: Number(v.stock ?? v.stock_qty ?? 10),
              image_url: v.image_url || null
            }));
            await fetch(`${url}/rest/v1/product_variants`, {
              method: 'POST',
              headers,
              body: JSON.stringify(varsPayload)
            });
          } catch (ve) {
            console.warn('[AdminService] Supabase product_variants sync warning:', ve);
          }
        }

      } catch (err) {
        console.error('[AdminService] Supabase saveProduct error:', err);
        throw err;
      }
    }

    if (isNew) {
      saved = {
        ...productData,
        id: productData.id || ('prod-' + Date.now()),
        createdAt: new Date().toISOString()
      };
      list.unshift(saved);
      logAction('PRODUCT_CREATED', 'Product', saved.id, `Created product "${saved.name}" (SKU: ${saved.sku})`);
    } else {
      const index = list.findIndex(p => p.id === productData.id);
      if (index === -1) {
        list.unshift(productData);
        saved = productData;
      } else {
        saved = { ...list[index], ...productData, updatedAt: new Date().toISOString() };
        list[index] = saved;
      }
      logAction('PRODUCT_UPDATED', 'Product', saved.id, `Updated details for "${saved.name}"`);
    }

    setCollection(STORAGE_KEYS.PRODUCTS, list);

    // Refresh live storefront catalog
    if (window.MB_DATA?.loadLiveCatalog) {
      window.MB_DATA.loadLiveCatalog().catch(() => {});
    }

    return saved;
  }

  async function deleteProduct(id) {
    if (!id) return false;

    // 1. Delete directly from live Supabase database tables
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json'
      };

      try {
        // Unlink from order items if needed to satisfy foreign keys
        try {
          await fetch(`${url}/rest/v1/order_items?product_id=eq.${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ product_id: null })
          });
        } catch (oe) {}

        // Delete dependent variants and images first (foreign key constraints)
        await fetch(`${url}/rest/v1/product_images?product_id=eq.${id}`, { method: 'DELETE', headers });
        await fetch(`${url}/rest/v1/product_variants?product_id=eq.${id}`, { method: 'DELETE', headers });
        const res = await fetch(`${url}/rest/v1/products?id=eq.${id}`, { method: 'DELETE', headers });
        console.log('[AdminService] Live Supabase DELETE product response:', res.status);
        if (!res.ok && res.status !== 204) {
          const errText = await res.text();
          console.error('[AdminService] Supabase deleteProduct error:', res.status, errText);
          throw new Error(`Failed to delete product from database: ${errText}`);
        }
      } catch (err) {
        console.error('[AdminService] Error deleting from live Supabase:', err);
        throw err;
      }
    }

    // 2. Remove from local storage collection
    const list = getCollection(STORAGE_KEYS.PRODUCTS, []);
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      const removed = list.splice(index, 1)[0];
      setCollection(STORAGE_KEYS.PRODUCTS, list);
      logAction('PRODUCT_DELETED', 'Product', id, `Deleted product "${removed.name}" from database`);
    }

    // 3. Keep live storefront window.MB_DATA in sync
    if (window.MB_DATA && Array.isArray(window.MB_DATA.products)) {
      window.MB_DATA.products = window.MB_DATA.products.filter(p => p.id !== id);
      window.dispatchEvent(new CustomEvent('mb:catalog-loaded', { detail: { count: window.MB_DATA.products.length } }));
    }

    return true;
  }

  async function quickUpdateStock(id, newStock) {
    const list = getCollection(STORAGE_KEYS.PRODUCTS, window.MB_ADMIN_MODELS?.seedProducts);
    const item = list.find(p => p.id === id);
    if (!item) throw new Error('Product not found');
    const oldStock = item.stock;
    const parsedStock = parseInt(newStock, 10) || 0;
    item.stock = parsedStock;
    setCollection(STORAGE_KEYS.PRODUCTS, list);
    logAction('STOCK_ADJUSTED', 'Product', id, `Updated stock from ${oldStock} to ${item.stock} for "${item.name}"`);

    // Sync to Supabase product_variants if live
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json'
      };
      try {
        await fetch(`${url}/rest/v1/product_variants?product_id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ stock_qty: parsedStock })
        });
      } catch (e) {
        console.warn('[AdminService] Supabase stock sync warning:', e);
      }
    }

    return item;
  }

  // CATEGORIES CRUD
  async function getCategories() {
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
      try {
        const res = await fetch(`${url}/rest/v1/categories?order=display_order`, { headers });
        if (res.ok) {
          const liveCats = await res.json();
          if (Array.isArray(liveCats)) {
            // Count products per category
            let prods = [];
            try {
              const pRes = await fetch(`${url}/rest/v1/products?select=id,category_id`, { headers });
              if (pRes.ok) prods = await pRes.json();
            } catch (pe) {}

            const mapped = liveCats.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description || '',
              image: c.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop',
              displayOrder: c.display_order || 1,
              status: c.is_active ? 'active' : 'hidden',
              productCount: prods.filter(p => p.category_id === c.id).length
            }));

            setCollection(STORAGE_KEYS.CATEGORIES, mapped);
            return mapped;
          }
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getCategories error:', err);
      }
    }
    return getCollection(STORAGE_KEYS.CATEGORIES, window.MB_ADMIN_MODELS?.seedCategories || []);
  }

  async function getCategoryById(id) {
    const list = await getCategories();
    return list.find(c => c.id === id || c.slug === id) || null;
  }

  async function saveCategory(catData) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catData.id);
    let isNew = !catData.id || catData.id.startsWith('new-') || catData.id.startsWith('cat-');

    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const cleanCatSlug = (catData.slug || catData.name || 'category')
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload = {
        name: catData.name,
        slug: cleanCatSlug,
        description: catData.description || '',
        image_url: catData.image || null,
        display_order: Number(catData.displayOrder) || 1,
        is_active: catData.status !== 'hidden' && catData.status !== 'archived'
      };

      try {
        let targetId = isUUID ? catData.id : null;
        if (!targetId && !isNew) {
          const checkRes = await fetch(`${url}/rest/v1/categories?slug=eq.${payload.slug}`, { headers });
          if (checkRes.ok) {
            const existing = await checkRes.json();
            if (existing && existing[0]) {
              targetId = existing[0].id;
              isNew = false;
            } else {
              isNew = true;
            }
          }
        }

        if (isNew || !targetId) {
          const res = await fetch(`${url}/rest/v1/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
              catData.id = data[0].id;
            }
          } else {
            const errText = await res.text();
            console.error('[AdminService] Supabase POST category failed:', res.status, errText);
            throw new Error(`Failed to create category in database: ${errText}`);
          }
        } else {
          const res = await fetch(`${url}/rest/v1/categories?id=eq.${targetId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() })
          });
          if (res.ok) {
            catData.id = targetId;
          } else {
            const errText = await res.text();
            console.error('[AdminService] Supabase PATCH category failed:', res.status, errText);
            throw new Error(`Failed to update category in database: ${errText}`);
          }
        }
      } catch (e) {
        console.error('[AdminService] Supabase category save error:', e);
        throw e;
      }
    }

    const list = getCollection(STORAGE_KEYS.CATEGORIES, window.MB_ADMIN_MODELS?.seedCategories || []);
    let saved;
    const idx = list.findIndex(c => c.id === catData.id || c.slug === catData.slug);
    if (idx === -1) {
      saved = { ...catData, id: catData.id || `cat-${Date.now()}`, productCount: 0 };
      list.push(saved);
      logAction('CATEGORY_CREATED', 'Category', saved.id, `Created category "${saved.name}"`);
    } else {
      saved = { ...list[idx], ...catData };
      list[idx] = saved;
      logAction('CATEGORY_UPDATED', 'Category', saved.id, `Updated category "${saved.name}"`);
    }

    setCollection(STORAGE_KEYS.CATEGORIES, list);

    // Refresh live storefront catalog
    if (window.MB_DATA?.loadLiveCatalog) {
      window.MB_DATA.loadLiveCatalog().catch(() => {});
    }

    return saved;
  }

  async function deleteCategory(id) {
    if (!id) return false;

    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json'
      };
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      try {
        let filter = isUUID ? `id=eq.${id}` : `slug=eq.${id}`;
        let targetUuid = isUUID ? id : null;
        if (!isUUID) {
          try {
            const catRes = await fetch(`${url}/rest/v1/categories?slug=eq.${id}`, { headers });
            if (catRes.ok) {
              const liveCats = await catRes.json();
              if (liveCats && liveCats[0]) {
                targetUuid = liveCats[0].id;
                filter = `id=eq.${targetUuid}`;
              }
            }
          } catch (se) {}
        }

        // Unlink referencing products first to prevent PostgreSQL foreign key constraint error 409
        if (targetUuid) {
          try {
            await fetch(`${url}/rest/v1/products?category_id=eq.${targetUuid}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ category_id: null })
            });
          } catch (pe) {}
        }

        const res = await fetch(`${url}/rest/v1/categories?${filter}`, { method: 'DELETE', headers });
        if (!res.ok && res.status !== 204) {
          const errText = await res.text();
          console.error('[AdminService] Supabase deleteCategory error response:', res.status, errText);
          throw new Error(`Failed to delete category: ${errText}`);
        }
      } catch (e) {
        console.error('[AdminService] Supabase deleteCategory error:', e);
        throw e;
      }
    }

    const list = getCollection(STORAGE_KEYS.CATEGORIES, []);
    const idx = list.findIndex(c => c.id === id || c.slug === id);
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      setCollection(STORAGE_KEYS.CATEGORIES, list);
      logAction('CATEGORY_DELETED', 'Category', id, `Deleted category "${removed.name}"`);
    }

    if (window.MB_DATA?.loadLiveCatalog) {
      window.MB_DATA.loadLiveCatalog().catch(() => {});
    }

    return true;
  }

  // NORMALIZERS
  function normalizeOrder(o) {
    if (!o) return null;
    const total = o.total ?? o.pricing?.total ?? 0;
    const subtotal = o.subtotal ?? o.pricing?.subtotal ?? total;
    const shippingCost = o.shippingCost ?? o.pricing?.shipping ?? 0;
    const discount = o.discount ?? o.pricing?.discount ?? 0;
    const orderNumber = o.orderNumber || o.id || 'ORD-000';
    const customer = o.customer ? {
      ...o.customer,
      city: o.customer.city || o.shippingAddress?.city || 'Mumbai'
    } : { name: 'Client', email: '', phone: '', city: 'Mumbai' };
    const items = (o.items || []).map(i => ({
      ...i,
      title: i.title || i.name || 'Garment',
      price: i.price || 0,
      quantity: i.quantity || i.qty || 1,
      image: i.image || 'assets/images/prod-sienna.jpg'
    }));

    return {
      ...o,
      id: o.id || orderNumber,
      orderNumber,
      total,
      subtotal,
      shippingCost,
      discount,
      customer,
      items,
      date: (o.date || '').replace('T', ' ').substring(0, 16) || '2026-09-26 12:00'
    };
  }

  function normalizeCustomer(c) {
    if (!c) return null;
    const totalSpent = c.totalSpent ?? c.lifetimeSpend ?? 0;
    const ordersCount = c.ordersCount ?? c.totalOrders ?? 0;
    const city = c.city || (c.addresses && c.addresses[0]?.city) || 'Mumbai';
    const state = c.state || (c.addresses && c.addresses[0]?.state) || 'India';
    const joinedAt = c.joinedAt || c.registeredDate || '2026-08-10';

    return {
      ...c,
      totalSpent,
      ordersCount,
      city,
      state,
      joinedAt
    };
  }

  function normalizeReturn(r) {
    if (!r) return null;
    return {
      ...r,
      returnNumber: r.returnNumber || r.id || 'RET-000',
      orderNumber: r.orderNumber || r.orderId || 'ORD-000',
      requestedAt: r.requestedAt || r.date || '2026-09-26',
      status: r.status === 'REQUESTED' ? 'PENDING' : r.status
    };
  }

  function normalizeCoupon(c) {
    if (!c) return null;
    return {
      ...c,
      discountType: c.discountType || (c.type === 'PERCENTAGE' ? 'percentage' : 'flat'),
      discountValue: c.discountValue ?? c.value ?? 0,
      minOrderValue: c.minOrderValue ?? c.minOrder ?? 0,
      expiresAt: c.expiresAt || c.validUntil || '2026-12-31',
      usedCount: c.usedCount ?? c.timesUsed ?? 0,
      usageLimit: c.usageLimit ?? c.maxUses ?? 100
    };
  }

  // ORDERS CRUD
  // ORDERS CRUD
  async function getOrders(filters = {}) {
    let rawList = [];

    // 1. Fetch directly from live Supabase orders table
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
      try {
        const res = await fetch(`${url}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`, { headers });
        if (res.ok) {
          const liveOrders = await res.json();
          if (Array.isArray(liveOrders)) {
            rawList = liveOrders.map(o => {
              const shipAddr = o.shipping_address || {};
              const customerName = shipAddr.full_name || shipAddr.name || 'Patron';
              const items = (o.order_items || []).map(i => ({
                id: i.product_id || i.id,
                name: i.product_name,
                title: i.product_name,
                price: Number(i.unit_price || 0),
                quantity: i.quantity || 1,
                size: i.size || '',
                color: i.color || '',
                total: Number(i.unit_price || 0) * (i.quantity || 1),
                image: 'assets/images/logo-emblem.png'
              }));

              return {
                id: o.id,
                orderNumber: o.order_number || o.id,
                date: (o.created_at || '').replace('T', ' ').substring(0, 16),
                status: o.order_status || 'PROCESSING',
                paymentStatus: o.payment_status || 'PENDING',
                paymentMethod: o.payment_method || 'COD',
                customer: {
                  name: customerName,
                  email: shipAddr.email || '',
                  phone: shipAddr.phone || '',
                  city: shipAddr.city || 'Mumbai'
                },
                shippingAddress: {
                  fullName: customerName,
                  name: customerName,
                  phone: shipAddr.phone || '',
                  addressLine1: shipAddr.address_line1 || shipAddr.line1 || '',
                  line1: shipAddr.address_line1 || shipAddr.line1 || '',
                  addressLine2: shipAddr.address_line2 || shipAddr.line2 || '',
                  city: shipAddr.city || 'Mumbai',
                  state: shipAddr.state || '',
                  pin: shipAddr.pin_code || shipAddr.pincode || '',
                  pincode: shipAddr.pin_code || shipAddr.pincode || '',
                  country: shipAddr.country || 'India'
                },
                items: items,
                pricing: {
                  subtotal: Number(o.subtotal || 0),
                  shipping: 0,
                  discount: Number(o.discount_amount || 0),
                  total: Number(o.total_amount || 0)
                },
                total: Number(o.total_amount || 0),
                subtotal: Number(o.subtotal || 0),
                timeline: [
                  { title: 'Order Placed', time: (o.created_at || '').replace('T', ' ').substring(0, 16), done: true },
                  { title: 'Payment Status: ' + (o.payment_status || 'PENDING'), time: '', done: o.payment_status === 'PAID' }
                ]
              };
            });
          }
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getOrders warning:', err);
      }
    }

    // Merge storefront orders placed in dev storage
    try {
      const devRaw = localStorage.getItem('mb_dev_orders');
      if (devRaw) {
        const devOrders = JSON.parse(devRaw);
        devOrders.forEach(devO => {
          const exists = rawList.some(o => (o.orderNumber === devO.order_number) || (o.id === devO.order_number) || (o.id === devO.id));
          if (!exists) {
            rawList.unshift({
              id: devO.order_number || devO.id,
              orderNumber: devO.order_number || devO.id,
              customer: {
                name: devO.shipping_full_name || 'Atelier Patron',
                email: devO.customer_email || 'patron@marshbarbary.com',
                phone: devO.shipping_phone || '',
                city: devO.shipping_city || 'Bengaluru'
              },
              shippingAddress: {
                name: devO.shipping_full_name,
                phone: devO.shipping_phone,
                line1: devO.shipping_address_line_1,
                line2: devO.shipping_address_line_2 || '',
                city: devO.shipping_city,
                state: devO.shipping_state,
                pincode: devO.shipping_postal_code,
                country: devO.shipping_country || 'India'
              },
              items: (devO.items || []).map(i => ({
                id: i.product_id,
                name: i.product_name,
                title: i.product_name,
                price: Number(i.unit_price || 0),
                quantity: i.quantity || 1,
                image: i.image_url || 'assets/images/logo-emblem.png'
              })),
              pricing: {
                subtotal: Number(devO.subtotal || 0),
                shipping: Number(devO.shipping_fee || 0),
                discount: Number(devO.discount_amount || 0),
                total: Number(devO.total_amount || 0)
              },
              total: Number(devO.total_amount || 0),
              status: devO.status || 'PROCESSING',
              paymentMethod: devO.payment_method || 'COD',
              paymentStatus: devO.payment_status || 'PENDING',
              trackingCarrier: devO.tracking_carrier || '',
              trackingNumber: devO.tracking_number || '',
              trackingUrl: devO.tracking_url || '',
              date: devO.created_at || new Date().toISOString(),
              timeline: devO.timeline || []
            });
          }
        });
      }
    } catch (e) {
      console.warn('[AdminService] Error merging storefront orders:', e);
    }

    setCollection(STORAGE_KEYS.ORDERS, rawList);

    let list = rawList.map(normalizeOrder);
    if (filters.status && filters.status !== 'all') {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      list = list.filter(o => o.paymentStatus === filters.paymentStatus);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o => 
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customer?.name || '').toLowerCase().includes(q) ||
        (o.customer?.email || '').toLowerCase().includes(q) ||
        (o.customer?.phone || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async function getOrderById(id) {
    const list = await getOrders();
    return list.find(o => o.id === id || o.orderNumber === id) || null;
  }

  async function updateOrderStatus(id, newStatus, trackingInfo = {}) {
    const list = getCollection(STORAGE_KEYS.ORDERS, []);
    let order = list.find(o => o.id === id || o.orderNumber === id);

    if (!order) {
      const allMerged = await getOrders();
      const mergedOrder = allMerged.find(o => o.id === id || o.orderNumber === id);
      if (mergedOrder) {
        order = JSON.parse(JSON.stringify(mergedOrder));
        list.unshift(order);
      }
    }

    if (!order) throw new Error('Order not found');

    const oldStatus = order.status;
    order.status = newStatus;
    if (trackingInfo.carrier) order.trackingCarrier = trackingInfo.carrier;
    if (trackingInfo.trackingNumber) order.trackingNumber = trackingInfo.trackingNumber;
    if (trackingInfo.trackingUrl) order.trackingUrl = trackingInfo.trackingUrl;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: newStatus,
      time: now,
      note: trackingInfo.note || `Order status updated to ${newStatus}`
    });

    setCollection(STORAGE_KEYS.ORDERS, list);

    // Sync to Supabase orders table
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey, 'Content-Type': 'application/json' };
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);
        const query = isUUID ? `id=eq.${order.id}` : `order_number=eq.${order.orderNumber}`;
        await fetch(`${url}/rest/v1/orders?${query}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            order_status: newStatus,
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[AdminService] Supabase updateOrderStatus warning:', err);
      }
    }

    logAction('ORDER_STATUS_UPDATED', 'Order', order.orderNumber, `Status updated from ${oldStatus} to ${newStatus}`);
    return order;
  }

  async function addOrderNote(id, noteText) {
    const list = getCollection(STORAGE_KEYS.ORDERS, []);
    const order = list.find(o => o.id === id || o.orderNumber === id);
    if (!order) throw new Error('Order not found');

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: order.status,
      time: now,
      note: `Note: ${noteText}`
    });

    setCollection(STORAGE_KEYS.ORDERS, list);
    logAction('ORDER_NOTE_ADDED', 'Order', order.orderNumber, `Added internal note: "${noteText.substring(0, 30)}..."`);
    return order;
  }

  // CUSTOMERS
  async function getCustomers(filters = {}) {
    let rawList = [];

    // 1. Fetch directly from live Supabase profiles and orders
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };
      try {
        const [profRes, ordRes] = await Promise.all([
          fetch(`${url}/rest/v1/profiles?select=*`, { headers }),
          fetch(`${url}/rest/v1/orders?select=id,customer_id,shipping_address,total_amount,created_at`, { headers })
        ]);

        const profiles = profRes.ok ? await profRes.json() : [];
        const liveOrders = ordRes.ok ? await ordRes.json() : [];

        const customerMap = new Map();

        if (Array.isArray(profiles)) {
          profiles.forEach(p => {
            const customerOrders = Array.isArray(liveOrders) ? liveOrders.filter(o => o.customer_id === p.id) : [];
            const spent = customerOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            const latestOrderWithAddr = customerOrders.find(o => o.shipping_address && (o.shipping_address.address_line1 || o.shipping_address.line1 || o.shipping_address.city));
            const shipAddr = latestOrderWithAddr?.shipping_address || {};

            customerMap.set(p.id, {
              id: p.id,
              name: p.full_name || 'Patron',
              email: p.email || '',
              phone: p.phone || shipAddr.phone || '',
              city: shipAddr.city || 'Mumbai',
              state: shipAddr.state || 'Maharashtra',
              joinedAt: (p.created_at || new Date().toISOString()).substring(0, 10),
              ordersCount: customerOrders.length,
              totalSpent: spent,
              addresses: (shipAddr.city || shipAddr.address_line1 || shipAddr.line1) ? [shipAddr] : []
            });
          });
        }

        // Also aggregate customers from orders
        if (Array.isArray(liveOrders)) {
          liveOrders.forEach(o => {
            const addr = o.shipping_address || {};
            const email = (addr.email || '').toLowerCase();
            const name = addr.full_name || addr.name || 'Patron';
            const key = o.customer_id || email;
            if (key && !customerMap.has(key)) {
              const custOrders = liveOrders.filter(lo => (lo.customer_id && lo.customer_id === o.customer_id) || (lo.shipping_address?.email?.toLowerCase() === email));
              const spent = custOrders.reduce((sum, lo) => sum + Number(lo.total_amount || 0), 0);
              customerMap.set(key, {
                id: key,
                name: name,
                email: email,
                phone: addr.phone || '',
                city: addr.city || 'Mumbai',
                state: addr.state || '',
                joinedAt: (o.created_at || new Date().toISOString()).substring(0, 10),
                ordersCount: custOrders.length,
                totalSpent: spent,
                addresses: [addr]
              });
            }
          });
        }

        rawList = Array.from(customerMap.values());
      } catch (err) {
        console.warn('[AdminService] Supabase getCustomers error:', err);
      }
    }

    // Fallback: derive customers from orders or stored collection if rawList is empty
    if (rawList.length === 0) {
      const stored = getCollection(STORAGE_KEYS.CUSTOMERS, []);
      if (stored && stored.length) {
        rawList = stored;
      } else {
        try {
          const orders = await getOrders();
          const customerMap = new Map();
          orders.forEach(o => {
            const email = (o.customer?.email || '').toLowerCase();
            const key = email || o.customer?.name || o.id;
            if (!key) return;
            if (!customerMap.has(key)) {
              customerMap.set(key, {
                id: `cust-${String(key).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
                name: o.customer?.name || o.shippingAddress?.fullName || o.shippingAddress?.name || 'Atelier Patron',
                email: email,
                phone: o.customer?.phone || o.shippingAddress?.phone || '',
                city: o.shippingAddress?.city || o.customer?.city || 'Mumbai',
                state: o.shippingAddress?.state || 'Maharashtra',
                joinedAt: (o.date || new Date().toISOString()).substring(0, 10),
                ordersCount: 1,
                totalSpent: Number(o.total || 0),
                addresses: o.shippingAddress ? [o.shippingAddress] : []
              });
            } else {
              const existing = customerMap.get(key);
              existing.ordersCount = (existing.ordersCount || 1) + 1;
              existing.totalSpent = (existing.totalSpent || 0) + Number(o.total || 0);
              if (!existing.phone && (o.customer?.phone || o.shippingAddress?.phone)) {
                existing.phone = o.customer?.phone || o.shippingAddress?.phone;
              }
              if (o.shippingAddress && (!existing.addresses || !existing.addresses.length)) {
                existing.addresses = [o.shippingAddress];
              }
            }
          });
          rawList = Array.from(customerMap.values());
        } catch (e) {
          console.warn('[AdminService] Error deriving clientele from orders:', e);
        }
      }
    }

    if (rawList.length > 0) {
      setCollection(STORAGE_KEYS.CUSTOMERS, rawList);
    }

    let list = rawList.map(normalizeCustomer);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      );
    }
    if (filters.segment && filters.segment !== 'all') {
      if (filters.segment === 'vip') list = list.filter(c => (c.totalSpent || 0) >= 10000);
      else if (filters.segment === 'repeat') list = list.filter(c => (c.ordersCount || 0) > 1);
      else if (filters.segment === 'new') list = list.filter(c => (c.ordersCount || 0) <= 1);
    }
    return list;
  }

  async function getCustomerById(id) {
    const list = await getCustomers();
    return list.find(c => c.id === id) || null;
  }

  async function updateCustomer(id, data) {
    const list = getCollection(STORAGE_KEYS.CUSTOMERS, []);
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setCollection(STORAGE_KEYS.CUSTOMERS, list);
    }

    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      const { url, anonKey } = window.MB_SUPABASE_CONFIG;
      const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey, 'Content-Type': 'application/json' };
      try {
        await fetch(`${url}/rest/v1/profiles?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            full_name: data.name,
            phone: data.phone,
            updated_at: new Date().toISOString()
          })
        });
      } catch (e) {
        console.warn('[AdminService] Supabase updateCustomer error:', e);
      }
    }

    logAction('CUSTOMER_UPDATED', 'Customer', id, `Updated details for customer ${data.name || id}`);
    return list[idx] ? normalizeCustomer(list[idx]) : null;
  }

  // RETURNS CRUD
  async function getReturns(filters = {}) {
    let rawList = getCollection(STORAGE_KEYS.RETURNS, window.MB_ADMIN_MODELS?.seedReturns);
    let list = rawList.map(normalizeReturn);
    if (filters.status && filters.status !== 'all') {
      list = list.filter(r => r.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        (r.returnNumber || '').toLowerCase().includes(q) ||
        (r.orderNumber || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async function getReturnById(id) {
    const list = await getReturns();
    return list.find(r => r.id === id || r.returnNumber === id) || null;
  }

  async function updateReturnStatus(id, newStatus, adminNotes) {
    const list = getCollection(STORAGE_KEYS.RETURNS, window.MB_ADMIN_MODELS?.seedReturns);
    const ret = list.find(r => r.id === id || r.returnNumber === id);
    if (!ret) throw new Error('Return request not found');

    const oldStatus = ret.status;
    ret.status = newStatus;
    if (adminNotes) ret.adminNotes = adminNotes;
    ret.updatedAt = new Date().toISOString().substring(0, 10);

    setCollection(STORAGE_KEYS.RETURNS, list);
    logAction('RETURN_STATUS_UPDATED', 'Return', ret.returnNumber, `Status updated from ${oldStatus} to ${newStatus}`);
    return normalizeReturn(ret);
  }

  // COUPONS CRUD
  async function getCoupons() {
    const raw = getCollection(STORAGE_KEYS.COUPONS, window.MB_ADMIN_MODELS?.seedCoupons);
    return raw.map(normalizeCoupon);
  }

  async function getCouponById(id) {
    const list = await getCoupons();
    return list.find(c => c.id === id || c.code === id) || null;
  }

  async function saveCoupon(couponData) {
    const list = getCollection(STORAGE_KEYS.COUPONS, window.MB_ADMIN_MODELS?.seedCoupons);
    let saved;
    const isNew = !couponData.id || couponData.id.startsWith('new-');

    if (isNew) {
      saved = {
        ...couponData,
        id: 'cpn-' + Date.now(),
        code: (couponData.code || '').toUpperCase().trim(),
        usedCount: 0
      };
      list.push(saved);
      logAction('COUPON_CREATED', 'Coupon', saved.code, `Created coupon "${saved.code}" (${saved.discountType}: ${saved.discountValue})`);
    } else {
      const idx = list.findIndex(c => c.id === couponData.id);
      if (idx === -1) throw new Error('Coupon not found');
      saved = { ...list[idx], ...couponData, code: (couponData.code || '').toUpperCase().trim() };
      list[idx] = saved;
      logAction('COUPON_UPDATED', 'Coupon', saved.code, `Updated coupon "${saved.code}"`);
    }

    setCollection(STORAGE_KEYS.COUPONS, list);
    return saved;
  }

  async function deleteCoupon(id) {
    const list = getCollection(STORAGE_KEYS.COUPONS, window.MB_ADMIN_MODELS?.seedCoupons);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Coupon not found');
    const removed = list.splice(idx, 1)[0];
    setCollection(STORAGE_KEYS.COUPONS, list);
    logAction('COUPON_DELETED', 'Coupon', removed.code, `Deleted coupon "${removed.code}"`);
    return true;
  }

  // HOMEPAGE CONFIG
  async function getHomepageConfig() {
    const config = getCollection(STORAGE_KEYS.HOMEPAGE, window.MB_ADMIN_MODELS?.seedHomepageConfig);
    const cachedHero = typeof localStorage !== 'undefined' ? localStorage.getItem('mb_hero_image') : null;
    if (cachedHero && (!config.hero || !config.hero.image)) {
      config.hero = config.hero || {};
      config.hero.image = cachedHero;
    }

    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      try {
        const { url, anonKey } = window.MB_SUPABASE_CONFIG;
        const res = await fetch(`${url}/rest/v1/hero_content?is_active=eq.true&limit=1`, {
          headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]?.desktop_image_path) {
            config.hero = config.hero || {};
            config.hero.image = rows[0].desktop_image_path;
            setCollection(STORAGE_KEYS.HOMEPAGE, config);
            try { localStorage.setItem('mb_hero_image', rows[0].desktop_image_path); } catch(e) {}
          }
        }
      } catch (e) {
        console.warn('[AdminService] Error fetching live hero_content from Supabase:', e);
      }
    }

    return config;
  }

  async function saveHomepageConfig(config) {
    setCollection(STORAGE_KEYS.HOMEPAGE, config);
    if (config.hero && config.hero.image) {
      try { localStorage.setItem('mb_hero_image', config.hero.image); } catch(e) {}
    }

    // Sync hero image directly with Supabase hero_content
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      try {
        const { url, anonKey } = window.MB_SUPABASE_CONFIG;
        const headers = {
          'apikey': anonKey,
          'Authorization': 'Bearer ' + anonKey,
          'Content-Type': 'application/json'
        };
        if (config.hero && config.hero.image) {
          await fetch(`${url}/rest/v1/hero_content?is_active=eq.true`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              desktop_image_path: config.hero.image,
              mobile_image_path: config.hero.image,
              updated_at: new Date().toISOString()
            })
          });
        }
      } catch (err) {
        console.warn('[AdminService] Supabase hero_content sync error:', err);
      }
    }

    logAction('HOMEPAGE_CONFIG_UPDATED', 'Homepage', 'global', 'Updated hero sliders, promotional banners, and campaign imagery');
    return config;
  }

  // INDEPENDENT SLIDER MANAGEMENT (Home Slider & About Slider)
  async function getSliderConfig(sliderId = 'home') {
    const isHome = sliderId === 'home';
    const key = isHome ? STORAGE_KEYS.HOME_SLIDER : STORAGE_KEYS.ABOUT_SLIDER;
    const models = window.MB_ADMIN_MODELS || {};
    const defaultSeed = isHome ? models.seedHomeSliderConfig : models.seedAboutSliderConfig;
    
    // Check Supabase settings if configured
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      try {
        const { url, anonKey } = window.MB_SUPABASE_CONFIG;
        const settingKey = isHome ? 'home_slider_config' : 'about_slider_config';
        const res = await fetch(`${url}/rest/v1/settings?key=eq.${settingKey}&limit=1`, {
          headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows[0]?.value) {
            const val = rows[0].value;
            if (val && typeof val === 'object') {
              setCollection(key, val);
              return val;
            }
          }
        }
      } catch (err) {
        console.warn(`[AdminService] Error fetching ${sliderId} slider config from Supabase:`, err);
      }
    }

    let config = getCollection(key, defaultSeed || { mode: 'fixed', posts: [] });
    // Normalize if array was stored previously
    if (Array.isArray(config)) {
      config = { mode: 'fixed', posts: config };
      setCollection(key, config);
    }
    if (!config.mode) config.mode = 'fixed';
    if (!Array.isArray(config.posts)) config.posts = [];
    return config;
  }

  async function saveSliderConfig(sliderId = 'home', config) {
    if (!config || typeof config !== 'object') throw new Error('Slider configuration must be an object');
    const isHome = sliderId === 'home';
    const key = isHome ? STORAGE_KEYS.HOME_SLIDER : STORAGE_KEYS.ABOUT_SLIDER;
    const normalized = {
      mode: config.mode === 'non-fixed' ? 'non-fixed' : 'fixed',
      posts: Array.isArray(config.posts) ? config.posts : []
    };

    setCollection(key, normalized);

    // Also mirror to legacy INSTAGRAM_FEED for About slider if needed
    if (!isHome) {
      setCollection(STORAGE_KEYS.INSTAGRAM_FEED, normalized.posts);
    }

    // Sync with Supabase settings table
    if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
      try {
        const { url, anonKey } = window.MB_SUPABASE_CONFIG;
        const settingKey = isHome ? 'home_slider_config' : 'about_slider_config';
        await fetch(`${url}/rest/v1/settings?key=eq.${settingKey}`, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': 'Bearer ' + anonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: normalized, updated_at: new Date().toISOString() })
        });
      } catch (err) {
        console.warn(`[AdminService] Supabase ${sliderId} slider sync error:`, err);
      }
    }

    logAction('SLIDER_CONFIG_UPDATED', 'Content', `${sliderId}-slider`, `Updated ${isHome ? 'Homepage' : 'About'} slider: Mode=${normalized.mode}, ${normalized.posts.length} posts`);
    return normalized;
  }

  // INSTAGRAM FEED MANAGEMENT (Backward compatibility mapping to About Slider)
  async function getInstagramFeed() {
    const config = await getSliderConfig('about');
    return config.posts;
  }

  async function saveInstagramFeed(posts) {
    if (!Array.isArray(posts)) throw new Error('Instagram feed must be an array of posts');
    const config = await getSliderConfig('about');
    config.posts = posts;
    await saveSliderConfig('about', config);
    return posts;
  }

  // Helper for server-style authorization check on admin management
  function requireSuperAdmin(actionName) {
    const currentUser = window.MB_ADMIN_AUTH?.getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      logAction('SECURITY_VIOLATION', 'AdminUser', currentUser?.id || 'anonymous', `Unauthorized attempt to ${actionName} without SUPER_ADMIN authority`);
      throw new Error('Access Denied: Only a SUPER_ADMIN has authority to manage administrative personnel and permissions.');
    }
  }

  // ADMIN USERS CRUD
  async function getAdminUsers() {
    return getCollection(STORAGE_KEYS.USERS, window.MB_ADMIN_MODELS?.seedAdminUsers);
  }

  async function saveAdminUser(userData) {
    requireSuperAdmin('create/modify administrative account');

    const list = getCollection(STORAGE_KEYS.USERS, window.MB_ADMIN_MODELS?.seedAdminUsers);
    let saved;
    const isNew = !userData.id || userData.id.startsWith('new-');

    // Default permissions based on role if none provided
    const defaultPerms = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS?.[userData.role] || [];
    const permissions = Array.isArray(userData.permissions) && userData.permissions.length > 0
      ? userData.permissions
      : defaultPerms;

    if (isNew) {
      saved = {
        ...userData,
        permissions,
        status: userData.status || 'active',
        id: 'adm-' + Date.now(),
        createdAt: new Date().toISOString().substring(0, 10),
        lastLogin: 'Never'
      };
      list.push(saved);
      logAction('ADMIN_USER_CREATED', 'AdminUser', saved.id, `Created administrative user "${saved.name}" with role ${saved.role}`);
    } else {
      const idx = list.findIndex(u => u.id === userData.id);
      if (idx === -1) throw new Error('Admin user not found');
      saved = { ...list[idx], ...userData, permissions };
      list[idx] = saved;
      logAction('ADMIN_USER_UPDATED', 'AdminUser', saved.id, `Updated administrative user "${saved.name}" (${saved.role})`);
    }

    setCollection(STORAGE_KEYS.USERS, list);
    return saved;
  }

  async function toggleAdminUserStatus(id) {
    requireSuperAdmin('toggle administrative account status');

    const list = getCollection(STORAGE_KEYS.USERS, window.MB_ADMIN_MODELS?.seedAdminUsers);
    const user = list.find(u => u.id === id);
    if (!user) throw new Error('Admin user not found');

    if (user.email === 'superadmin@marshbarbary.com') {
      throw new Error('Cannot disable the primary Super Admin account.');
    }

    user.status = user.status === 'active' ? 'disabled' : 'active';
    setCollection(STORAGE_KEYS.USERS, list);
    logAction('ADMIN_STATUS_CHANGED', 'AdminUser', id, `Changed status of "${user.name}" to ${user.status}`);
    return user;
  }

  async function deleteAdminUser(id) {
    requireSuperAdmin('delete administrative account');

    const list = getCollection(STORAGE_KEYS.USERS, window.MB_ADMIN_MODELS?.seedAdminUsers);
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    if (list[idx].email === 'superadmin@marshbarbary.com') {
      throw new Error('Cannot delete the primary Super Admin account.');
    }
    const removed = list.splice(idx, 1)[0];
    setCollection(STORAGE_KEYS.USERS, list);
    logAction('ADMIN_USER_DELETED', 'AdminUser', id, `Removed administrative access for "${removed.name}"`);
    return true;
  }

  // PAYMENT SETTINGS
  async function getPaymentSettings() {
    return getCollection(STORAGE_KEYS.PAYMENTS, window.MB_ADMIN_MODELS?.seedPaymentSettings);
  }

  async function savePaymentSettings(settings) {
    setCollection(STORAGE_KEYS.PAYMENTS, settings);
    logAction('PAYMENT_SETTINGS_UPDATED', 'PaymentSettings', 'global', 'Updated gateway configurations and COD preferences');
    return settings;
  }

  // STORE SETTINGS
  async function getStoreSettings() {
    return getCollection(STORAGE_KEYS.SETTINGS, window.MB_ADMIN_MODELS?.seedStoreSettings);
  }

  async function saveStoreSettings(settings) {
    setCollection(STORAGE_KEYS.SETTINGS, settings);
    logAction('STORE_SETTINGS_UPDATED', 'StoreSettings', 'global', 'Updated general brand profile, shipping thresholds, and tax policies');
    return settings;
  }

  // AUDIT LOGS
  async function getAuditLogs(filters = {}) {
    let list = getCollection(STORAGE_KEYS.AUDIT_LOGS, window.MB_ADMIN_MODELS?.seedAuditLogs);
    if (filters.action && filters.action !== 'all') {
      list = list.filter(l => l.action === filters.action);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(l => 
        l.adminName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // RESET TO FACTORY SEED DATA
  function resetToSeedData() {
    const models = window.MB_ADMIN_MODELS || {};
    setCollection(STORAGE_KEYS.CATEGORIES, models.seedCategories);
    setCollection(STORAGE_KEYS.PRODUCTS, models.seedProducts);
    setCollection(STORAGE_KEYS.ORDERS, models.seedOrders);
    setCollection(STORAGE_KEYS.CUSTOMERS, models.seedCustomers);
    setCollection(STORAGE_KEYS.RETURNS, models.seedReturns);
    setCollection(STORAGE_KEYS.COUPONS, models.seedCoupons);
    setCollection(STORAGE_KEYS.USERS, models.seedAdminUsers);
    setCollection(STORAGE_KEYS.HOMEPAGE, models.seedHomepageConfig);
    setCollection(STORAGE_KEYS.PAYMENTS, models.seedPaymentSettings);
    setCollection(STORAGE_KEYS.SETTINGS, models.seedStoreSettings);
    setCollection(STORAGE_KEYS.AUDIT_LOGS, models.seedAuditLogs);
    logAction('FACTORY_RESET', 'System', 'ALL', 'Reset all local administrative mock data to pristine factory seeds');
  }

  // Initialize immediately
  init();

  return {
    getProducts,
    getProductById,
    saveProduct,
    deleteProduct,
    quickUpdateStock,
    getCategories,
    getCategoryById,
    saveCategory,
    deleteCategory,
    getOrders,
    getOrderById,
    updateOrderStatus,
    addOrderNote,
    getCustomers,
    getCustomerById,
    updateCustomer,
    getReturns,
    getReturnById,
    updateReturnStatus,
    getCoupons,
    getCouponById,
    saveCoupon,
    deleteCoupon,
    getHomepageConfig,
    saveHomepageConfig,
    getSliderConfig,
    saveSliderConfig,
    getInstagramFeed,
    saveInstagramFeed,
    getAdminUsers,
    saveAdminUser,
    toggleAdminUserStatus,
    deleteAdminUser,
    getPaymentSettings,
    savePaymentSettings,
    getStoreSettings,
    saveStoreSettings,
    getAuditLogs,
    logAction,
    resetToSeedData
  };
})();
