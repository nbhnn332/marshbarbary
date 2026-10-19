/**
 * MARSH BARBARY — LIVE CATALOG DATA SERVICE (js/data.js)
 * Single source of truth fetching real products, categories, and hero banner
 * directly from live Supabase PostgreSQL.
 * ALL dummy products and dummy categories removed.
 */

window.MB_DATA = {
  categories: [],
  products: [],
  hero: null,

  // Brand values & pillars for homepage
  values: [
    {
      id: 'conscious',
      title: 'CONSCIOUS',
      desc: 'Thoughtful choices for a better tomorrow.',
      icon: `<svg viewBox="0 0 24 24"><path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-3.86 3.14-7 7-7 3.86 0 7 3.14 7 7 0 3.86-3.14 7-7 7z" stroke-width="1.5" stroke-linecap="round"/><path d="M12 6c-2.76 0-5 2.24-5 5 0 2.05 1.23 3.81 3 4.58V18" stroke-width="1.5" stroke-linecap="round"/></svg>`
    },
    {
      id: 'confident',
      title: 'CONFIDENT',
      desc: 'Designed to make you feel your best.',
      icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke-width="1.5" stroke-linecap="round"/></svg>`
    },
    {
      id: 'timeless',
      title: 'TIMELESS',
      desc: 'Styles that go beyond seasons.',
      icon: `<svg viewBox="0 0 24 24"><path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.26-8-12.356-8-5.096 0-5.096 8 0 8 5.096 0 7.261-8 12.356-8z" stroke-width="1.5" stroke-linecap="round"/></svg>`
    },
    {
      id: 'refined',
      title: 'REFINED',
      desc: 'Elegance in every detail.',
      icon: `<svg viewBox="0 0 24 24"><polygon points="6 3 18 3 22 9 12 21 2 9 6 3" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="9" stroke-width="1.5"/><line x1="2" y1="9" x2="22" y2="9" stroke-width="1.5"/></svg>`
    }
  ]
};

// Swatch color resolver for fabric color names
const COLOR_HEX_MAP = {
  'saffron': '#D48B38',
  'oatmeal': '#D8C3A5',
  'ivory': '#EFECE6',
  'terracotta': '#B47154',
  'sand': '#C2B280',
  'white': '#FFFFFF',
  'black': '#222222',
  'rose': '#9E4733',
  'cocoa': '#543D34',
  'olive': '#556B2F'
};

function resolveColorHex(colorName) {
  if (!colorName) return '#B47154';
  const key = String(colorName).trim().toLowerCase();
  return COLOR_HEX_MAP[key] || '#B47154';
}

function normalizeCategorySlug(rawSlug) {
  if (!rawSlug) return 'dresses';
  const s = String(rawSlug).trim().toLowerCase();
  if (s === 'co-ords' || s === 'co-ords-sets' || s === 'sets-co-ords') return 'coords';
  if (s === 'dresses-kaftans') return 'dresses';
  if (s === 'tops-blouses') return 'tops';
  if (s === 'bottoms-trousers' || s === 'trousers-skirts') return 'bottoms';
  return s;
}

/**
 * Live Supabase Catalog Loader
 * Pulls real products, categories, and hero banner from live Supabase PostgreSQL
 */
window.MB_DATA.loadLiveCatalog = async function() {
  if (!window.MB_SUPABASE_CONFIG || !window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
    console.warn('[MB_DATA] Supabase is not configured; cannot fetch live catalog.');
    return { categories: [], products: [] };
  }

  const { url, anonKey } = window.MB_SUPABASE_CONFIG;
  const headers = { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey };

  try {
    const [catRes, prodRes, heroRes] = await Promise.all([
      fetch(`${url}/rest/v1/categories?is_active=eq.true&order=display_order`, { headers }),
      fetch(`${url}/rest/v1/products?select=*,images:product_images(*),variants:product_variants(*)&is_active=eq.true`, { headers }),
      fetch(`${url}/rest/v1/hero_content?is_active=eq.true&limit=1`, { headers })
    ]);

    // 1. Process Live Categories
    const categoryMapById = new Map();
    if (catRes.ok) {
      const liveCats = await catRes.json();
      if (Array.isArray(liveCats) && liveCats.length > 0) {
        liveCats.forEach(c => categoryMapById.set(c.id, c));

        window.MB_DATA.categories = liveCats.map(c => ({
          id: c.slug,
          rawId: c.id,
          title: (c.name || '').toUpperCase(),
          name: c.name,
          slug: c.slug,
          originalSlug: c.slug,
          image: c.image_url || (window.MB_FALLBACK_SVG || ''),
          link: `shop.html?category=${c.slug}`,
          description: c.description || '',
          displayOrder: c.display_order || 1,
          status: c.is_active ? 'active' : 'hidden'
        })).sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1));
      }
    }

    // 2. Process Live Products
    if (prodRes.ok) {
      const liveProds = await prodRes.json();
      if (Array.isArray(liveProds)) {
        window.MB_DATA.products = liveProds.map(p => {
          function parseImgMeta(altText, fallbackIdx) {
            if (!altText) return { role: 'main', index: fallbackIdx };
            if (altText.startsWith('{') && altText.endsWith('}')) {
              try {
                const parsed = JSON.parse(altText);
                if (parsed.role) return parsed;
              } catch(e) {}
            }
            if (altText.startsWith('color:')) {
              const cName = altText.replace(/^color:/, '').trim() || 'Standard';
              return { role: 'color', colorName: cName, index: fallbackIdx };
            }
            return { role: 'main', index: fallbackIdx };
          }

          const sortedImgs = (p.images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          const mainImgs = [];
          const colorGalleries = {};

          sortedImgs.forEach((img, idx) => {
            const meta = parseImgMeta(img.alt_text, idx);
            if (meta.role === 'color' && meta.colorName) {
              const cName = meta.colorName;
              colorGalleries[cName] = colorGalleries[cName] || [];
              colorGalleries[cName].push(img.storage_path);
            } else {
              mainImgs.push(img);
            }
          });

          const mainImg = mainImgs[0]?.storage_path || (window.MB_FALLBACK_SVG || '');
          const gallery = mainImgs.map(i => i.storage_path);

          // Resolve variants, sizes, colors, and stock
          const rawVariants = p.variants || [];
          const variants = rawVariants.map(v => {
            const vColor = (v.color || 'Standard').trim();
            const vImgs = colorGalleries[vColor] || [];
            return {
              ...v,
              stock: v.stock_qty,
              image_url: vImgs[0] || mainImg,
              images: vImgs
            };
          });

          const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
          const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
          const totalStock = variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
          const price = Number(p.sale_price || p.base_price || 0);

          // Map category_id to slug
          const catObj = categoryMapById.get(p.category_id);
          const resolvedCat = catObj ? catObj.slug : 'dresses';

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: price,
            basePrice: Number(p.base_price || 0),
            salePrice: p.sale_price ? Number(p.sale_price) : null,
            formattedPrice: '₹' + price.toLocaleString('en-IN'),
            image: mainImg,
            gallery: gallery.length ? gallery : [mainImg],
            colorGalleries: colorGalleries,
            category: resolvedCat,
            categoryId: p.category_id,
            description: p.description || '',
            details: [
              p.fabric ? `Fabric: ${p.fabric}` : '',
              p.care_instructions ? `Care: ${p.care_instructions}` : ''
            ].filter(Boolean),
            fabricCare: {
              composition: p.fabric || '100% Sustainable Linen',
              care: p.care_instructions || 'Dry clean or gentle hand wash.'
            },
            stockStatus: totalStock > 0 ? (totalStock <= (p.low_stock_threshold || 5) ? 'low-stock' : 'available') : 'out-of-stock',
            stockNote: totalStock > 0 ? (totalStock <= 5 ? `Only ${totalStock} pieces remaining` : 'In Stock • Ready to ship') : 'Backorder Available',
            swatches: uniqueColors.map(c => {
              const cImgs = colorGalleries[c] || [];
              const matchingVariant = variants.find(v => v.color === c);
              return {
                name: c,
                color: resolveColorHex(c),
                image: cImgs[0] || matchingVariant?.image_url || mainImg,
                images: cImgs
              };
            }),
            sizes: uniqueSizes.length ? uniqueSizes : ['XS', 'S', 'M', 'L', 'XL'],
            unavailableSizes: variants.filter(v => (v.stock_qty || 0) <= 0).map(v => v.size),
            inStock: totalStock > 0,
            isNew: Boolean(p.is_featured),
            variants: variants
          };
        });
      }
    }

    // 3. Process Live Hero Content
    if (heroRes.ok) {
      const liveHero = await heroRes.json();
      if (Array.isArray(liveHero) && liveHero[0]) {
        window.MB_DATA.hero = liveHero[0];
        const heroVisual = document.querySelector('.hero-main-visual');
        if (heroVisual && liveHero[0].desktop_image_path) {
          heroVisual.src = liveHero[0].desktop_image_path;
          heroVisual.style.display = 'block';
        }
        try {
          if (liveHero[0].desktop_image_path) {
            localStorage.setItem('mb_hero_image', liveHero[0].desktop_image_path);
          }
        } catch(e) {}
      }
    }

    // 4. Sync admin panel localStorage with live Supabase data so admin shows real items
    try {
      const adminFormattedProducts = window.MB_DATA.products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.variants?.[0]?.sku || `MB-${p.name.substring(0, 3).toUpperCase()}`,
        category: p.category,
        categoryId: p.categoryId,
        price: p.basePrice || p.price,
        salePrice: p.salePrice,
        stock: p.variants?.reduce((sum, v) => sum + (v.stock_qty || 0), 0) || 10,
        lowStockThreshold: 5,
        status: p.inStock ? 'active' : 'draft',
        featured: p.isNew,
        newArrival: p.isNew,
        shortDescription: p.description,
        description: p.description,
        fabric: p.fabricCare?.composition || '',
        care: p.fabricCare?.care || '',
        image: p.image,
        gallery: p.gallery,
        variants: p.variants || []
      }));
      localStorage.setItem('mb_admin_products', JSON.stringify(adminFormattedProducts));

      const adminFormattedCategories = window.MB_DATA.categories.map(c => ({
        id: c.rawId || c.id,
        slug: c.slug,
        name: c.name || c.title,
        description: c.description,
        image: c.image,
        displayOrder: c.displayOrder,
        status: c.status || 'active',
        productCount: window.MB_DATA.products.filter(p => p.categoryId === c.rawId || p.category === c.slug).length
      }));
      localStorage.setItem('mb_admin_categories', JSON.stringify(adminFormattedCategories));
    } catch (e) {
      // LocalStorage sync is secondary
    }

    // Broadcast catalog loaded event
    window.dispatchEvent(new CustomEvent('mb:catalog-loaded', { detail: { count: window.MB_DATA.products.length } }));
    return { categories: window.MB_DATA.categories, products: window.MB_DATA.products };
  } catch (err) {
    console.warn('[MB_DATA] Live Supabase catalog fetch failed:', err);
    return { categories: [], products: [] };
  }
};

// Auto-trigger live catalog fetch immediately on script load
if (window.MB_SUPABASE_CONFIG && window.MB_SUPABASE_CONFIG.isLiveConfigured()) {
  window.MB_DATA.catalogPromise = window.MB_DATA.loadLiveCatalog();
}
