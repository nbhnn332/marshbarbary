/**
 * MARSH BARBARY — SUPABASE CLIENT ADAPTER (js/supabase-client.js)
 * Manages Supabase client initialization with graceful fallback.
 * Provides unified API for Auth and Database queries.
 */

window.MB_SUPABASE = (() => {
  let client = null;
  const config = window.MB_SUPABASE_CONFIG;

  // Local storage keys for offline/local development auth simulation
  const DEV_AUTH_KEY = 'mb_dev_customer_session';
  const DEV_USERS_KEY = 'mb_dev_registered_users';

  function getDevUsers() {
    try {
      return JSON.parse(localStorage.getItem(DEV_USERS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveDevUsers(users) {
    try {
      localStorage.setItem(DEV_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving dev users:', e);
    }
  }

  function getDevSession() {
    try {
      const raw = localStorage.getItem(DEV_AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setDevSession(session) {
    try {
      if (session) {
        localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(DEV_AUTH_KEY);
      }
    } catch (e) {
      console.error('Error updating dev session:', e);
    }
  }

  /**
   * Simulated Auth Provider (used during local dev or before live credentials entered)
   * Mimics Supabase Auth API 1:1.
   */
  const simulatedAuth = {
    listeners: new Set(),

    onAuthStateChange(callback) {
      this.listeners.add(callback);
      // Immediately invoke with current state
      const session = getDevSession();
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      return {
        data: {
          subscription: {
            unsubscribe: () => this.listeners.delete(callback)
          }
        }
      };
    },

    _notify(event, session) {
      this.listeners.forEach(fn => {
        try {
          fn(event, session);
        } catch (err) {
          console.error('[SimulatedAuth] listener error:', err);
        }
      });
    },

    async getSession() {
      const session = getDevSession();
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = getDevSession();
      return { data: { user: session?.user || null }, error: null };
    },

    async signUp({ email, password, options = {} }) {
      await new Promise(r => setTimeout(r, 250)); // simulate network latency
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { data: { user: null, session: null }, error: { message: 'Please enter a valid email address.' } };
      }
      if (!password || password.length < 6) {
        return { data: { user: null, session: null }, error: { message: 'Password must be at least 6 characters long.' } };
      }

      const users = getDevUsers();
      if (users.find(u => u.email === cleanEmail)) {
        return { data: { user: null, session: null }, error: { message: 'An account with this email already exists. Please sign in.' } };
      }

      const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
      const meta = options.data || {};
      const newUser = {
        id: userId,
        email: cleanEmail,
        password, // stored locally in dev mode only
        user_metadata: {
          first_name: meta.first_name || '',
          last_name: meta.last_name || '',
          phone: meta.phone || ''
        },
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      saveDevUsers(users);

      const session = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: newUser.user_metadata,
          created_at: newUser.created_at
        }
      };

      setDevSession(session);
      this._notify('SIGNED_IN', session);

      return { data: { user: session.user, session }, error: null };
    },

    async signInWithPassword({ email, password }) {
      await new Promise(r => setTimeout(r, 250));
      const cleanEmail = (email || '').trim().toLowerCase();
      const users = getDevUsers();
      const found = users.find(u => u.email === cleanEmail && u.password === password);

      // Pre-seed demo user if none exists
      if (!found && cleanEmail === 'demo@marshbarbary.com' && password === 'atelier2026') {
        const demoUser = {
          id: 'usr_demo123',
          email: 'demo@marshbarbary.com',
          user_metadata: { first_name: 'Aanya', last_name: 'Sharma', phone: '+91 98765 43210' },
          created_at: new Date().toISOString()
        };
        const session = {
          access_token: 'mock-jwt-token-demo',
          user: demoUser
        };
        setDevSession(session);
        this._notify('SIGNED_IN', session);
        return { data: { user: demoUser, session }, error: null };
      }

      if (!found) {
        return { data: { user: null, session: null }, error: { message: 'Invalid email or password.' } };
      }

      const session = {
        access_token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: found.id,
          email: found.email,
          user_metadata: found.user_metadata,
          created_at: found.created_at
        }
      };

      setDevSession(session);
      this._notify('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },

    async signOut() {
      await new Promise(r => setTimeout(r, 100));
      setDevSession(null);
      this._notify('SIGNED_OUT', null);
      return { error: null };
    },

    async resetPasswordForEmail(email) {
      await new Promise(r => setTimeout(r, 250));
      return { data: {}, error: null };
    }
  };

  /**
   * Initialize or retrieve Supabase client
   */
  function init() {
    if (client) return client;

    const isLive = config.isLiveConfigured();
    if (isLive && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        console.log('[Supabase] Initializing Live Supabase client:', config.url);
        client = window.supabase.createClient(config.url, config.anonKey);
        return client;
      } catch (err) {
        console.warn('[Supabase] Live client initialization failed, falling back to simulated mode:', err);
      }
    }

    console.log('[Supabase] Running in local/simulated client mode (ready for live Supabase keys)');
    client = {
      auth: simulatedAuth,
      from(table) {
        // Transparent query mock for table queries
        return {
          select(fields) {
            return {
              eq(col, val) {
                return {
                  async single() { return { data: null, error: null }; },
                  async order() { return { data: [], error: null }; },
                  then(resolve) { resolve({ data: [], error: null }); }
                };
              },
              then(resolve) { resolve({ data: [], error: null }); }
            };
          }
        };
      }
    };

    return client;
  }

  return {
    getClient: () => init(),
    isLive: () => config.isLiveConfigured()
  };
})();
