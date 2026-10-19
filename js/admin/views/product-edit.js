/**
 * MARSH BARBARY — PRODUCT EDIT MODULE (REPLACED & ARCHIVED)
 * This legacy module has been completely replaced by the clean architecture:
 * 1. js/admin/product-state.js (MB_PRODUCT_FORM_STATE)
 * 2. js/admin/product-service-v2.js (MB_PRODUCT_PERSISTENCE)
 * 3. js/admin/views/product-builder.js (MB_ADMIN_VIEWS['product-edit'])
 */

// If product-builder.js is already loaded, preserve its implementation
if (!window.MB_ADMIN_VIEWS || !window.MB_ADMIN_VIEWS['product-edit']) {
  window.MB_ADMIN_VIEWS = window.MB_ADMIN_VIEWS || {};
  window.MB_ADMIN_VIEWS['product-edit'] = {
    title: 'Garment Builder',
    render(container, params) {
      if (window.MB_ADMIN_VIEWS['product-builder']) {
        return window.MB_ADMIN_VIEWS['product-builder'].render(container, params);
      }
      container.innerHTML = '<div style="padding: 40px; text-align: center;">Loading Garment Builder...</div>';
    }
  };
}
