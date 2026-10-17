/**
 * MARSH BARBARY - NAVIGATION & MOBILE DRAWER
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const closeBtn = document.querySelector('.mobile-drawer-close');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');

  // Sticky header shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile Drawer Toggle
  function openMobileDrawer() {
    drawer?.classList.add('active');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    drawer?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', openMobileDrawer);
  closeBtn?.addEventListener('click', closeMobileDrawer);
  overlay?.addEventListener('click', closeMobileDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMobileDrawer);
  });

  // Close drawer on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('active')) {
      closeMobileDrawer();
    }
  });

  // Inject Modern Mobile Bottom Floating Bar (Mobile Viewports Only)
  function initMobileBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) return;
    if (window.location.pathname.includes('/admin/')) return;

    const path = window.location.pathname.toLowerCase();
    const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('/') || !path.includes('.html');
    const isShop = path.includes('shop.html') || path.includes('product.html');
    const isAbout = path.includes('about.html');
    const isCart = path.includes('cart.html') || path.includes('checkout.html');

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile Bottom Navigation');
    nav.innerHTML = `
      <a href="index.html" class="mobile-bottom-nav-item ${isHome ? 'active' : ''}" aria-label="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </a>
      <a href="shop.html" class="mobile-bottom-nav-item ${isShop ? 'active' : ''}" aria-label="Shop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Shop</span>
      </a>
      <a href="about.html" class="mobile-bottom-nav-item ${isAbout ? 'active' : ''}" aria-label="About">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>About</span>
      </a>
      <a href="cart.html" class="mobile-bottom-nav-item ${isCart ? 'active' : ''}" aria-label="Shopping Bag">
        <div class="mobile-bottom-nav-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span class="mobile-bottom-badge" id="mobile-nav-cart-badge">0</span>
        </div>
        <span>Bag</span>
      </a>
    `;

    document.body.appendChild(nav);

    function updateMobileCartBadge() {
      const badge = document.getElementById('mobile-nav-cart-badge');
      if (!badge) return;
      try {
        let count = 0;
        if (window.CartService && typeof window.CartService.getItemCount === 'function') {
          count = window.CartService.getItemCount();
        } else {
          const raw = localStorage.getItem('mb_cart') || localStorage.getItem('cart');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              count = parsed.reduce((sum, it) => sum + (it.quantity || it.qty || 1), 0);
            }
          }
        }
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      } catch (e) {}
    }

    updateMobileCartBadge();
    window.addEventListener('storage', updateMobileCartBadge);
    window.addEventListener('cart:updated', updateMobileCartBadge);
    document.addEventListener('cartUpdated', updateMobileCartBadge);
    document.addEventListener('click', (e) => {
      if (e.target.closest('.add-to-cart-btn, .btn-add-to-cart, .quick-add-btn')) {
        setTimeout(updateMobileCartBadge, 300);
      }
    });
  }

  initMobileBottomNav();
});
