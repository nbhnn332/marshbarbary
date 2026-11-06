/**
 * Vercel Serverless Function: /api/razorpay-webhook
 * Marsh Barbary — Razorpay Webhook Processing Engine
 * 
 * Capabilities:
 * 1. HMAC SHA-256 signature verification via X-Razorpay-Signature header
 * 2. Event routing: payment.captured, payment.failed, order.paid
 * 3. Idempotency management to prevent duplicate event execution
 * 4. Database order & payment status synchronization via Supabase REST API
 * 5. Safe audit logging & fallback handling
 */

const crypto = require('crypto');

// In-memory idempotency cache for recent events (TTL: 24h)
const processedEvents = new Map();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function cleanExpiredEvents() {
  const now = Date.now();
  for (const [id, timestamp] of processedEvents.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      processedEvents.delete(id);
    }
  }
}

/**
 * Extract raw request body string for byte-accurate HMAC verification
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (req.rawBody) {
      return resolve(typeof req.rawBody === 'string' ? req.rawBody : req.rawBody.toString('utf8'));
    }
    if (typeof req.body === 'string') {
      return resolve(req.body);
    }
    if (Buffer.isBuffer(req.body)) {
      return resolve(req.body.toString('utf8'));
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length > 0) {
        resolve(Buffer.concat(chunks).toString('utf8'));
      } else if (req.body && typeof req.body === 'object') {
        resolve(JSON.stringify(req.body));
      } else {
        resolve('');
      }
    });
    req.on('error', reject);
  });
}

/**
 * Verify Razorpay HMAC SHA-256 signature using constant-time comparison
 */
function verifySignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('[Razorpay Webhook] Signature verification error:', err);
    return false;
  }
}

/**
 * Get configured Supabase client settings
 */
function getSupabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://vsoannpuvffvaywqacot.supabase.co'
  ).replace(/\/$/, '');

  // Prefer Service Role Key to bypass RLS for trusted webhook updates
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzb2FubnB1dmZmdmF5d3FhY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjkyMDcsImV4cCI6MjEwNTI0NTIwN30.ccYPpHvpOBdM-JL2hHnS1DV6WucfVlaGHlHLulLEklU';

  const isServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);

  return { url, key, isServiceRole };
}

/**
 * Look up order in Supabase by order_number or order ID
 */
async function findOrder(orderIdentifier) {
  if (!orderIdentifier) return null;
  const { url, key } = getSupabaseConfig();
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Try search by order_number (e.g. "MB-1234")
    const numRes = await fetch(`${url}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderIdentifier)}&select=*`, { headers });
    if (numRes.ok) {
      const rows = await numRes.json();
      if (Array.isArray(rows) && rows.length > 0) return rows[0];
    }

    // 2. Try search by UUID if identifier looks like UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdentifier)) {
      const idRes = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderIdentifier)}&select=*`, { headers });
      if (idRes.ok) {
        const rows = await idRes.json();
        if (Array.isArray(rows) && rows.length > 0) return rows[0];
      }
    }
  } catch (err) {
    console.warn(`[Razorpay Webhook] Order search error for "${orderIdentifier}":`, err.message);
  }

  return null;
}

/**
 * Update order record in Supabase
 */
async function updateOrder(orderId, updates) {
  const { url, key } = getSupabaseConfig();
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase PATCH failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

// Disable automatic body parsing on Vercel to preserve raw stream for HMAC verification
module.exports.config = {
  api: {
    bodyParser: false
  }
};

/**
 * Main Webhook Handler
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature, X-Razorpay-Event-Id');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  cleanExpiredEvents();

  // 1. Retrieve Raw Body
  let rawBody = '';
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('[Razorpay Webhook] Error reading raw body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  if (!rawBody || rawBody.trim() === '') {
    return res.status(400).json({ error: 'Empty request body' });
  }

  // 2. Parse Event Payload
  let eventPayload = null;
  try {
    eventPayload = JSON.parse(rawBody);
  } catch (err) {
    console.error('[Razorpay Webhook] Invalid JSON payload:', err.message);
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  const eventName = eventPayload.event;
  const signature = req.headers['x-razorpay-signature'] || req.headers['x-razorpay-signature'.toLowerCase()];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.VITE_RAZORPAY_WEBHOOK_SECRET;

  console.log(`[Razorpay Webhook] Received event: "${eventName}" | Signature present: ${Boolean(signature)} | Secret configured: ${Boolean(secret)}`);

  // 3. Verify Signature if Secret is Configured
  if (secret) {
    if (!signature) {
      console.warn('[Razorpay Webhook] Missing X-Razorpay-Signature header while secret is configured');
      return res.status(400).json({ error: 'Missing X-Razorpay-Signature header' });
    }
    const isValid = verifySignature(rawBody, signature, secret);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  } else {
    // Secret not configured: log prominent notice for administrator
    console.warn('[Razorpay Webhook] NOTICE: RAZORPAY_WEBHOOK_SECRET is not configured in Vercel environment variables. Signature verification skipped.');
  }

  // 4. Idempotency Check (Deduplication)
  const eventId =
    req.headers['x-razorpay-event-id'] ||
    eventPayload.id ||
    eventPayload.event_id ||
    (eventPayload.payload?.payment?.entity?.id ? `${eventName}_${eventPayload.payload.payment.entity.id}` : null);

  if (eventId && processedEvents.has(eventId)) {
    console.log(`[Razorpay Webhook] Idempotent duplicate detected for eventId "${eventId}". Returning 200 OK.`);
    return res.status(200).json({
      success: true,
      idempotent: true,
      message: 'Event already processed'
    });
  }

  // 5. Handle Specific Razorpay Events
  try {
    const payment = eventPayload.payload?.payment?.entity;
    const orderEntity = eventPayload.payload?.order?.entity;

    // Identify target order
    const orderNumberCandidate =
      payment?.notes?.order_number ||
      payment?.notes?.orderNumber ||
      orderEntity?.receipt ||
      orderEntity?.notes?.order_number ||
      orderEntity?.notes?.orderNumber ||
      (payment?.description && payment.description.match(/MB-\d+/)?.[0]) ||
      payment?.order_id ||
      null;

    console.log(`[Razorpay Webhook] Resolved order identifier: "${orderNumberCandidate}"`);

    let matchedOrder = null;
    if (orderNumberCandidate) {
      matchedOrder = await findOrder(orderNumberCandidate);
    }

    switch (eventName) {
      case 'payment.captured': {
        const paymentId = payment?.id || 'unknown';
        const amountFormatted = payment?.amount ? `₹${(payment.amount / 100).toLocaleString('en-IN')}` : 'amount unrecorded';

        if (matchedOrder) {
          // Idempotency: If already paid, do not overwrite or duplicate
          if (matchedOrder.payment_status === 'PAID') {
            console.log(`[Razorpay Webhook] Order ${matchedOrder.order_number} is already marked as PAID.`);
            if (eventId) processedEvents.set(eventId, Date.now());
            return res.status(200).json({
              success: true,
              idempotent: true,
              order_number: matchedOrder.order_number,
              message: 'Order already marked as PAID'
            });
          }

          const existingNotes = matchedOrder.notes || '';
          const captureNote = `[Razorpay Captured] ID: ${paymentId} | Amount: ${amountFormatted} | Method: ${payment?.method || 'Online'} | Time: ${new Date().toISOString()}`;
          const newNotes = existingNotes ? `${existingNotes}\n${captureNote}` : captureNote;

          await updateOrder(matchedOrder.id, {
            payment_status: 'PAID',
            order_status: matchedOrder.order_status === 'PENDING' ? 'PROCESSING' : matchedOrder.order_status,
            payment_method: 'RAZORPAY',
            notes: newNotes,
            updated_at: new Date().toISOString()
          });

          console.log(`[Razorpay Webhook] Successfully updated order ${matchedOrder.order_number} to PAID/PROCESSING.`);
        } else {
          console.warn(`[Razorpay Webhook] No matching database order found for "${orderNumberCandidate}".`);
        }

        if (eventId) processedEvents.set(eventId, Date.now());
        return res.status(200).json({
          success: true,
          event: eventName,
          order_number: orderNumberCandidate,
          matched: Boolean(matchedOrder)
        });
      }

      case 'order.paid': {
        const orderId = orderEntity?.id || payment?.order_id || 'unknown';

        if (matchedOrder) {
          if (matchedOrder.payment_status === 'PAID') {
            console.log(`[Razorpay Webhook] Order ${matchedOrder.order_number} is already marked as PAID.`);
            if (eventId) processedEvents.set(eventId, Date.now());
            return res.status(200).json({
              success: true,
              idempotent: true,
              order_number: matchedOrder.order_number,
              message: 'Order already marked as PAID'
            });
          }

          const existingNotes = matchedOrder.notes || '';
          const orderNote = `[Razorpay Order Paid] Order ID: ${orderId} | Time: ${new Date().toISOString()}`;
          const newNotes = existingNotes ? `${existingNotes}\n${orderNote}` : orderNote;

          await updateOrder(matchedOrder.id, {
            payment_status: 'PAID',
            order_status: matchedOrder.order_status === 'PENDING' ? 'PROCESSING' : matchedOrder.order_status,
            payment_method: 'RAZORPAY',
            notes: newNotes,
            updated_at: new Date().toISOString()
          });

          console.log(`[Razorpay Webhook] Successfully updated order ${matchedOrder.order_number} to PAID via order.paid.`);
        }

        if (eventId) processedEvents.set(eventId, Date.now());
        return res.status(200).json({
          success: true,
          event: eventName,
          order_number: orderNumberCandidate,
          matched: Boolean(matchedOrder)
        });
      }

      case 'payment.failed': {
        const paymentId = payment?.id || 'unknown';
        const failureReason = payment?.error_description || payment?.error_reason || payment?.error_code || 'Payment declined by bank';

        if (matchedOrder) {
          // Do not downgrade an already PAID order
          if (matchedOrder.payment_status !== 'PAID') {
            const existingNotes = matchedOrder.notes || '';
            const failNote = `[Razorpay Failed] ID: ${paymentId} | Reason: ${failureReason} | Time: ${new Date().toISOString()}`;
            const newNotes = existingNotes ? `${existingNotes}\n${failNote}` : failNote;

            await updateOrder(matchedOrder.id, {
              payment_status: 'FAILED',
              notes: newNotes,
              updated_at: new Date().toISOString()
            });

            console.log(`[Razorpay Webhook] Marked order ${matchedOrder.order_number} payment as FAILED.`);
          }
        }

        if (eventId) processedEvents.set(eventId, Date.now());
        return res.status(200).json({
          success: true,
          event: eventName,
          order_number: orderNumberCandidate,
          failure_reason: failureReason
        });
      }

      default: {
        // Acknowledge unhandled events (e.g. payment.authorized, refund.created) with 200 OK so Razorpay doesn't retry
        console.log(`[Razorpay Webhook] Received unhandled event "${eventName}". Acknowledged cleanly.`);
        if (eventId) processedEvents.set(eventId, Date.now());
        return res.status(200).json({
          success: true,
          event: eventName,
          status: 'acknowledged_ignored'
        });
      }
    }
  } catch (err) {
    console.error(`[Razorpay Webhook] Processing error for event "${eventName}":`, err);
    // Return 500 so Razorpay retries if an unexpected error occurs
    return res.status(500).json({
      error: 'Internal webhook processing error',
      details: err.message
    });
  }
};
