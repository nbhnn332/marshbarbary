/**
 * MARSH BARBARY — CUSTOMER ADDRESSES SERVICE (js/customer-addresses.js)
 * Manages customer saved delivery addresses with full CRUD and default address handling.
 * Provides resilient multi-layer persistence (Supabase PostgreSQL + Local Storage fallbacks).
 */

window.MB_ADDRESSES = (() => {
  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  function getAuthUser() {
    if (window.MB_AUTH && window.MB_AUTH.getUser()) {
      return window.MB_AUTH.getUser();
    }
    // Check dev customer session
    try {
      const devRaw = localStorage.getItem('mb_dev_customer_session');
      if (devRaw) {
        const parsed = JSON.parse(devRaw);
        if (parsed && parsed.user) return parsed.user;
      }
    } catch(e) {}
    // Check Supabase token in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (parsed && parsed.user) return parsed.user;
        }
      }
    } catch(e) {}
    return null;
  }

  /**
   * Unified local address retrieval
   */
  function getLocalAddresses(userId, userEmail) {
    const list = [];
    const seen = new Set();
    const addUnique = (item) => {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    };

    // 1. User-scoped by ID
    if (userId) {
      try {
        const raw = localStorage.getItem(`mb_dev_addresses_${userId}`);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) arr.forEach(addUnique);
        }
      } catch (e) {}
    }

    // 2. User-scoped by Email
    if (userEmail) {
      try {
        const cleanEmail = userEmail.trim().toLowerCase();
        const raw = localStorage.getItem(`mb_dev_addresses_${cleanEmail}`);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) arr.forEach(addUnique);
        }
      } catch (e) {}
    }

    // 3. Global customer address store
    try {
      const raw = localStorage.getItem('mb_customer_addresses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            const matchesUser = !userId || item.user_id === userId || item.auth_user_id === userId;
            const matchesEmail = !userEmail || (item.email && item.email.toLowerCase() === userEmail.toLowerCase());
            if (matchesUser || matchesEmail || !item.user_id) {
              addUnique(item);
            }
          });
        }
      }
    } catch (e) {}

    return list;
  }

  /**
   * Unified local address persistence
   */
  function setLocalAddresses(user, list) {
    if (!Array.isArray(list)) return;
    try {
      const userId = user?.id;
      const userEmail = (user?.email || '').trim().toLowerCase();

      if (userId) {
        localStorage.setItem(`mb_dev_addresses_${userId}`, JSON.stringify(list));
      }
      if (userEmail) {
        localStorage.setItem(`mb_dev_addresses_${userEmail}`, JSON.stringify(list));
      }

      // Also sync to global customer addresses
      let globalList = [];
      try {
        const raw = localStorage.getItem('mb_customer_addresses');
        if (raw) globalList = JSON.parse(raw);
      } catch (e) {}
      if (!Array.isArray(globalList)) globalList = [];

      // Update or prepend items
      list.forEach(newItem => {
        const idx = globalList.findIndex(g => g.id === newItem.id);
        if (idx >= 0) {
          globalList[idx] = newItem;
        } else {
          globalList.unshift(newItem);
        }
      });
      localStorage.setItem('mb_customer_addresses', JSON.stringify(globalList));
    } catch (e) {
      console.warn('[MB_ADDRESSES] Error writing local address cache:', e);
    }
  }

  /**
   * Validate address input fields
   */
  function validateAddress(data) {
    const errors = [];
    if (!data.full_name || !data.full_name.trim()) {
      errors.push('Full name is required.');
    }

    // Phone validation
    if (!data.phone || !data.phone.trim()) {
      errors.push('Contact phone number is required.');
    } else {
      const isValidPhone = window.MB_INDIA && typeof window.MB_INDIA.validatePhone === 'function'
        ? window.MB_INDIA.validatePhone(data.phone)
        : /^(?:\+?91|0)?[6-9]\d{9}$/.test(data.phone.trim().replace(/[\s\-()]/g, ''));
      if (!isValidPhone) {
        errors.push('Please enter a valid 10-digit Indian phone number.');
      }
    }

    if (!data.address_line_1 || !data.address_line_1.trim()) {
      errors.push('Address Line 1 (Flat, House no., Building, Street) is required.');
    }

    if (!data.city || !data.city.trim()) {
      errors.push('City is required.');
    }

    // State validation from predefined official Indian States/UTs list
    const rawState = (data.state || '').trim();
    if (!rawState) {
      errors.push('Please select your State / Union Territory from the dropdown.');
    } else {
      const normalizedState = window.MB_INDIA && typeof window.MB_INDIA.normalizeState === 'function'
        ? window.MB_INDIA.normalizeState(rawState)
        : rawState;
      if (!normalizedState) {
        errors.push('Please select a valid State / Union Territory from the official list.');
      }
    }

    // PIN code validation: numeric, exactly 6 digits
    if (!data.postal_code || !data.postal_code.trim()) {
      errors.push('PIN / Postal Code is required.');
    } else {
      const isValidPin = window.MB_INDIA && typeof window.MB_INDIA.validatePinCode === 'function'
        ? window.MB_INDIA.validatePinCode(data.postal_code)
        : /^[1-9][0-9]{5}$/.test(data.postal_code.trim().replace(/\s/g, ''));
      if (!isValidPin) {
        errors.push('PIN / Postal Code must be exactly 6 digits (e.g. 560038).');
      }
    }

    return errors;
  }

  /**
   * Normalize an address record from Supabase or local store
   */
  function normalizeAddress(raw) {
    if (!raw) return null;
    return {
      id: raw.id,
      auth_user_id: raw.user_id || raw.auth_user_id,
      user_id: raw.user_id || raw.auth_user_id,
      email: raw.email || '',
      full_name: raw.full_name || '',
      phone: raw.phone || '',
      address_line_1: raw.address_line1 || raw.address_line_1 || '',
      address_line_2: raw.address_line2 || raw.address_line_2 || '',
      landmark: raw.landmark || '',
      city: raw.city || '',
      state: raw.state || '',
      postal_code: raw.pin_code || raw.postal_code || '',
      country: raw.country || 'India',
      is_default: Boolean(raw.is_default),
      address_label: raw.address_type || raw.address_label || 'Home',
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString()
    };
  }

  /**
   * Fetch all addresses for current user (Supabase + Local Merge)
   */
  async function getAddresses() {
    const user = getAuthUser();
    const userId = user?.id || 'guest';
    const userEmail = (user?.email || '').trim().toLowerCase();

    let liveAddresses = [];

    const supabase = getClient();
    if (user && user.id && window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          liveAddresses = data.map(normalizeAddress);
        }
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live fetch failed, using local store:', err);
      }
    }

    // Always fetch local addresses
    const localList = getLocalAddresses(userId, userEmail).map(normalizeAddress);

    // Merge: live first, then local entries not already present
    const combinedMap = new Map();

    liveAddresses.forEach(a => {
      if (a && a.id) combinedMap.set(a.id, a);
    });

    localList.forEach(a => {
      if (a && a.id) {
        if (!combinedMap.has(a.id)) {
          combinedMap.set(a.id, a);
        }
      }
    });

    const result = Array.from(combinedMap.values()).sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    // Ensure at least one address is default if list is not empty
    if (result.length > 0 && !result.some(a => a.is_default)) {
      result[0].is_default = true;
    }

    return result;
  }

  /**
   * Fetch a single address by id
   */
  async function getAddressById(id) {
    if (!id) return null;
    const list = await getAddresses();
    return list.find(a => a.id === id) || null;
  }

  /**
   * Add a new delivery address
   */
  async function addAddress(formData) {
    const user = getAuthUser() || { id: 'usr_' + Date.now(), email: '' };

    const errors = validateAddress(formData);
    if (errors.length > 0) throw new Error(errors[0]);

    const currentList = await getAddresses();
    const isFirst = currentList.length === 0;
    const isDefault = isFirst ? true : Boolean(formData.is_default);

    const canonicalState = window.MB_INDIA && typeof window.MB_INDIA.normalizeState === 'function'
      ? (window.MB_INDIA.normalizeState(formData.state) || formData.state.trim())
      : formData.state.trim();

    const record = {
      auth_user_id: user.id,
      user_id: user.id,
      email: user.email || '',
      address_label: formData.address_label || 'Home',
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      address_line_1: formData.address_line_1.trim(),
      address_line_2: (formData.address_line_2 || '').trim(),
      landmark: (formData.landmark || '').trim(),
      city: formData.city.trim(),
      state: canonicalState,
      postal_code: formData.postal_code.trim().replace(/\s/g, ''),
      country: formData.country || 'India',
      is_default: isDefault
    };

    // 1. Immediately persist locally so the user NEVER loses their saved address
    const newId = 'addr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEntry = {
      id: newId,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let localList = getLocalAddresses(user.id, user.email);
    if (isDefault) {
      localList = localList.map(a => ({ ...a, is_default: false }));
    }
    localList.unshift(newEntry);
    setLocalAddresses(user, localList);

    // 2. Synchronize to Supabase if live
    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive() && user.id && !user.id.startsWith('usr_')) {
      try {
        if (isDefault) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
        }

        const liveRecord = {
          user_id: user.id,
          full_name: record.full_name,
          phone: record.phone,
          address_line1: record.address_line_1,
          address_line2: record.address_line_2,
          city: record.city,
          state: record.state,
          pin_code: record.postal_code,
          is_default: isDefault,
          address_type: record.address_label
        };

        const { data, error } = await supabase
          .from('addresses')
          .insert(liveRecord)
          .select()
          .single();

        if (!error && data) {
          const liveNorm = normalizeAddress(data);
          const idx = localList.findIndex(a => a.id === newId);
          if (idx >= 0) {
            localList[idx] = liveNorm;
            setLocalAddresses(user, localList);
          }
          return liveNorm;
        }
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live insert fallback, kept in local store:', err);
      }
    }

    return newEntry;
  }

  /**
   * Update an existing address
   */
  async function updateAddress(id, formData) {
    const user = getAuthUser() || { id: 'usr_' + Date.now(), email: '' };
    if (!id) throw new Error('Missing address identifier.');

    const errors = validateAddress(formData);
    if (errors.length > 0) throw new Error(errors[0]);

    const canonicalState = window.MB_INDIA && typeof window.MB_INDIA.normalizeState === 'function'
      ? (window.MB_INDIA.normalizeState(formData.state) || formData.state.trim())
      : formData.state.trim();

    const updates = {
      address_label: formData.address_label || 'Home',
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      address_line_1: formData.address_line_1.trim(),
      address_line_2: (formData.address_line_2 || '').trim(),
      landmark: (formData.landmark || '').trim(),
      city: formData.city.trim(),
      state: canonicalState,
      postal_code: formData.postal_code.trim().replace(/\s/g, ''),
      country: formData.country || 'India',
      is_default: Boolean(formData.is_default)
    };

    // 1. Immediately update local store
    let localList = getLocalAddresses(user.id, user.email);
    if (updates.is_default) {
      localList = localList.map(a => ({ ...a, is_default: false }));
    }

    let found = false;
    localList = localList.map(item => {
      if (item.id === id) {
        found = true;
        return {
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });

    setLocalAddresses(user, localList);

    // 2. Synchronize to Supabase if live
    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive() && user.id && !user.id.startsWith('usr_')) {
      try {
        if (updates.is_default) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .neq('id', id);
        }

        const liveUpdates = {
          full_name: updates.full_name,
          phone: updates.phone,
          address_line1: updates.address_line_1,
          address_line2: updates.address_line_2,
          city: updates.city,
          state: updates.state,
          pin_code: updates.postal_code,
          is_default: updates.is_default,
          address_type: updates.address_label,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('addresses')
          .update(liveUpdates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error && data) {
          return normalizeAddress(data);
        }
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live update fallback, kept in local store:', err);
      }
    }

    return localList.find(a => a.id === id) || { id, ...updates };
  }

  /**
   * Delete an address
   */
  async function deleteAddress(id) {
    const user = getAuthUser() || { id: 'usr_' + Date.now(), email: '' };
    if (!id) throw new Error('Missing address identifier.');

    // 1. Immediately remove from local store
    let list = getLocalAddresses(user.id, user.email);
    const target = list.find(a => a.id === id);
    list = list.filter(a => a.id !== id);

    if (target && target.is_default && list.length > 0) {
      list[0].is_default = true;
    }
    setLocalAddresses(user, list);

    // 2. Delete from Supabase if live
    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive() && user.id && !user.id.startsWith('usr_')) {
      try {
        await supabase
          .from('addresses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live delete warning:', err);
      }
    }

    return true;
  }

  /**
   * Set address as primary default
   */
  async function setDefaultAddress(id) {
    const user = getAuthUser() || { id: 'usr_' + Date.now(), email: '' };
    if (!id) throw new Error('Missing address identifier.');

    // 1. Update locally
    let list = getLocalAddresses(user.id, user.email);
    list = list.map(item => ({
      ...item,
      is_default: item.id === id
    }));
    setLocalAddresses(user, list);

    // 2. Synchronize to Supabase if live
    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive() && user.id && !user.id.startsWith('usr_')) {
      try {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);

        const { data, error } = await supabase
          .from('addresses')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error && data) return normalizeAddress(data);
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live setDefault warning:', err);
      }
    }

    return list.find(a => a.id === id);
  }

  return {
    getAddresses,
    getAddressById,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    validateAddress
  };
})();
