/**
 * MARSH BARBARY — CUSTOMER ADDRESSES SERVICE (js/customer-addresses.js)
 * Manages customer saved delivery addresses with full CRUD and default address handling.
 * Works seamlessly in live Supabase mode and dev fallback mode.
 */

window.MB_ADDRESSES = (() => {
  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  function getAuthUser() {
    return window.MB_AUTH ? window.MB_AUTH.getUser() : null;
  }

  // Local storage helpers for dev mode
  function getDevStorageKey(userId) {
    return `mb_dev_addresses_${userId}`;
  }

  function getLocalAddresses(userId) {
    try {
      const raw = localStorage.getItem(getDevStorageKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setLocalAddresses(userId, list) {
    try {
      localStorage.setItem(getDevStorageKey(userId), JSON.stringify(list));
    } catch (e) {}
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
   * Fetch all addresses for current user
  function normalizeAddress(raw) {
    if (!raw) return null;
    return {
      id: raw.id,
      auth_user_id: raw.user_id || raw.auth_user_id,
      user_id: raw.user_id || raw.auth_user_id,
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
      created_at: raw.created_at,
      updated_at: raw.updated_at
    };
  }

  /**
   * Fetch all addresses for current user
   */
  async function getAddresses() {
    const user = getAuthUser();
    if (!user) return [];

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(normalizeAddress);
        }
      } catch (err) {
        console.warn('[MB_ADDRESSES] Live fetch failed, using local store:', err);
      }
    }

    const localList = getLocalAddresses(user.id);
    return localList.map(normalizeAddress).sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }

  /**
   * Fetch a single address by id
   */
  async function getAddressById(id) {
    const user = getAuthUser();
    if (!user || !id) return null;

    const list = await getAddresses();
    return list.find(a => a.id === id) || null;
  }

  /**
   * Add a new delivery address
   */
  async function addAddress(formData) {
    const user = getAuthUser();
    if (!user) throw new Error('You must be signed in to add an address.');

    const errors = validateAddress(formData);
    if (errors.length > 0) throw new Error(errors[0]);

    const currentList = await getAddresses();
    // First address is automatically default
    const isFirst = currentList.length === 0;
    const isDefault = isFirst ? true : Boolean(formData.is_default);

    // Standardize State name
    const canonicalState = window.MB_INDIA && typeof window.MB_INDIA.normalizeState === 'function'
      ? (window.MB_INDIA.normalizeState(formData.state) || formData.state.trim())
      : formData.state.trim();

    const record = {
      auth_user_id: user.id,
      address_label: formData.address_label || 'Home',
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      address_line_1: formData.address_line_1.trim(),
      address_line_2: (formData.address_line_2 || '').trim(),
      landmark: (formData.landmark || '').trim(),
      city: formData.city.trim(),
      state: canonicalState,
      postal_code: formData.postal_code.trim().replace(/\s/g, ''),
      country: 'India',
      is_default: isDefault
    };

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        if (isDefault) {
          // Unset other defaults
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

        if (error) throw error;
        return normalizeAddress(data);
      } catch (err) {
        console.error('[MB_ADDRESSES] Live insert failed:', err);
        throw err;
      }
    }

    // Local / Dev Fallback
    const newId = 'addr_' + Math.random().toString(36).substring(2, 10);
    const newEntry = {
      id: newId,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedList = getLocalAddresses(user.id);
    if (isDefault) {
      updatedList = updatedList.map(a => ({ ...a, is_default: false }));
    }
    updatedList.unshift(newEntry);
    setLocalAddresses(user.id, updatedList);

    return newEntry;
  }

  /**
   * Update an existing address
   */
  async function updateAddress(id, formData) {
    const user = getAuthUser();
    if (!user) throw new Error('You must be signed in to edit an address.');
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
      country: 'India',
      is_default: Boolean(formData.is_default)
    };

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
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

        if (error) throw error;
        return normalizeAddress(data);
      } catch (err) {
        console.error('[MB_ADDRESSES] Live update error:', err);
        throw err;
      }
    }

    // Local / Dev Fallback
    let updatedList = getLocalAddresses(user.id);
    if (updates.is_default) {
      updatedList = updatedList.map(a => ({ ...a, is_default: false }));
    }

    let found = false;
    updatedList = updatedList.map(item => {
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

    if (!found) throw new Error('Address not found.');
    setLocalAddresses(user.id, updatedList);
    return updatedList.find(a => a.id === id);
  }

  /**
   * Delete an address
   */
  async function deleteAddress(id) {
    const user = getAuthUser();
    if (!user) throw new Error('You must be signed in to delete an address.');
    if (!id) throw new Error('Missing address identifier.');

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const { error } = await supabase
          .from('addresses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Check if there are remaining addresses without default
        const remaining = await getAddresses();
        if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
          await setDefaultAddress(remaining[0].id);
        }
        return true;
      } catch (err) {
        console.error('[MB_ADDRESSES] Live delete error:', err);
        throw err;
      }
    }

    // Local / Dev Fallback
    let list = getLocalAddresses(user.id);
    const target = list.find(a => a.id === id);
    list = list.filter(a => a.id !== id);

    // If target was default and remaining exist, promote first
    if (target && target.is_default && list.length > 0) {
      list[0].is_default = true;
    }

    setLocalAddresses(user.id, list);
    return true;
  }

  /**
   * Set address as primary default
   */
  async function setDefaultAddress(id) {
    const user = getAuthUser();
    if (!user) throw new Error('You must be signed in to set default address.');
    if (!id) throw new Error('Missing address identifier.');

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
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

        if (error) throw error;
        return normalizeAddress(data);
      } catch (err) {
        console.error('[MB_ADDRESSES] Live setDefault error:', err);
        throw err;
      }
    }

    // Local / Dev Fallback
    let list = getLocalAddresses(user.id);
    list = list.map(item => ({
      ...item,
      is_default: item.id === id
    }));
    setLocalAddresses(user.id, list);
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
