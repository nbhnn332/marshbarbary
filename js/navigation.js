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

  // Update cart count on header bag icon
  function updateHeaderCartBadge() {
    const badges = document.querySelectorAll('.cart-badge, .header-cart-badge, [data-cart-count]');
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
      badges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-flex' : 'none';
      });
    } catch (e) {}
  }

  updateHeaderCartBadge();
  window.addEventListener('storage', updateHeaderCartBadge);
  window.addEventListener('cart:updated', updateHeaderCartBadge);
  document.addEventListener('cartUpdated', updateHeaderCartBadge);
  document.addEventListener('click', (e) => {
    if (e.target.closest('.add-to-cart-btn, .btn-add-to-cart, .quick-add-btn')) {
      setTimeout(updateHeaderCartBadge, 300);
    }
  });
});
