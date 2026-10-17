/**
 * MARSH BARBARY — ADMIN AUTHENTICATION & RBAC (js/admin/admin-auth.js)
 * Manages admin session, role-based access control, and quick role switching for testing.
 */

window.MB_ADMIN_AUTH = (() => {
  const SESSION_KEY = 'mb_admin_session';

  // Available mock users for authentication
  const DEFAULT_CREDENTIALS = [
    {
      id: 'adm-1',
      email: 'superadmin@marshbarbary.com',
      password: 'admin123',
      name: 'Elena Rostova',
      role: 'SUPER_ADMIN',
      avatar: 'ER',
      permissions: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'admin_users', 'settings', 'payment_settings', 'audit_logs']
    },
    {
      id: 'adm-2',
      email: 'admin@marshbarbary.com',
      password: 'admin123',
      name: 'Kavya Sen',
      role: 'ADMIN',
      avatar: 'KS',
      permissions: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'settings', 'audit_logs']
    },
    {
      id: 'adm-3',
      email: 'staff@marshbarbary.com',
      password: 'admin123',
      name: 'Rohan Mehta',
      role: 'STAFF',
      avatar: 'RM',
      permissions: ['dashboard', 'orders', 'products', 'returns']
    }
  ];

  function getSession() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.permissions || !parsed.permissions.length) {
          const defaults = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS || {};
          parsed.permissions = defaults[parsed.role] || [];
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[AdminAuth] Error reading session:', e);
    }
    // No valid session stored — user is not authenticated
    return null;
  }

  function setSession(user, remember = true) {
    const defaultPerms = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS?.[user.role] || [];
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: Array.isArray(user.permissions) && user.permissions.length ? user.permissions : defaultPerms,
      avatar: user.avatar || user.name.split(' ').map(n => n[0]).join('').substring(0, 2),
      loggedInAt: new Date().toISOString()
    };
    const serialized = JSON.stringify(sessionData);
    if (remember) {
      localStorage.setItem(SESSION_KEY, serialized);
    } else {
      sessionStorage.setItem(SESSION_KEY, serialized);
    }
    return sessionData;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  async function login(email, password, remember = true) {
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Check against seed admin users in service first, else default credentials
    let user = null;
    if (window.MB_ADMIN_SERVICE) {
      const users = await window.MB_ADMIN_SERVICE.getAdminUsers();
      user = users.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      user = DEFAULT_CREDENTIALS.find(u => u.email.toLowerCase() === cleanEmail);
    }

    const validPassword = user?.password || 'admin123';
    if (!user || password !== validPassword) {
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'inactive' || user.status === 'disabled') {
      throw new Error('This administrative account has been deactivated.');
    }

    const session = setSession(user, remember);
    if (window.MB_ADMIN_SERVICE) {
      window.MB_ADMIN_SERVICE.logAction('LOGIN', 'Auth', user.id, `Admin ${user.name} logged into console`);
    }
    return session;
  }

  function logout() {
    const user = getSession();
    if (window.MB_ADMIN_SERVICE && user) {
      window.MB_ADMIN_SERVICE.logAction('LOGOUT', 'Auth', user.id, `Admin ${user.name} logged out`);
    }
    clearSession();
    window.location.href = 'login.html';
  }

  function getCurrentUser() {
    return getSession();
  }

  function can(permissionKey) {
    if (!permissionKey) return true;
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    const normalizedKey = permissionKey.replace(/-/g, '_');
    const hyphenKey = permissionKey.replace(/_/g, '-');

    // Retrieve fresh user permissions from stored admin users if available
    let permissions = user.permissions;
    try {
      const stored = localStorage.getItem('mb_admin_users');
      if (stored) {
        const users = JSON.parse(stored);
        const match = users.find(u => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
        if (match && Array.isArray(match.permissions)) {
          permissions = match.permissions;
        }
      }
    } catch(e) {}

    // Check custom assigned permissions array given by admin
    if (Array.isArray(permissions)) {
      if (permissions.includes(permissionKey) || permissions.includes(normalizedKey) || permissions.includes(hyphenKey)) {
        return true;
      }
      // If user has specific assigned permissions, enforce only those given
      return false;
    }

    // Check role default capability scope
    const defaults = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS;
    if (defaults && defaults[user.role]) {
      return defaults[user.role].includes(permissionKey) || defaults[user.role].includes(normalizedKey) || defaults[user.role].includes(hyphenKey);
    }

    return false;
  }

  function switchRole(newRole) {
    let matchedUser = null;
    try {
      const stored = localStorage.getItem('mb_admin_users');
      if (stored) {
        const users = JSON.parse(stored);
        matchedUser = users.find(u => u.role === newRole);
      }
    } catch(e) {}

    const defaults = window.MB_ADMIN_MODELS?.DEFAULT_ROLE_PERMISSIONS || {};
    const permissions = matchedUser?.permissions || defaults[newRole] || [];

    const user = {
      role: newRole,
      permissions
    };

    if (newRole === 'SUPER_ADMIN') {
      user.id = matchedUser?.id || 'adm-1';
      user.name = matchedUser?.name || 'Elena Rostova';
      user.email = matchedUser?.email || 'superadmin@marshbarbary.com';
      user.avatar = 'ER';
    } else if (newRole === 'ADMIN') {
      user.id = matchedUser?.id || 'adm-2';
      user.name = matchedUser?.name || 'Kavya Sen';
      user.email = matchedUser?.email || 'admin@marshbarbary.com';
      user.avatar = 'KS';
    } else {
      user.id = matchedUser?.id || 'adm-3';
      user.name = matchedUser?.name || 'Rohan Mehta';
      user.email = matchedUser?.email || 'staff@marshbarbary.com';
      user.avatar = 'RM';
    }

    setSession(user, true);
    if (window.MB_ADMIN_SERVICE) {
      window.MB_ADMIN_SERVICE.logAction('ROLE_SWITCH', 'Auth', user.id, `Simulated role switch to ${newRole}`);
    }
    window.location.reload();
  }

  function isAuthenticated() {
    return Boolean(getSession());
  }

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    can,
    switchRole,
    DEFAULT_CREDENTIALS
  };
})();
