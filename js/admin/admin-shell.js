/**
 * MARSH BARBARY — ADMIN SHELL (js/admin/admin-shell.js)
 * Persistent layout wrapper: Sidebar, Topbar, Mobile Drawer, Toast alerts, and Confirmation Modals.
 */

window.MB_ADMIN_SHELL = (() => {
  // Navigation items grouped by section with permission keys
  const NAV_SECTIONS = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', permission: 'dashboard', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>' }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { id: 'products', permission: 'products', label: 'Products', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' },
        { id: 'categories', permission: 'categories', label: 'Categories', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' }
      ]
    },
    {
      title: 'SALES',
      items: [
        { id: 'orders', permission: 'orders', label: 'Orders', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
        { id: 'customers', permission: 'customers', label: 'Customers', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { id: 'returns', permission: 'returns', label: 'Returns', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' },
        { id: 'coupons', permission: 'coupons', label: 'Coupons', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>' }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { id: 'homepage', permission: 'homepage', label: 'Homepage', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
        { id: 'home-slider', permission: 'homepage', label: 'Home Slider', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' },
        { id: 'about-slider', permission: 'homepage', label: 'About Slider', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'admin-users', permission: 'admin_users', superAdminOnly: true, label: 'Admin Users', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>' },
        { id: 'settings', permission: 'settings', label: 'Settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
        { id: 'audit-logs', permission: 'audit_logs', label: 'Audit Logs', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' }
      ]
    }
  ];

  function renderSidebar(currentRoute) {
    const user = window.MB_ADMIN_AUTH?.getCurrentUser() || { name: 'Admin', role: 'SUPER_ADMIN' };
    const userRole = user.role || 'SUPER_ADMIN';
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    let html = `
      <div class="admin-sidebar-header">
        <a href="#/dashboard" class="admin-brand-link" aria-label="Marsh Barbary Operations Portal">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 40'%3E%3Ctext x='50%25' y='28' text-anchor='middle' font-family='Cinzel, serif' font-size='22' font-weight='600' letter-spacing='0.22em' fill='%2326201D'%3EMARSH BARBARY%3C/text%3E%3C/svg%3E" alt="MARSH BARBARY" class="admin-brand-logo">
          <span class="admin-brand-tag">PORTAL</span>
        </a>
      </div>
      <nav class="admin-nav" role="navigation">
    `;

    NAV_SECTIONS.forEach(sec => {
      // Filter items according to permissions given by admin
      const allowedItems = sec.items.filter(item => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        return window.MB_ADMIN_AUTH ? window.MB_ADMIN_AUTH.can(item.permission) : true;
      });

      if (allowedItems.length > 0) {
        html += `<div class="admin-nav-section-title">${sec.title}</div>`;
        allowedItems.forEach(item => {
          const isActive = currentRoute === item.id || 
            (item.id === 'orders' && currentRoute.startsWith('orders')) || 
            (item.id === 'products' && currentRoute.startsWith('products')) || 
            (item.id === 'customers' && currentRoute.startsWith('customers')) || 
            (item.id === 'returns' && currentRoute.startsWith('returns'));
          html += `
            <a href="#/${item.id}" class="admin-nav-item ${isActive ? 'active' : ''}" data-nav="${item.id}">
              <span class="admin-nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `;
        });
      }
    });

    html += `
      </nav>
      <div style="padding: 16px; border-top: 1px solid var(--mb-admin-border); margin-top: auto;">
        ${isSuperAdmin ? `
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 8px;">
            Active Role (Simulate)
          </div>
          <select id="role-switcher-select" class="admin-select" style="font-size: 11px; padding: 6px 8px; margin-bottom: 12px; width: 100%;">
            <option value="SUPER_ADMIN" ${userRole === 'SUPER_ADMIN' ? 'selected' : ''}>Super Admin (Full)</option>
            <option value="ADMIN" ${userRole === 'ADMIN' ? 'selected' : ''}>Store Admin</option>
            <option value="STAFF" ${userRole === 'STAFF' ? 'selected' : ''}>Staff (Restricted)</option>
          </select>
        ` : `
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mb-admin-muted); margin-bottom: 4px;">
            Assigned Role
          </div>
          <div style="font-size: 12px; font-weight: 600; color: var(--mb-admin-text); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <span class="admin-badge ${userRole === 'ADMIN' ? 'admin-badge-info' : 'admin-badge-neutral'}">
              ${userRole === 'ADMIN' ? 'STORE ADMIN' : (userRole === 'STAFF' ? 'STAFF' : userRole)}
            </span>
            <span style="font-size: 10px; color: var(--mb-admin-muted); font-weight: normal;">(Admin Assigned)</span>
          </div>
        `}

        <a href="../index.html" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: var(--mb-admin-muted); text-decoration: none; padding: 6px 0; border: 1px solid var(--mb-admin-border); border-radius: var(--mb-radius-sm); margin-bottom: 8px; transition: all 0.2s;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View Storefront
        </a>

        <button id="admin-logout-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: #9C382A; background: transparent; border: none; cursor: pointer; padding: 6px 0;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    `;

    const sidebarEl = document.getElementById('admin-sidebar');
    if (sidebarEl) {
      sidebarEl.innerHTML = html;

      // Event listeners
      document.getElementById('role-switcher-select')?.addEventListener('change', (e) => {
        window.MB_ADMIN_AUTH?.switchRole(e.target.value);
      });
      document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
        window.MB_ADMIN_AUTH?.logout();
      });
    }
  }

  function renderTopbar(title = 'Dashboard') {
    const user = window.MB_ADMIN_AUTH?.getCurrentUser() || { name: 'Elena Rostova', role: 'SUPER_ADMIN', avatar: 'ER' };

    let html = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <button id="mobile-sidebar-toggle" class="admin-btn admin-btn-outline admin-btn-sm" style="display: none; padding: 6px 10px;" aria-label="Toggle navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div style="font-family: var(--font-serif); font-size: 20px; font-weight: 500; letter-spacing: 0.05em; color: var(--mb-admin-text);">
          ${title}
        </div>
      </div>

      <div class="admin-topbar-actions">
        <!-- Global Search input -->
        <div class="admin-search-wrapper" style="width: 260px;">
          <span class="admin-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="search" id="omni-search" class="admin-input admin-input-search" placeholder="Search orders, products, clients..." aria-label="Omni search">
        </div>

        <!-- Quick Notifications -->
        <div style="position: relative;">
          <button id="topbar-notif-btn" class="admin-btn admin-btn-outline" style="border-radius: 50%; width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; position: relative;" title="System notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style="position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; background: var(--mb-admin-accent); border-radius: 50%;"></span>
          </button>
          
          <div id="topbar-notif-dropdown" class="admin-card" style="display: none; position: absolute; right: 0; top: 46px; width: 320px; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 12px 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
              <span style="font-weight: 500; font-size: 13px;">Recent System Events</span>
              <a href="#/audit-logs" style="font-size: 11px; color: var(--mb-admin-accent); text-decoration: none;">View All</a>
            </div>
            <div id="topbar-notif-list" style="font-size: 11px; color: var(--mb-admin-text-sub);">
              Loading logs...
            </div>
          </div>
        </div>

        <!-- User profile pill -->
        <div class="admin-user-pill">
          <div class="admin-user-avatar">${user.avatar || 'MB'}</div>
          <div class="admin-user-info" style="line-height: 1.2;">
            <div style="font-weight: 500; font-size: 12px;">${user.name}</div>
            <div style="font-size: 10px; color: var(--mb-admin-muted); text-transform: uppercase; letter-spacing: 0.05em;">${user.role}</div>
          </div>
        </div>
      </div>
    `;

    const topbarEl = document.getElementById('admin-topbar');
    if (topbarEl) {
      topbarEl.innerHTML = html;

      // Toggle mobile drawer
      document.getElementById('mobile-sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar')?.classList.toggle('open');
      });

      // Notification dropdown toggle
      const notifBtn = document.getElementById('topbar-notif-btn');
      const notifDrop = document.getElementById('topbar-notif-dropdown');
      notifBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isOpen = notifDrop.style.display === 'block';
        notifDrop.style.display = isOpen ? 'none' : 'block';
        if (!isOpen && window.MB_ADMIN_SERVICE) {
          const logs = await window.MB_ADMIN_SERVICE.getAuditLogs();
          const listEl = document.getElementById('topbar-notif-list');
          if (listEl) {
            listEl.innerHTML = logs.slice(0, 4).map(l => `
              <div style="padding: 6px 0; border-bottom: 1px solid var(--mb-admin-border);">
                <div style="font-weight: 500; color: var(--mb-admin-text);">${l.action}</div>
                <div style="color: var(--mb-admin-muted);">${l.details || l.entity}</div>
                <div style="font-size: 9px; color: var(--mb-admin-muted); margin-top: 2px;">${l.timestamp}</div>
              </div>
            `).join('');
          }
        }
      });

      document.addEventListener('click', () => {
        if (notifDrop) notifDrop.style.display = 'none';
      });

      // Omni search handler
      document.getElementById('omni-search')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = e.target.value.trim();
          if (q) {
            window.location.hash = `#/orders?q=${encodeURIComponent(q)}`;
          }
        }
      });
    }
  }

  // Toast System
  function showToast(message, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'admin-toast-container';
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    
    let icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    if (type === 'error') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    }

    toast.innerHTML = `
      <span>${icon}</span>
      <span style="flex:1;">${message}</span>
      <button style="background:transparent; border:none; cursor:pointer; color:currentColor; font-size:16px;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Confirmation Modal
  function confirmModal({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmType = 'danger', onConfirm = () => {} }) {
    const modalId = 'admin-confirm-modal';
    let existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = modalId;
    backdrop.className = 'admin-modal-backdrop active';
    
    backdrop.innerHTML = `
      <div class="admin-modal" style="max-width: 440px;">
        <div class="admin-modal-header">
          <div class="admin-modal-title">${title}</div>
          <button class="admin-modal-close" id="confirm-modal-close">&times;</button>
        </div>
        <div class="admin-modal-body" style="font-size: 13px; line-height: 1.6; color: var(--mb-admin-text-sub);">
          ${message}
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="admin-btn admin-btn-outline" id="confirm-modal-cancel">Cancel</button>
          <button type="button" class="admin-btn ${confirmType === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'}" id="confirm-modal-ok">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('#confirm-modal-close').addEventListener('click', close);
    backdrop.querySelector('#confirm-modal-cancel').addEventListener('click', close);
    backdrop.querySelector('#confirm-modal-ok').addEventListener('click', () => {
      close();
      onConfirm();
    });
  }

  return {
    renderSidebar,
    renderTopbar,
    showToast,
    confirmModal
  };
})();
