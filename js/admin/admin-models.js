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
      img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
      caption: 'Quiet coastal grace in pure organic linen. Styled by Shwetha Menon for Marsh Barbary. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/shwetha_menon/p/DW4Xlvukk3o/',
      likes: '350',
      active: true
    },
    {
      id: 'ig-2',
      img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      caption: 'The art of natural draping. Crafted from 100% European flax linen. #MarshBarbary #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jhdukVvU/',
      likes: '397',
      active: true
    },
    {
      id: 'ig-3',
      img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
      caption: 'Tactile textures that breathe with your movement. #SlowFashion #ConsciousClothing',
      url: 'https://www.instagram.com/marshbarbary/p/DV2jZLNkcB1/',
      likes: '444',
      active: true
    },
    {
      id: 'ig-4',
      img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
      caption: 'Aanya Tiered Maxi Dress — sun-kissed terracotta inspired by coastal horizons. #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/p/DVs55hSkQFR/',
      likes: '491',
      active: true
    },
    {
      id: 'ig-5',
      img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      caption: 'Chasing the wild tide. Designed to move with you, not against you. #NatureInspired',
      url: 'https://www.instagram.com/marshbarbary/p/DVsMksSEzGT/',
      likes: '538',
      active: true
    },
    {
      id: 'ig-6',
      img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      caption: 'Clean architectural silhouettes with mindful heart. #TimelessDesign #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/p/DVqX66YEVYV/',
      likes: '585',
      active: true
    },
    {
      id: 'ig-7',
      img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80',
      caption: 'Botanical dye details and delicate finishing in the atelier. #MindfulCraft #Handmade',
      url: 'https://www.instagram.com/marshbarbary/p/DVoCH8VE5Mf/',
      likes: '632',
      active: true
    },
    {
      id: 'ig-8',
      img: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80',
      caption: 'Understated elegance for quiet days and memorable evenings. #EffortlessLuxury',
      url: 'https://www.instagram.com/marshbarbary/p/DVk0c_Zkecd/',
      likes: '679',
      active: true
    },
    {
      id: 'ig-9',
      img: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
      caption: 'Swasika in the artisanal hand-loomed terracotta ensemble. Styled by Tharunya VK for Marsh Barbary. #Swasika #MarshBarbary',
      url: 'https://www.instagram.com/marshbarbary/p/DU8j01mkY9_/',
      likes: '1,240',
      active: true
    },
    {
      id: 'ig-10',
      img: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&w=800&q=80',
      caption: 'The quiet beauty of slow mornings. Sustainable handloom tailored to perfection. #SlowLiving #Elegance',
      url: 'https://www.instagram.com/marshbarbary/p/DU0k718EY91/',
      likes: '890',
      active: true
    },
    {
      id: 'ig-11',
      img: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
      caption: 'Monochrome sand tones. The Maya Relaxed Co-ord set made from certified organic cotton. #MarshStyle',
      url: 'https://www.instagram.com/marshbarbary/p/DT7m182E872/',
      likes: '760',
      active: true
    },
    {
      id: 'ig-12',
      img: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80',
      caption: 'Flowing tiers and hand-stitched detailing. The signature Aanya Dress. #SignatureCollection',
      url: 'https://www.instagram.com/marshbarbary/p/DT1o902k412/',
      likes: '620',
      active: true
    },
    {
      id: 'ig-13',
      img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
      caption: 'Sculptural necklines meeting pure organic comfort. Modern minimalism for conscious wardrobes. #MinimalistFashion',
      url: 'https://www.instagram.com/marshbarbary/p/DS9v765k819/',
      likes: '540',
      active: true
    },
    {
      id: 'ig-14',
      img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
      caption: 'Pleated wide-leg culottes designed for fluid grace and everyday ease. #WildElegance',
      url: 'https://www.instagram.com/marshbarbary/p/DS3w018E662/',
      likes: '690',
      active: true
    },
    {
      id: 'ig-15',
      img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
      caption: 'Warm clay pigments drawn from nature. The Sienna Gathered Midi Dress. #BotanicalDye',
      url: 'https://www.instagram.com/marshbarbary/p/DR8p219k771/',
      likes: '810',
      active: true
    },
    {
      id: 'ig-16',
      img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
      caption: 'Relaxed tailoring in earth khaki linen. Built to last through seasons and trends. #ConsciousWardrobe',
      url: 'https://www.instagram.com/marshbarbary/p/DQ9x312E444/',
      likes: '480',
      active: true
    },
    {
      id: 'ig-17',
      img: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=800&q=80',
      caption: 'Hand-woven artisan accessories celebrating indigenous craft techniques. #ArtisanMade',
      url: 'https://www.instagram.com/marshbarbary/p/DP2q410k888/',
      likes: '530',
      active: true
    },
    {
      id: 'ig-18',
      img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
      caption: 'Where the marsh meets the wild barbarian spirit. Coastal horizons and wind-blown textures. #CoastlineMood',
      url: 'https://www.instagram.com/marshbarbary/p/DO5k911E333/',
      likes: '1,520',
      active: true
    },
    {
      id: 'ig-19',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      caption: 'Sunlight and silence. Raw earth undertones that define our Autumn palette. #ColorStory',
      url: 'https://www.instagram.com/marshbarbary/p/DN8l123k777/',
      likes: '940',
      active: true
    },
    {
      id: 'ig-20',
      img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      caption: 'Macro texture of 100% natural unbleached linen weave. Pure tactile luxury. #NaturalFabrics',
      url: 'https://www.instagram.com/marshbarbary/p/DM4j789E222/',
      likes: '1,120',
      active: true
    },
    {
      id: 'ig-21',
      img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      caption: 'The Horizon Collection: A symphony of earth pigments and effortless silhouettes. #NewArrivals',
      url: 'https://www.instagram.com/marshbarbary/p/DL7m654k111/',
      likes: '2,150',
      active: true
    },
    {
      id: 'ig-22',
      img: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=800&q=80',
      caption: 'Step into the atelier. Every seam tells a story of intention and respect for earth. #BehindTheScenes',
      url: 'https://www.instagram.com/marshbarbary/p/DK1n234E999/',
      likes: '1,830',
      active: true
    },
    {
      id: 'ig-23',
      img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
      caption: 'Zero-waste botanical appliqués created from studio offcuts. #ZeroWasteFashion #UpcycledArt',
      url: 'https://www.instagram.com/marshbarbary/p/DJ9p876k555/',
      likes: '730',
      active: true
    },
    {
      id: 'ig-24',
      img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
      caption: 'Evening mood. The understated allure of raw silk and hand-loomed fibers. #EveningWear',
      url: 'https://www.instagram.com/marshbarbary/p/DI3r567E444/',
      likes: '850',
      active: true
    }
  ];

  const seedHomeSliderConfig = {
    mode: 'fixed', // 'fixed' | 'non-fixed'
    posts: JSON.parse(JSON.stringify(seedInstagramFeed))
  };

  const seedAboutSliderConfig = {
    mode: 'fixed', // 'fixed' | 'non-fixed'
    posts: JSON.parse(JSON.stringify(seedInstagramFeed))
  };

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
    seedInstagramFeed,
    seedHomeSliderConfig,
    seedAboutSliderConfig
  };
})();
