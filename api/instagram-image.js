/**
 * Vercel Serverless Function: /api/instagram-image
 * Proxies Instagram images without CORS restrictions or expired signature issues.
 */

function idToShortcode(idStr) {
  if (!idStr) return '';
  if (/^[A-Za-z0-9_-]+$/.test(idStr) && !/^\d{10,}$/.test(idStr)) return idStr;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  try {
    let id = BigInt(idStr);
    let shortcode = '';
    while (id > 0n) {
      const remainder = Number(id % 64n);
      shortcode = chars[remainder] + shortcode;
      id = id / 64n;
    }
    return shortcode;
  } catch (e) {
    return idStr;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, id, pk, url } = req.query || {};
  let targetCode = code || pk;
  if (!targetCode && id) {
    targetCode = idToShortcode(id);
  }
  if (!targetCode && url) {
    const m = url.match(/\/p\/([^\/\?]+)/);
    if (m) targetCode = m[1];
  }
  if (targetCode && /^\d+$/.test(targetCode)) {
    targetCode = idToShortcode(targetCode);
  }

  if (!targetCode) {
    return res.status(400).json({ error: 'Missing code or url parameter' });
  }

  try {
    const mediaUrl = `https://www.instagram.com/p/${targetCode}/media/?size=l`;
    const clientReq = await fetch(mediaUrl, { redirect: 'follow' });
    if (!clientReq.ok) {
      return res.status(clientReq.status).json({ error: 'Instagram media fetch failed' });
    }

    const contentType = clientReq.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await clientReq.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[API /api/instagram-image] Error:', err);
    return res.status(500).json({ error: 'Internal server error proxying image' });
  }
};
