/**
 * MARSH BARBARY — CUSTOMER ORDERS SERVICE (js/customer-orders.js)
 * Manages customer order history retrieval, status inspection, and details.
 * Supports both live Supabase and dev mode fallback with live admin status syncing.
 */

window.MB_ORDERS = (() => {
  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  function getAuthUser() {
    return window.MB_AUTH ? window.MB_AUTH.getUser() : null;
  }

  /**
   * Auto-generate official tracking portal URL based on logistics carrier & tracking number
   */
  function getCarrierTrackingUrl(carrier, trackingNumber) {
    if (!trackingNumber) return '';
    const c = (carrier || '').toLowerCase();
    const encoded = encodeURIComponent(String(trackingNumber).trim());
    if (c.includes('blue') || c.includes('dart')) return `https://www.bluedart.com/tracking?awb=${encoded}`;
    if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${encoded}`;
    if (c.includes('dtdc')) return `https://www.dtdc.in/tracking/tracking_results.asp?pin=${encoded}`;
    if (c.includes('post') || c.includes('speed')) return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
    if (c.includes('shadowfax')) return `https://tracker.shadowfax.in/#/track/${encoded}`;
    if (c.includes('ecom')) return `https://ecomexpress.in/tracking/?awb=${encoded}`;
    return '';
  }

  /**
   * Extract tracking carrier, AWB number, and URL from native columns or embedded notes tag
   */
  function extractTracking(raw) {
    let carrier = raw.tracking_carrier || raw.trackingCarrier || raw.carrier_name || '';
    let number = raw.tracking_number || raw.trackingNumber || '';
    let url = raw.tracking_url || raw.trackingUrl || '';

    if (raw.notes && typeof raw.notes === 'string') {
      try {
        const match = raw.notes.match(/\[MB_TRACKING:({.*?})\]/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          if (!carrier && parsed.carrier) carrier = parsed.carrier;
          if (!number && parsed.number) number = parsed.number;
          if (!url && parsed.url) url = parsed.url;
        }
      } catch (e) {}

      if (!carrier) {
        const cMatch = raw.notes.match(/Carrier:\s*([^|\n]+)/i);
        if (cMatch) carrier = cMatch[1].trim();
      }
      if (!number) {
        const aMatch = raw.notes.match(/AWB:\s*([^|\n]+)/i);
        if (aMatch) number = aMatch[1].trim();
      }
      if (!url) {
        const uMatch = raw.notes.match(/URL:\s*(https?:\/\/[^\s\n]+)/i);
        if (uMatch) url = uMatch[1].trim();
      }
    }

    if (!url && number) {
      url = getCarrierTrackingUrl(carrier, number);
    }

    return { carrier, number, url };
  }

  /**
   * Normalize an order object to ensure universal property availability
   * across Supabase schema variants, dev mode, and admin storage.
   */
  function normalizeOrder(raw) {
    if (!raw) return null;

    const rawStatus = raw.order_status || raw.status || 'PROCESSING';
    const status = String(rawStatus).toUpperCase();
    const tracking = extractTracking(raw);

    const addr = raw.shipping_address || {};
    const shipping_full_name = raw.shipping_full_name || addr.full_name || addr.fullName || addr.name || 'Valued Patron';
    const shipping_phone = raw.shipping_phone || addr.phone || '';
    const shipping_address_line_1 = raw.shipping_address_line_1 || addr.address_line1 || addr.addressLine1 || addr.line1 || '';
    const shipping_address_line_2 = raw.shipping_address_line_2 || addr.address_line2 || addr.addressLine2 || addr.line2 || '';
    const shipping_landmark = raw.shipping_landmark || addr.landmark || '';
    const shipping_city = raw.shipping_city || addr.city || 'Mumbai';
    const shipping_state = raw.shipping_state || addr.state || 'Maharashtra';
    const shipping_postal_code = raw.shipping_postal_code || addr.postal_code || addr.pincode || addr.pin || '';
    const shipping_country = raw.shipping_country || addr.country || 'India';

    const items = (raw.items || []).map(i => ({
      id: i.id || i.product_id,
      product_name: i.product_name || i.name || i.title || 'Atelier Silhouette',
      sku: i.sku || 'MB-DR-01',
      size: i.size || 'Regular',
      color: i.color || 'Signature',
      quantity: Number(i.quantity || i.qty || 1),
      unit_price: Number(i.unit_price || i.price || 0),
      total_price: Number(i.total_price || (Number(i.unit_price || i.price || 0) * Number(i.quantity || i.qty || 1))),
      image_url: i.image_url || i.image || 'assets/images/logo-emblem.png'
    }));

    const orderNumber = raw.order_number || raw.orderNumber || raw.id;

    return {
      ...raw,
      id: raw.id || orderNumber,
      order_number: orderNumber,
      orderNumber: orderNumber,
      status: status,
      order_status: status,
      payment_status: (raw.payment_status || raw.paymentStatus || 'PENDING').toUpperCase(),
      payment_method: raw.payment_method || raw.paymentMethod || 'Razorpay Gateway',
      payment_id: raw.payment_id || raw.paymentId || '',
      subtotal: Number(raw.subtotal || 0),
      shipping_fee: Number(raw.shipping_fee || raw.shippingCost || 0),
      total_amount: Number(raw.total_amount || raw.total || 0),
      tracking_carrier: tracking.carrier,
      tracking_number: tracking.number,
      tracking_url: tracking.url,
      trackingCarrier: tracking.carrier,
      trackingNumber: tracking.number,
      trackingUrl: tracking.url,
      shipping_full_name,
      shipping_phone,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_landmark,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      items,
      notes: raw.notes || '',
      timeline: raw.timeline || [],
      created_at: raw.created_at || raw.date || new Date().toISOString()
    };
  }

  /**
   * Fetch all orders placed by the current authenticated user.
   * Merges live Supabase records, local storefront orders (mb_dev_orders),
   * and administrative status/tracking overrides (mb_admin_orders).
   */
  async function getOrders() {
    const user = getAuthUser();
    if (!user) return [];

    const orderMap = new Map();

    // 1. Fetch from live Supabase if live configured
    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        let query = supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });

        // Query by user_id
        if (user.id) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data)) {
          data.forEach(row => {
            const norm = normalizeOrder(row);
            if (norm && norm.order_number) {
              orderMap.set(norm.order_number, norm);
            }
          });
        }
      } catch (err) {
        console.warn('[MB_ORDERS] Live orders fetch notice:', err);
      }
    }

    // 2. Read storefront dev orders (mb_dev_orders)
    try {
      const rawDev = localStorage.getItem('mb_dev_orders');
      if (rawDev) {
        const devList = JSON.parse(rawDev);
        if (Array.isArray(devList)) {
          devList.forEach(devO => {
            const belongsToUser = !devO.auth_user_id || devO.auth_user_id === user.id || devO.customer_email === user.email;
            if (belongsToUser) {
              const norm = normalizeOrder(devO);
              if (norm && norm.order_number) {
                if (orderMap.has(norm.order_number)) {
                  // Merge tracking & status if dev order is newer
                  const existing = orderMap.get(norm.order_number);
                  orderMap.set(norm.order_number, {
                    ...existing,
                    status: norm.status || existing.status,
                    order_status: norm.order_status || existing.order_status,
                    tracking_carrier: norm.tracking_carrier || existing.tracking_carrier,
                    tracking_number: norm.tracking_number || existing.tracking_number,
                    tracking_url: norm.tracking_url || existing.tracking_url,
                    trackingCarrier: norm.trackingCarrier || existing.trackingCarrier,
                    trackingNumber: norm.trackingNumber || existing.trackingNumber,
                    trackingUrl: norm.trackingUrl || existing.trackingUrl,
                    timeline: (norm.timeline && norm.timeline.length > 0) ? norm.timeline : existing.timeline
                  });
                } else {
                  orderMap.set(norm.order_number, norm);
                }
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('[MB_ORDERS] Error reading mb_dev_orders:', e);
    }

    // 3. Merge administrative status/tracking overrides (mb_admin_orders)
    // Ensures admin inspection updates immediately reflect without latency
    try {
      const rawAdmin = localStorage.getItem('mb_admin_orders');
      if (rawAdmin) {
        const adminList = JSON.parse(rawAdmin);
        if (Array.isArray(adminList)) {
          adminList.forEach(adminO => {
            const key = adminO.orderNumber || adminO.order_number || adminO.id;
            if (key && orderMap.has(key)) {
              const existing = orderMap.get(key);
              const adminTracking = extractTracking(adminO);
              const newStatus = (adminO.status || adminO.order_status || existing.status).toUpperCase();

              orderMap.set(key, {
                ...existing,
                status: newStatus,
                order_status: newStatus,
                tracking_carrier: adminTracking.carrier || existing.tracking_carrier,
                tracking_number: adminTracking.number || existing.tracking_number,
                tracking_url: adminTracking.url || existing.tracking_url,
                trackingCarrier: adminTracking.carrier || existing.trackingCarrier,
                trackingNumber: adminTracking.number || existing.trackingNumber,
                trackingUrl: adminTracking.url || existing.trackingUrl,
                timeline: (adminO.timeline && adminO.timeline.length > 0) ? adminO.timeline : existing.timeline
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('[MB_ORDERS] Error syncing from mb_admin_orders:', e);
    }

    const result = Array.from(orderMap.values());
    return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  /**
   * Fetch order details by order number or ID
   */
  async function getOrderById(idOrNumber) {
    const user = getAuthUser();
    if (!user) return null;

    const orders = await getOrders();
    return orders.find(o => o.id === idOrNumber || o.order_number === idOrNumber) || null;
  }

  return {
    getOrders,
    getOrderById,
    normalizeOrder,
    getCarrierTrackingUrl
  };
})();
