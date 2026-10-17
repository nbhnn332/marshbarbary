/**
 * MARSH BARBARY — INDIAN GEOGRAPHIC CONSTANTS & VALIDATION (js/india-states.js)
 * Authoritative list of 28 States and 8 Union Territories of India.
 * Reusable dropdown populator and Indian PIN/Phone format validators.
 */

window.MB_INDIA = (() => {
  // Official standardized list of 28 States and 8 Union Territories (Alphabetical)
  const STATES = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
  ];

  /**
   * Populate a <select> element with the standardized States/UTs
   * @param {HTMLSelectElement|string} selectOrId - DOM element or element ID
   * @param {string} selectedValue - Value to preselect if available
   */
  function populateStateSelect(selectOrId, selectedValue = '') {
    const el = typeof selectOrId === 'string' ? document.getElementById(selectOrId) : selectOrId;
    if (!el) return;

    el.innerHTML = '';

    // Default prompt option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select State / Union Territory';
    defaultOption.disabled = true;
    defaultOption.selected = !selectedValue;
    el.appendChild(defaultOption);

    // Standardized States & UTs
    STATES.forEach(stateName => {
      const opt = document.createElement('option');
      opt.value = stateName;
      opt.textContent = stateName;
      if (selectedValue && selectedValue.trim().toLowerCase() === stateName.toLowerCase()) {
        opt.selected = true;
        defaultOption.selected = false;
      }
      el.appendChild(opt);
    });
  }

  /**
   * Check whether a given state string matches an official State/UT
   * Returns the canonical standardized state name or null
   */
  function normalizeState(stateStr) {
    if (!stateStr) return null;
    const clean = stateStr.trim().toLowerCase();
    const match = STATES.find(s => s.toLowerCase() === clean);
    return match || null;
  }

  /**
   * Validate Indian Postal PIN Code (6 digits, non-zero first digit)
   */
  function validatePinCode(pin) {
    if (!pin) return false;
    const clean = String(pin).trim().replace(/\s/g, '');
    return /^[1-9][0-9]{5}$/.test(clean);
  }

  /**
   * Validate Indian Phone Number (10 digits starting with 6, 7, 8, 9; optional +91 prefix)
   */
  function validatePhone(phone) {
    if (!phone) return false;
    const clean = String(phone).trim().replace(/[\s\-()]/g, '');
    // Supports 10 digits starting with 6-9, or with +91 / 91 / 0 prefix
    return /^(?:\+?91|0)?[6-9]\d{9}$/.test(clean);
  }

  return {
    STATES,
    populateStateSelect,
    normalizeState,
    isValidState: (s) => Boolean(normalizeState(s)),
    validatePinCode,
    validatePhone
  };
})();
