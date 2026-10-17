/**
 * MARSH BARBARY — ADMIN MODELS & SEED DATA (js/admin/admin-models.js)
 * Central entity definitions and realistic seed data.
 * Mapped 1:1 to future single Supabase / PostgreSQL database tables.
 */

window.MB_ADMIN_MODELS = (() => {

  // Live database categories & products (Loaded purely from live Supabase)
  const seedCategories = [];
  const seedProducts = [];

  // Live Orders, Customers, Returns (Loaded purely from live Supabase)
  const seedOrders = [];
  const seedCustomers = [];
  const seedReturns = [];

  // Seed Coupons
  const seedCoupons = [
    {
      id: 'coup-1',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 2500,
      maxDiscount: 1000,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      usageLimit: 500,
      usageCount: 42,
      status: 'active'
    },
    {
      id: 'coup-2',
      code: 'ATELIER500',
      type: 'FIXED',
      value: 500,
      minOrder: 4500,
      maxDiscount: 500,
      validFrom: '2026-09-01',
      validTo: '2026-10-31',
      usageLimit: 100,
      usageCount: 18,
      status: 'active'
    }
  ];

  // Granular capability definitions (12 clean ecommerce permissions)
  const PERMISSION_DEFINITIONS = [
    { id: 'dashboard', label: 'Dashboard', category: 'Overview', description: 'View executive sales velocity, orders, and inventory alerts' },
    { id: 'products', label: 'Products', category: 'Catalog', description: 'Create, edit, price, and publish atelier garments and variants' },
    { id: 'categories', label: 'Categories', category: 'Catalog', description: 'Manage modest fashion categories, ordering, and cover visuals' },
    { id: 'orders', label: 'Orders', category: 'Sales', description: 'Process shipments, update statuses, view customer data, and print bills' },
    { id: 'customers', label: 'Customers', category: 'Sales', description: 'View customer accounts, lifetime order history, and addresses' },
    { id: 'returns', label: 'Returns', category: 'Sales', description: 'Review, approve, reject, or refund customer return requests' },
    { id: 'coupons', label: 'Coupons', category: 'Sales', description: 'Create seasonal promotional codes, percentage discounts, and limits' },
    { id: 'homepage', label: 'Homepage', category: 'Content', description: 'Manage real customer homepage hero visual, banner narrative, and features' },
    { id: 'admin_users', label: 'Admin Users', category: 'Administration', description: 'Create and manage administrative accounts, assign roles, and permissions' },
    { id: 'settings', label: 'Settings', category: 'Administration', description: 'Configure store contact, tax rate, free shipping threshold, and policies' },
    { id: 'payment_settings', label: 'Payment Settings', category: 'Administration', description: 'Manage Razorpay and PhonePe API credentials and COD rules' },
    { id: 'audit_logs', label: 'Audit Logs', category: 'Administration', description: 'Monitor administrative activity, logins, and critical configuration changes' }
  ];

  const DEFAULT_ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'admin_users', 'settings', 'payment_settings', 'audit_logs'],
    ADMIN: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'settings', 'audit_logs'],
    STAFF: ['dashboard', 'orders', 'products', 'returns']
  };

  // Seed Admin Users & RBAC
  const seedAdminUsers = [
    {
      id: 'adm-1',
      name: 'Elena Rostova',
      email: 'superadmin@marshbarbary.com',
      role: 'SUPER_ADMIN',
      status: 'active',
      permissions: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'admin_users', 'settings', 'payment_settings', 'audit_logs'],
      lastLogin: '2026-09-27 22:45',
      createdAt: '2026-01-01'
    },
    {
      id: 'adm-2',
      name: 'Kavya Sen',
      email: 'admin@marshbarbary.com',
      role: 'ADMIN',
      status: 'active',
      permissions: ['dashboard', 'products', 'categories', 'orders', 'customers', 'returns', 'coupons', 'homepage', 'settings', 'audit_logs'],
      lastLogin: '2026-09-26 18:30',
      createdAt: '2026-03-15'
    },
    {
      id: 'adm-3',
      name: 'Rohan Mehta',
      email: 'staff@marshbarbary.com',
      role: 'STAFF',
      status: 'active',
      permissions: ['dashboard', 'orders', 'products', 'returns'],
      lastLogin: '2026-09-25 16:10',
      createdAt: '2026-05-10'
    }
  ];

  const permissionsMatrix = DEFAULT_ROLE_PERMISSIONS;

  // Seed Homepage Configuration (1:1 with actual customer index.html)
  const seedHomepageConfig = {
    hero: {
      image: '',
      altText: 'Where Wild Elegance Meets Style',
      enabled: true
    },
    storyBanner: {
      tag: 'OUR STORY',
      headline: 'More Than Just Fashion',
      description: 'At Marsh Barbary, we believe in clothing that empowers — thoughtfully designed, mindfully made, and inspired by the beauty of everyday life.',
      ctaText: 'Discover Our Story',
      ctaLink: 'shop.html',
      quote: 'A kinder wardrobe for a brighter tomorrow.',
      image: 'assets/images/story-banner.jpg',
      enabled: true
    },
    newArrivals: {
      headline: 'New Arrivals',
      viewAllText: 'View All →',
      viewAllLink: 'shop.html',
      productLimit: 4,
      enabled: true
    },
    collections: {
      headline: 'Explore Our New Collection',
      subtext: 'Thoughtfully designed pieces for every chapter of your story.',
      ctaText: 'View Collection →',
      ctaLink: 'shop.html',
      enabled: true
    }
  };

  // Seed Payment Settings (Never store real private keys client-side)
  const seedPaymentSettings = {
    razorpay: {
      enabled: true,
      keyId: 'rzp_test_mbAtelier9102',
      secretMasked: '••••••••••••••••••••••••',
      mode: 'test'
    },
    phonepe: {
      enabled: true,
      merchantId: 'MERCHANTUAT',
      saltIndex: 1,
      endpointUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
      saltMasked: '••••••••••••••••••••••••',
      mode: 'test'
    },
    cod: {
      enabled: true,
      maxOrderValue: 5000,
      fee: 0,
      requireOtpVerification: true,
      minOrder: 1000,
      maxOrder: 15000
    }
  };

  // Seed Store Settings
  const seedStoreSettings = {
    storeName: 'MARSH BARBARY',
    tagline: 'Elegance in Pure Modesty • Sustainable Atelier',
    gstin: '27AABCM8821K1ZM',
    address: '14 Atelier Lane, Kala Ghoda, Fort, Mumbai, Maharashtra 400001',
    supportEmail: 'concierge@marshbarbary.com',
    contactEmail: 'concierge@marshbarbary.com',
    supportPhone: '+91 98200 12345',
    contactPhone: '+91 98200 12345',
    supportHours: 'Mon - Sat, 10:00 AM - 7:00 PM IST',
    freeShippingThreshold: 2999,
    flatShippingFee: 150,
    standardShippingFee: 150,
    returnWindowDays: 7,
    gstTaxRate: 12,
    social: {
      instagram: 'https://instagram.com/marshbarbary',
      facebook: 'https://facebook.com/marshbarbary',
      pinterest: 'https://pinterest.com/marshbarbary',
      youtube: 'https://youtube.com/@marshbarbary'
    },
    seo: {
      defaultTitle: 'MARSH BARBARY — Modest Luxury Fashion',
      metaDescription: 'Mindfully crafted clothing designed with conscious organic fabrics for effortless elegance.'
    }
  };

  // Seed Audit Logs
  const seedAuditLogs = [
    {
      id: 'log-101',
      timestamp: '2026-09-26 14:35:10',
      adminName: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
      action: 'ORDER_STATUS_UPDATED',
      entity: 'Order',
      entityId: 'ORD-1002',
      details: 'Status transitioned from UNSHIPPED to PROCESSING'
    },
    {
      id: 'log-102',
      timestamp: '2026-09-26 12:10:04',
      adminName: 'Store Manager',
      adminRole: 'ADMIN',
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: 'a1111111-aaaa-1111-aaaa-111111111111',
      details: 'Updated inventory stock allocation for The Saffron Linen Midi'
    },
    {
      id: 'log-103',
      timestamp: '2026-09-25 17:05:22',
      adminName: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
      action: 'COUPON_CREATED',
      entity: 'Coupon',
      entityId: 'ATELIER500',
      details: 'Created ₹500 flat discount coupon for orders above ₹4,500'
    }
  ];

  const seedInstagramFeed = [
    {
      id: 'ig-1',
      img: 'assets/images/instagram/ig-post-1.jpg',
      caption: 'Photo by Shwetha Menon on April 08, 2026.',
      url: 'https://www.instagram.com/shwetha_menon/p/DW4Xlvukk3o/',
      likes: '350',
      active: true
    },
    {
      id: 'ig-2',
      img: 'assets/images/instagram/ig-post-2.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 13, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jhdukVvU/',
      likes: '397',
      active: true
    },
    {
      id: 'ig-3',
      img: 'assets/images/instagram/ig-post-3.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 13, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jZLNkcB1/',
      likes: '444',
      active: true
    },
    {
      id: 'ig-4',
      img: 'assets/images/instagram/ig-post-4.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 10, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DVs55hSkQFR/',
      likes: '491',
      active: true
    },
    {
      id: 'ig-5',
      img: 'assets/images/instagram/ig-post-5.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 09, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DVsMksSEzGT/',
      likes: '538',
      active: true
    },
    {
      id: 'ig-6',
      img: 'assets/images/instagram/ig-post-6.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 09, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DVqX66YEVYV/',
      likes: '585',
      active: true
    },
    {
      id: 'ig-7',
      img: 'assets/images/instagram/ig-post-7.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 08, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DVoCH8VE5Mf/',
      likes: '632',
      active: true
    },
    {
      id: 'ig-8',
      img: 'assets/images/instagram/ig-post-8.jpg',
      caption: 'Photo by M A R S H  B A R B A R Y on March 06, 2026.',
      url: 'https://www.instagram.com/marshbarbary/p/DVk0c_Zkecd/',
      likes: '679',
      active: true
    }
  ];

  return {
    seedCategories,
    seedProducts,
    seedOrders,
    seedCustomers,
    seedReturns,
    seedCoupons,
    seedAdminUsers,
    permissionsMatrix,
    PERMISSION_DEFINITIONS,
    DEFAULT_ROLE_PERMISSIONS,
    seedHomepageConfig,
    seedPaymentSettings,
    seedStoreSettings,
    seedAuditLogs,
    seedInstagramFeed
  };
})();
