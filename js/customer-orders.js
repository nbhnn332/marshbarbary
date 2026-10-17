/**
 * MARSH BARBARY — CUSTOMER ORDERS SERVICE (js/customer-orders.js)
 * Manages customer order history retrieval, status inspection, and details.
 * Supports both live Supabase and dev mode fallback.
 */

window.MB_ORDERS = (() => {
  function getClient() {
    return window.MB_SUPABASE ? window.MB_SUPABASE.getClient() : null;
  }

  function getAuthUser() {
    return window.MB_AUTH ? window.MB_AUTH.getUser() : null;
  }

  /**
   * Fetch all orders placed by the current authenticated user
   */
  async function getOrders() {
    const user = getAuthUser();
    if (!user) return [];

    const supabase = getClient();
    if (window.MB_SUPABASE && window.MB_SUPABASE.isLive()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn('[MB_ORDERS] Live orders fetch failed, reading dev store:', err);
      }
    }

    // Dev mode fallback
    try {
      const raw = localStorage.getItem('mb_dev_orders');
      const allOrders = raw ? JSON.parse(raw) : [];
      const userOrders = allOrders.filter(o => o.auth_user_id === user.id);
      return userOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } catch (e) {
      return [];
    }
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
    getOrderById
  };
})();
