/**
 * MARSH BARBARY - CUSTOMER SHOP PAGE CONTROLLER (PHASE 2)
 * Handles client-side catalog filtering, category navigation, sorting, 
 * slide-over drawer state, active filter tags, and editorial empty state.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    selectedCategory: 'all', // 'all' or specific slug ('dresses', 'tops', etc.)
    selectedSizes: new Set(), // Set of strings: 'XS', 'S', etc.
    selectedPriceRange: 'all', // 'all', 'under-2500', '2500-3500', 'above-3500'
    inStockOnly: true,
    sortBy: 'featured',
    allProducts: []
  };

  // DOM Elements Cache
  let elements = {};

  function initDOMElements() {
    elements = {
      grid: document.getElementById('shop-products-grid'),
      emptyState: document.getElementById('shop-empty-state'),
      emptyStateResetBtn: document.getElementById('empty-state-reset-btn'),
      countText: document.getElementById('product-count-text'),
      drawerCountText: document.getElementById('drawer-product-count'),
      filterBadge: document.getElementById('filter-count-badge'),
      activeChips: document.getElementById('active-filter-chips'),
      categoryNav: document.getElementById('shop-category-nav'),
      categoryButtons: document.querySelectorAll('.shop-cat-btn'),
      sortSelect: document.getElementById('shop-sort-select'),
      // Drawer elements
      filterDrawer: document.getElementById('filter-drawer'),
      filterOverlay: document.getElementById('filter-overlay'),
      openFilterBtn: document.getElementById('open-filter-btn'),
      closeFilterBtn: document.getElementById('close-filter-btn'),
      clearAllBtn: document.getElementById('filter-clear-all-btn'),
      drawerResetBtn: document.getElementById('drawer-reset-btn'),
      drawerApplyBtn: document.getElementById('drawer-apply-btn'),
      categoryCheckboxes: document.querySelectorAll('input[name="filter-cat"]'),
      sizeButtons: document.querySelectorAll('.size-pill-btn'),
      priceRadios: document.querySelectorAll('input[name="filter-price"]'),
      inStockCheckbox: document.getElementById('filter-in-stock'),
      // Pagination / Progress
      paginationStatusText: document.getElementById('pagination-status-text'),
      paginationProgressFill: document.getElementById('pagination-progress-fill'),
      paginationWrap: document.getElementById('shop-pagination-wrap')
    };
  }

  /**
   * Filter and Sort Logic
   */
  function getFilteredProducts() {
    let list = [...state.allProducts];

    // 1. Category Filter
    if (state.selectedCategory !== 'all') {
      list = list.filter(p => p.category === state.selectedCategory);
    }

    // 2. Size Filter
    if (state.selectedSizes.size > 0) {
      list = list.filter(p => {
        if (!p.sizes || !Array.isArray(p.sizes)) return false;
        return Array.from(state.selectedSizes).some(s => p.sizes.includes(s));
      });
    }

    // 3. Price Filter
    if (state.selectedPriceRange === 'under-2500') {
      list = list.filter(p => p.price < 2500);
    } else if (state.selectedPriceRange === '2500-3500') {
      list = list.filter(p => p.price >= 2500 && p.price <= 3500);
    } else if (state.selectedPriceRange === 'above-3500') {
      list = list.filter(p => p.price > 3500);
    }

    // 4. In Stock Filter
    if (state.inStockOnly) {
      list = list.filter(p => p.inStock !== false);
    }

    // 5. Sorting
    switch (state.sortBy) {
      case 'newest':
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.price - a.price);
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'featured':
      default:
        // Original order
        break;
    }

    return list;
  }

  /**
   * Render Catalog UI
   */
  function renderCatalog() {
    if (!elements.grid) return;

    const filtered = getFilteredProducts();
    const totalCount = state.allProducts.length;
    const currentCount = filtered.length;

    // Update Counts
    const countDisplay = `${currentCount} ${currentCount === 1 ? 'piece' : 'pieces'}`;
    if (elements.countText) elements.countText.textContent = countDisplay;
    if (elements.drawerCountText) elements.drawerCountText.textContent = `(${countDisplay})`;

    // Empty state vs Grid
    if (currentCount === 0) {
      elements.grid.innerHTML = '';
      elements.grid.style.display = 'none';
      if (elements.emptyState) elements.emptyState.style.display = 'block';
      if (elements.paginationWrap) elements.paginationWrap.style.display = 'none';
    } else {
      if (elements.emptyState) elements.emptyState.style.display = 'none';
      elements.grid.style.display = 'grid';
      elements.grid.innerHTML = filtered
        .map(p => window.MB_COMPONENTS.renderProductCard(p))
        .join('');
      
      // Update pagination progress
      if (elements.paginationWrap) {
        elements.paginationWrap.style.display = 'block';
        if (elements.paginationStatusText) {
          elements.paginationStatusText.textContent = `Showing ${currentCount} of ${totalCount} pieces`;
        }
        if (elements.paginationProgressFill) {
          const pct = Math.min(100, Math.round((currentCount / totalCount) * 100));
          elements.paginationProgressFill.style.width = `${pct}%`;
        }
      }

      // Attach wishlist toggles
      attachWishlistListeners();
    }

    // Update active filter badge and chips
    updateActiveFilterBadgesAndChips();
    // Synchronize Category Nav Buttons
    updateCategoryNavButtons();
    // Synchronize Drawer Checkboxes
    syncDrawerInputs();
  }

  /**
   * Attach wishlist toggle buttons
   */
  function attachWishlistListeners() {
    const wishlistBtns = elements.grid.querySelectorAll('.product-wishlist-btn');
    wishlistBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const svg = btn.querySelector('svg');
        const isActive = btn.classList.toggle('active');
        if (isActive) {
          btn.style.backgroundColor = '#B47154';
          if (svg) {
            svg.style.stroke = '#FFFFFF';
            svg.style.fill = '#FFFFFF';
          }
          if (window.MB_CART?.showToast) {
            window.MB_CART.showToast('Item saved to your wishlist');
          }
        } else {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.92)';
          if (svg) {
            svg.style.stroke = 'var(--color-text-primary)';
            svg.style.fill = 'none';
          }
        }
      });
    });
  }

  /**
   * Synchronize Category Nav Buttons
   */
  function updateCategoryNavButtons() {
    elements.categoryButtons.forEach(btn => {
      const cat = btn.getAttribute('data-category');
      if (cat === state.selectedCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Dynamically render category buttons and drawer options from live database
   */
  function renderCategoryNavigation() {
    const nav = elements.categoryNav || document.getElementById('shop-category-nav');
    const cats = window.MB_DATA?.categories || [];
    const activeCats = cats.filter(c => c.status !== 'hidden');
    const totalCount = state.allProducts.length;

    const counts = { all: totalCount };
    state.allProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    if (nav && activeCats.length > 0) {
      let navHtml = `
        <button type="button" class="shop-cat-btn ${state.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
          All <span class="cat-count">(${totalCount})</span>
        </button>
      `;

      activeCats.forEach(c => {
        const slug = c.slug;
        const count = counts[slug] || 0;
        const name = c.name || c.title || slug;
        navHtml += `
          <button type="button" class="shop-cat-btn ${state.selectedCategory === slug ? 'active' : ''}" data-category="${slug}">
            ${name} <span class="cat-count">(${count})</span>
          </button>
        `;
      });

      nav.innerHTML = navHtml;
      elements.categoryButtons = nav.querySelectorAll('.shop-cat-btn');
      elements.categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedCategory = btn.getAttribute('data-category');
          updateUrlQuery();
          renderCatalog();
        });
      });
    }

    const drawerCatList = document.querySelector('#filter-drawer .filter-options-list');
    if (drawerCatList && activeCats.length > 0) {
      let drawerHtml = '';
      activeCats.forEach(c => {
        const slug = c.slug;
        const count = counts[slug] || 0;
        const name = c.name || c.title || slug;
        drawerHtml += `
          <label class="filter-checkbox-label">
            <input type="checkbox" name="filter-cat" value="${slug}" class="filter-checkbox" ${state.selectedCategory === slug ? 'checked' : ''} />
            <span class="checkbox-custom"></span>
            <span class="filter-option-name">${name}</span>
            <span class="filter-option-count">${count}</span>
          </label>
        `;
      });
      drawerCatList.innerHTML = drawerHtml;
      elements.categoryCheckboxes = document.querySelectorAll('input[name="filter-cat"]');
      elements.categoryCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          state.selectedCategory = cb.checked ? cb.value : 'all';
          updateUrlQuery();
          renderCatalog();
        });
      });
    }
  }

  /**
   * Update category count badges in nav and drawer
   */
  function updateCategoryCounts() {
    renderCategoryNavigation();
  }

  /**
   * Synchronize Drawer controls to match internal state
   */
  function syncDrawerInputs() {
    // Categories
    elements.categoryCheckboxes.forEach(cb => {
      cb.checked = (state.selectedCategory === cb.value);
    });

    // Sizes
    elements.sizeButtons.forEach(btn => {
      const size = btn.getAttribute('data-size');
      if (state.selectedSizes.has(size)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Price
    elements.priceRadios.forEach(radio => {
      radio.checked = (radio.value === state.selectedPriceRange);
    });

    // In Stock
    if (elements.inStockCheckbox) {
      elements.inStockCheckbox.checked = state.inStockOnly;
    }
  }

  /**
   * Calculate Active Filter Count and render interactive removable chips
   */
  function updateActiveFilterBadgesAndChips() {
    let activeFilterCount = 0;
    const chips = [];

    // Category Chip
    if (state.selectedCategory !== 'all') {
      activeFilterCount += 1;
      const catName = state.selectedCategory.charAt(0).toUpperCase() + state.selectedCategory.slice(1);
      chips.push({
        label: `Category: ${catName}`,
        onRemove: () => {
          state.selectedCategory = 'all';
          updateUrlQuery();
          renderCatalog();
        }
      });
    }

    // Size Chips
    if (state.selectedSizes.size > 0) {
      activeFilterCount += state.selectedSizes.size;
      state.selectedSizes.forEach(s => {
        chips.push({
          label: `Size: ${s}`,
          onRemove: () => {
            state.selectedSizes.delete(s);
            renderCatalog();
          }
        });
      });
    }

    // Price Chip
    if (state.selectedPriceRange !== 'all') {
      activeFilterCount += 1;
      let pLabel = 'Price Filter';
      if (state.selectedPriceRange === 'under-2500') pLabel = 'Under ₹2,500';
      if (state.selectedPriceRange === '2500-3500') pLabel = '₹2,500 – ₹3,500';
      if (state.selectedPriceRange === 'above-3500') pLabel = 'Above ₹3,500';
      chips.push({
        label: pLabel,
        onRemove: () => {
          state.selectedPriceRange = 'all';
          renderCatalog();
        }
      });
    }

    // In-Stock Chip (only if toggled off default or on)
    if (!state.inStockOnly) {
      activeFilterCount += 1;
      chips.push({
        label: 'Include Out of Stock',
        onRemove: () => {
          state.inStockOnly = true;
          renderCatalog();
        }
      });
    }

    // Update Filter Badge
    if (elements.filterBadge) {
      if (activeFilterCount > 0) {
        elements.filterBadge.textContent = activeFilterCount;
        elements.filterBadge.style.display = 'inline-flex';
      } else {
        elements.filterBadge.style.display = 'none';
      }
    }

    // Render Filter Chips
    if (elements.activeChips) {
      elements.activeChips.innerHTML = '';
      if (chips.length > 0) {
        chips.forEach(chip => {
          const chipEl = document.createElement('button');
          chipEl.type = 'button';
          chipEl.className = 'active-filter-chip';
          chipEl.innerHTML = `<span>${chip.label}</span><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
          chipEl.addEventListener('click', chip.onRemove);
          elements.activeChips.appendChild(chipEl);
        });

        // Add a "Clear All" chip button if multiple
        if (chips.length > 1) {
          const clearAllChip = document.createElement('button');
          clearAllChip.type = 'button';
          clearAllChip.className = 'active-filter-chip-clear';
          clearAllChip.textContent = 'Clear All';
          clearAllChip.addEventListener('click', resetAllFilters);
          elements.activeChips.appendChild(clearAllChip);
        }
      }
    }
  }

  /**
   * Reset all filters to default
   */
  function resetAllFilters() {
    state.selectedCategory = 'all';
    state.selectedSizes.clear();
    state.selectedPriceRange = 'all';
    state.inStockOnly = true;
    updateUrlQuery();
    renderCatalog();
  }

  /**
   * Update browser URL without reloading page
   */
  function updateUrlQuery() {
    const url = new URL(window.location.href);
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      url.searchParams.set('category', state.selectedCategory);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Slide-Over Drawer Open / Close
   */
  function openFilterDrawer() {
    if (!elements.filterDrawer || !elements.filterOverlay) return;
    elements.filterDrawer.classList.add('open');
    elements.filterOverlay.classList.add('open');
    elements.filterDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeFilterDrawer() {
    if (!elements.filterDrawer || !elements.filterOverlay) return;
    elements.filterDrawer.classList.remove('open');
    elements.filterOverlay.classList.remove('open');
    elements.filterDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Bind all event handlers
   */
  function bindEvents() {
    // Category Navigation Buttons (Horizontal bar)
    elements.categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        state.selectedCategory = cat;
        updateUrlQuery();
        renderCatalog();
      });
    });

    // Drawer Open / Close triggers
    if (elements.openFilterBtn) {
      elements.openFilterBtn.addEventListener('click', openFilterDrawer);
    }
    if (elements.closeFilterBtn) {
      elements.closeFilterBtn.addEventListener('click', closeFilterDrawer);
    }
    if (elements.filterOverlay) {
      elements.filterOverlay.addEventListener('click', closeFilterDrawer);
    }

    // ESC key closes drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.filterDrawer?.classList.contains('open')) {
        closeFilterDrawer();
      }
    });

    // Drawer Category Checkboxes
    elements.categoryCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          // Single category selection or multiple
          state.selectedCategory = cb.value;
        } else {
          state.selectedCategory = 'all';
        }
        updateUrlQuery();
        renderCatalog();
      });
    });

    // Drawer Size Buttons
    elements.sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size');
        if (state.selectedSizes.has(size)) {
          state.selectedSizes.delete(size);
        } else {
          state.selectedSizes.add(size);
        }
        renderCatalog();
      });
    });

    // Drawer Price Radios
    elements.priceRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          state.selectedPriceRange = radio.value;
          renderCatalog();
        }
      });
    });

    // Drawer In-Stock Checkbox
    if (elements.inStockCheckbox) {
      elements.inStockCheckbox.addEventListener('change', () => {
        state.inStockOnly = elements.inStockCheckbox.checked;
        renderCatalog();
      });
    }

    // Sort Dropdown
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderCatalog();
      });
    }

    // Drawer Actions
    if (elements.clearAllBtn) {
      elements.clearAllBtn.addEventListener('click', resetAllFilters);
    }
    if (elements.drawerResetBtn) {
      elements.drawerResetBtn.addEventListener('click', resetAllFilters);
    }
    if (elements.drawerApplyBtn) {
      elements.drawerApplyBtn.addEventListener('click', () => {
        closeFilterDrawer();
      });
    }

    // Empty state reset button
    if (elements.emptyStateResetBtn) {
      elements.emptyStateResetBtn.addEventListener('click', resetAllFilters);
    }
  }

  /**
   * Initialization
   */
  async function init() {
    initDOMElements();

    // Await live Supabase products from database
    if (window.MB_DATA && typeof window.MB_DATA.loadLiveCatalog === 'function') {
      try {
        await (window.MB_DATA.catalogPromise || window.MB_DATA.loadLiveCatalog());
      } catch (e) {
        console.warn('[Shop] Live catalog load error:', e);
      }
    }

    if (window.MB_DATA?.products) {
      state.allProducts = [...window.MB_DATA.products];
    }

    // Read initial URL query param (e.g. ?category=dresses)
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category');
    if (initialCategory && initialCategory !== 'all') {
      state.selectedCategory = initialCategory;
    } else {
      state.selectedCategory = 'all';
    }

    updateCategoryCounts();
    bindEvents();
    renderCatalog();

    window.addEventListener('mb:catalog-loaded', () => {
      if (window.MB_DATA?.products) {
        state.allProducts = [...window.MB_DATA.products];
        updateCategoryCounts();
        renderCatalog();
      }
    });
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
