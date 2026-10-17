/**
 * MARSH BARBARY — ADMIN ROUTER (js/admin/admin-router.js)
 * Client-side hash router dispatching modular views into the admin container.
 */

window.MB_ADMIN_ROUTER = (() => {
  const routes = [
    { pattern: /^#\/dashboard\/?$/, viewName: 'dashboard', params: () => ({}) },
    
    // Products
    { pattern: /^#\/products\/?$/, viewName: 'products', params: () => ({}) },
    { pattern: /^#\/products\/new\/?$/, viewName: 'product-edit', params: () => ({ id: 'new' }) },
    { pattern: /^#\/products\/([^/]+)\/edit\/?$/, viewName: 'product-edit', params: (m) => ({ id: m[1] }) },

    // Categories
    { pattern: /^#\/categories\/?$/, viewName: 'categories', params: () => ({}) },

    // Orders
    { pattern: /^#\/orders\/?$/, viewName: 'orders', params: () => ({}) },
    { pattern: /^#\/orders\/([^/?]+)/, viewName: 'order-detail', params: (m) => ({ id: m[1] }) },

    // Customers
    { pattern: /^#\/customers\/?$/, viewName: 'customers', params: () => ({}) },
    { pattern: /^#\/customers\/([^/?]+)/, viewName: 'customer-detail', params: (m) => ({ id: m[1] }) },

    // Returns
    { pattern: /^#\/returns\/?$/, viewName: 'returns', params: () => ({}) },
    { pattern: /^#\/returns\/([^/?]+)/, viewName: 'return-detail', params: (m) => ({ id: m[1] }) },

    // Marketing & Content
    { pattern: /^#\/coupons\/?$/, viewName: 'coupons', params: () => ({}) },
    { pattern: /^#\/homepage\/?$/, viewName: 'homepage', params: () => ({}) },
    { pattern: /^#\/home-slider\/?$/, viewName: 'home-slider', params: () => ({}) },
    { pattern: /^#\/about-slider\/?$/, viewName: 'about-slider', params: () => ({}) },
    { pattern: /^#\/instagram-feed\/?$/, viewName: 'about-slider', params: () => ({}) },

    // Settings & Security
    { pattern: /^#\/admin-users\/?$/, viewName: 'admin-users', params: () => ({}) },
    { pattern: /^#\/payments\/?$/, viewName: 'settings', params: () => ({ tab: 'payments' }) },
    { pattern: /^#\/settings\/?$/, viewName: 'settings', params: () => {
      const query = (window.location.hash || '').split('?')[1] || '';
      const sp = new URLSearchParams(query);
      return { tab: sp.get('tab') || 'brand' };
    } },
    { pattern: /^#\/audit-logs\/?$/, viewName: 'audit-logs', params: () => ({}) }
  ];

  async function resolveRoute() {
    // 1. Enforce authentication — unauthenticated users cannot access any admin routes
    if (!window.MB_ADMIN_AUTH || !window.MB_ADMIN_AUTH.isAuthenticated()) {
      window.location.replace('login.html');
      return;
    }

    let hash = window.location.hash || '#/dashboard';
    const cleanHash = hash.split('?')[0];

    let matched = null;
    let params = {};

    for (const r of routes) {
      const match = cleanHash.match(r.pattern);
      if (match) {
        matched = r;
        params = r.params(match);
        break;
      }
    }

    if (!matched) {
      window.location.hash = '#/dashboard';
      return;
    }

    // Map views to required capability permissions
    const VIEW_PERMISSIONS = {
      'dashboard': 'dashboard',
      'products': 'products',
      'product-edit': 'products',
      'categories': 'categories',
      'orders': 'orders',
      'order-detail': 'orders',
      'customers': 'customers',
      'customer-detail': 'customers',
      'returns': 'returns',
      'return-detail': 'returns',
      'coupons': 'coupons',
      'homepage': 'homepage',
      'instagram-feed': 'homepage',
      'admin-users': 'admin_users',
      'settings': 'settings',
      'audit-logs': 'audit_logs'
    };

    const userRole = window.MB_ADMIN_AUTH?.getCurrentUser()?.role || 'SUPER_ADMIN';
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const requiredPerm = VIEW_PERMISSIONS[matched.viewName];

    function getFallbackRoute() {
      if (window.MB_ADMIN_AUTH?.can('dashboard')) return '#/dashboard';
      if (window.MB_ADMIN_AUTH?.can('products')) return '#/products';
      if (window.MB_ADMIN_AUTH?.can('orders')) return '#/orders';
      if (window.MB_ADMIN_AUTH?.can('categories')) return '#/categories';
      if (window.MB_ADMIN_AUTH?.can('customers')) return '#/customers';
      if (window.MB_ADMIN_AUTH?.can('returns')) return '#/returns';
      return '#/dashboard';
    }

    // Admin Users view is strictly reserved for Super Admin
    if (matched.viewName === 'admin-users' && !isSuperAdmin) {
      window.location.hash = getFallbackRoute();
      window.MB_ADMIN_SHELL?.showToast('Access restricted: Only Super Admin can manage administrative users.', 'warning');
      return;
    }

    // Role-based route guard — only allow views granted to this admin
    if (requiredPerm && !window.MB_ADMIN_AUTH?.can(requiredPerm)) {
      window.location.hash = getFallbackRoute();
      window.MB_ADMIN_SHELL?.showToast('Access restricted: You do not have permission for this section.', 'warning');
      return;
    }

    const views = window.MB_ADMIN_VIEWS || {};
    const view = views[matched.viewName];
    const container = document.getElementById('admin-content-mount');

    if (!view || !container) {
      console.warn(`[AdminRouter] View not found for ${matched.viewName}`);
      return;
    }

    // Update document title
    document.title = `${view.title || 'Admin'} | MARSH BARBARY Atelier Admin`;

    // Render Shell chrome
    if (window.MB_ADMIN_SHELL) {
      window.MB_ADMIN_SHELL.renderSidebar(matched.viewName);
      window.MB_ADMIN_SHELL.renderTopbar(view.title);
    }

    // Close mobile drawer on route transition
    document.getElementById('admin-sidebar')?.classList.remove('open');

    // Show smooth view transition
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--mb-admin-muted);">Loading view...</div>`;
    
    try {
      await view.render(container, params);
    } catch (err) {
      console.error(`[AdminRouter] Error rendering ${matched.viewName}:`, err);
      container.innerHTML = `
        <div class="admin-card" style="padding: 40px; text-align: center;">
          <div style="font-family: var(--font-serif); font-size: 20px; color: #9C382A; margin-bottom: 8px;">Error Loading View</div>
          <div style="color: var(--mb-admin-muted); margin-bottom: 16px;">${err.message}</div>
          <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="window.location.hash = '#/dashboard'">Return to Dashboard</button>
        </div>
      `;
    }
  }

  function init() {
    window.addEventListener('hashchange', resolveRoute);
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    } else {
      resolveRoute();
    }
  }

  return {
    init,
    resolveRoute
  };
})();
