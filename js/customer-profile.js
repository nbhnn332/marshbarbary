/**
 * MARSH BARBARY — CUSTOMER PROFILE SERVICE (js/customer-profile.js)
 * Manages customer profile retrieval, edits, and persistence via Supabase.
 */

window.MB_PROFILE = (() => {
  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  /**
   * Fetch customer profile for authenticated user
   */
  async function getProfile() {
    const user = window.MB_AUTH ? window.MB_AUTH.getUser() : null;
    if (!user) return null;

    const supabase = getClient();
    if (!supabase) return null;

    // Check if live Supabase
    if (window.MB_SUPABASE.isLive()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          const names = (data.full_name || '').split(' ');
          return {
            id: data.id,
            auth_user_id: data.id,
            email: user.email,
            first_name: data.first_name || names[0] || '',
            last_name: data.last_name || names.slice(1).join(' ') || '',
            phone: data.phone || '',
            avatar_url: data.avatar_url || '',
            created_at: data.created_at || user.created_at
          };
        }
      } catch (err) {
        console.warn('[MB_PROFILE] Error querying live profile, falling back to user metadata:', err);
      }
    }

    // Fallback / simulated profile based on user session & metadata
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      auth_user_id: user.id,
      email: user.email,
      first_name: meta.first_name || '',
      last_name: meta.last_name || '',
      phone: meta.phone || '',
      created_at: user.created_at || new Date().toISOString()
    };
  }

  /**
   * Update customer profile
   */
  async function updateProfile({ firstName, lastName, phone }) {
    const user = window.MB_AUTH ? window.MB_AUTH.getUser() : null;
    if (!user) throw new Error('You must be signed in to update your profile.');

    const cleanFirst = (firstName || '').trim();
    const cleanLast = (lastName || '').trim();
    const cleanPhone = (phone || '').trim();

    if (!cleanFirst) throw new Error('First name cannot be empty.');

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: `${cleanFirst} ${cleanLast}`.trim(),
            phone: cleanPhone,
            updated_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (error) console.warn('[MB_PROFILE] Live upsert warning:', error);
      } catch (err) {
        console.error('[MB_PROFILE] Live update error:', err);
      }
    }

    // Always update local session user_metadata
    user.user_metadata = user.user_metadata || {};
    user.user_metadata.first_name = cleanFirst;
    user.user_metadata.last_name = cleanLast;
    user.user_metadata.phone = cleanPhone;

    // Persist in dev storage
    try {
      const devSessionRaw = localStorage.getItem('mb_dev_customer_session');
      if (devSessionRaw) {
        const session = JSON.parse(devSessionRaw);
        session.user.user_metadata = user.user_metadata;
        localStorage.setItem('mb_dev_customer_session', JSON.stringify(session));
      }
      const usersRaw = localStorage.getItem('mb_dev_registered_users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
        if (idx !== -1) {
          users[idx].user_metadata = user.user_metadata;
          localStorage.setItem('mb_dev_registered_users', JSON.stringify(users));
        }
      }
    } catch (e) {
      console.warn('[MB_PROFILE] Error syncing dev session metadata:', e);
    }

    return {
      id: user.id,
      auth_user_id: user.id,
      email: user.email,
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: cleanPhone
    };
  }

  return {
    getProfile,
    updateProfile
  };
})();
