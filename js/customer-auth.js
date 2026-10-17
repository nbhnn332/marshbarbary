/**
 * MARSH BARBARY — CUSTOMER AUTHENTICATION CONTROLLER (js/customer-auth.js)
 * Manages Supabase Auth, customer session state, header indicators,
 * and redirect gating.
 */

window.MB_AUTH = (() => {
  let currentUser = null;
  let currentSession = null;
  const subscribers = new Set();
  let initialized = false;

  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  /**
   * Subscribe to auth changes
   */
  function subscribe(fn) {
    if (typeof fn === 'function') {
      subscribers.add(fn);
      // Immediately notify with current state
      fn({ user: currentUser, session: currentSession, isAuthenticated: !!currentUser });
    }
    return () => subscribers.delete(fn);
  }

  function notifySubscribers() {
    const payload = {
      user: currentUser,
      session: currentSession,
      isAuthenticated: !!currentUser
    };
    subscribers.forEach(fn => {
      try { fn(payload); } catch (e) { console.error('[MB_AUTH] subscriber error:', e); }
    });
    window.dispatchEvent(new CustomEvent('mb:auth-changed', { detail: payload }));
  }

  /**
   * Synchronize DOM header and navigation buttons
   */
  function syncDom() {
    const isAuthed = !!currentUser;
    const accountButtons = document.querySelectorAll('button[aria-label="Customer Account"], a[aria-label="Customer Account"], .header-account-btn, .mobile-action-item[data-action="account"]');

    accountButtons.forEach(btn => {
      if (isAuthed) {
        btn.setAttribute('title', `Account: ${currentUser.email}`);
        btn.classList.add('is-authenticated');
        // Add subtle indicator dot if not present
        if (!btn.querySelector('.auth-status-dot')) {
          const dot = document.createElement('span');
          dot.className = 'auth-status-dot';
          btn.style.position = 'relative';
          btn.appendChild(dot);
        }
      } else {
        btn.removeAttribute('title');
        btn.classList.remove('is-authenticated');
        const dot = btn.querySelector('.auth-status-dot');
        if (dot) dot.remove();
      }
    });
  }

  /**
   * Attach global click handler for Account buttons
   */
  function setupAccountClickHandlers() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button[aria-label="Customer Account"], a[aria-label="Customer Account"], .header-account-btn, .mobile-action-item[data-action="account"]');
      if (!target) return;

      e.preventDefault();
      if (currentUser) {
        window.location.href = 'account/index.html';
      } else {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const returnUrl = currentPath === 'login.html' ? 'index.html' : currentPath;
        window.location.href = `login.html?redirect=${encodeURIComponent(returnUrl)}`;
      }
    });
  }

  /**
   * Initialize Authentication
   */
  async function init() {
    if (initialized) return;
    initialized = true;

    const supabase = getClient();
    if (!supabase) {
      console.warn('[MB_AUTH] Supabase client unavailable');
      return;
    }

    // Check existing session
    try {
      const { data } = await supabase.auth.getSession();
      currentSession = data?.session || null;
      currentUser = currentSession?.user || null;
    } catch (err) {
      console.warn('[MB_AUTH] Error restoring session:', err);
    }

    // Listen to reactive auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      currentSession = session || null;
      currentUser = session?.user || null;
      syncDom();
      notifySubscribers();
    });

    syncDom();
    setupAccountClickHandlers();
  }

  /**
   * Customer Sign Up
   */
  async function signUp({ email, password, firstName, lastName, phone }) {
    const supabase = getClient();
    if (!supabase) throw new Error('Authentication service unavailable.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || ''
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Customer Sign In
   */
  async function signIn({ email, password }) {
    const supabase = getClient();
    if (!supabase) throw new Error('Authentication service unavailable.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  /**
   * Customer Sign Out
   */
  async function signOut() {
    const supabase = getClient();
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Password Reset Request
   */
  async function resetPassword(email) {
    const supabase = getClient();
    if (!supabase) throw new Error('Authentication service unavailable.');

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }

  /**
   * Guard a page or route: redirects to login if unauthenticated
   */
  function requireAuth(redirectUrl = null) {
    if (!currentUser) {
      const target = redirectUrl || window.location.href;
      window.location.href = `login.html?redirect=${encodeURIComponent(target)}`;
      return false;
    }
    return true;
  }

  return {
    init,
    subscribe,
    signUp,
    signIn,
    signOut,
    resetPassword,
    requireAuth,
    getUser: () => currentUser,
    getSession: () => currentSession,
    isAuthenticated: () => !!currentUser
  };
})();

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.MB_AUTH.init());
} else {
  window.MB_AUTH.init();
}
