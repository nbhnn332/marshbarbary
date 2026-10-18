/**
 * Vercel Serverless Function: /api/instagram
 * Fetches live public posts from https://www.instagram.com/marshbarbary/
 */

const https = require('https');

// Fallback real posts snapshot directly from @marshbarbary
let SNAPSHOT_POSTS = [];
try {
  SNAPSHOT_POSTS = require('../data/marshbarbary-posts.json');
} catch (e) {
  try { SNAPSHOT_POSTS = require('./data/marshbarbary-posts.json'); } catch (_) {}
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const liveHtml = await fetchInstagramHtml();
    const livePosts = parseInstagramPosts(liveHtml);
    if (livePosts && livePosts.length > 0) {
      return res.status(200).json({
        success: true,
        source: 'live_instagram',
        count: livePosts.length,
        posts: livePosts
      });
    }
  } catch (err) {
    console.warn('[API /api/instagram] Live fetch error:', err.message);
  }

  // Fallback to recent authentic snapshot of @marshbarbary
  return res.status(200).json({
    success: true,
    source: 'snapshot_marshbarbary',
    count: SNAPSHOT_POSTS.length,
    posts: SNAPSHOT_POSTS
  });
};

function fetchInstagramHtml() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.instagram.com',
      path: '/marshbarbary/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Instagram request timed out'));
    });
    req.end();
  });
}

function parseInstagramPosts(html) {
  if (!html) return [];
  const scriptRegex = /<script\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('polaris_timeline_connection') || content.includes('CAROUSEL_ITEM')) {
      try {
        const obj = JSON.parse(content);
        const edges = findTimelineEdges(obj);
        if (edges && edges.length > 0) {
          return edges.map((e, idx) => {
            const node = e.node || e;
            let img = node.display_uri;
            if (!img && node.image_versions2?.candidates?.length) {
              const sorted = [...node.image_versions2.candidates].sort((a, b) => (b.width || 0) - (a.width || 0));
              img = sorted[0].url;
            }
            const carouselImages = [];
            if (node.carousel_media?.length) {
              node.carousel_media.forEach(cm => {
                let cmUrl = cm.display_uri;
                if (!cmUrl && cm.image_versions2?.candidates?.length) {
                  const sorted = [...cm.image_versions2.candidates].sort((a, b) => (b.width || 0) - (a.width || 0));
                  cmUrl = sorted[0].url;
                }
                if (cmUrl) carouselImages.push(cmUrl);
              });
            }
            return {
              id: `ig-live-${node.pk || node.id || idx + 1}`,
              pk: node.pk,
              url: node.seo_canonical_url || `https://www.instagram.com/p/${node.code || node.pk}/`,
              img: img || carouselImages[0] || '',
              carouselImages,
              caption: (node.caption?.text || '').replace(/\n+/g, ' ').trim(),
              active: true
            };
          });
        }
      } catch (err) {}
    }
  }
  return [];
}

function findTimelineEdges(obj) {
  let found = null;
  function walk(node) {
    if (!node || typeof node !== 'object' || found) return;
    if (node.polaris_timeline_connection && Array.isArray(node.polaris_timeline_connection.edges)) {
      found = node.polaris_timeline_connection.edges;
      return;
    }
    if (Array.isArray(node)) {
      for (const el of node) walk(el);
    } else {
      for (const k of Object.keys(node)) walk(node[k]);
    }
  }
  walk(obj);
  return found;
}
