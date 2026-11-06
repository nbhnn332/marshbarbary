#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Run build first
try {
  require('./build.js');
} catch (e) {
  console.warn('[Dev Server] Pre-build warning:', e.message);
}

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveFilePath(reqPath) {
  let decodedPath = decodeURIComponent(reqPath.split('?')[0]);
  if (decodedPath === '/') decodedPath = '/index.html';

  let filePath = path.join(ROOT, decodedPath);

  // If path is a directory, look for index.html inside
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  // If exact file exists, return it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  // cleanUrls support: try adding .html extension
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  // cleanUrls support: try path/index.html
  const subIndexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(subIndexPath) && fs.statSync(subIndexPath).isFile()) {
    return subIndexPath;
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle serverless API routes under /api/
  if (pathname.startsWith('/api/')) {
    const routeName = pathname.replace(/^\/api\//, '').split('/')[0];
    const apiFile = path.join(ROOT, 'api', `${routeName}.js`);

    if (fs.existsSync(apiFile)) {
      try {
        delete require.cache[require.resolve(apiFile)];
        const handler = require(apiFile);
        return await handler(req, res);
      } catch (apiErr) {
        console.error(`[API Error] ${pathname}:`, apiErr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Internal API Server Error', details: apiErr.message }));
      }
    }
  }

  const filePath = resolveFilePath(pathname);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 Not Found — Marsh Barbary</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 60px;">
        <h1 style="font-size: 32px; color: #1F1916;">404 — Page Not Found</h1>
        <p style="color: #6E6259;">The requested URL <code>${escapeHtml(pathname)}</code> does not exist.</p>
        <p><a href="/" style="color: #A36B4F; text-decoration: none;">&larr; Return to Marsh Barbary Home</a></p>
      </body>
      </html>
    `);
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error: ' + err.message);
  }
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('  MARSH BARBARY — LOCAL DEVELOPMENT SERVER ACTIVE');
  console.log('======================================================');
  console.log(`  > Storefront:  http://localhost:${PORT}/`);
  console.log(`  > Shop:        http://localhost:${PORT}/shop`);
  console.log(`  > Account:     http://localhost:${PORT}/account`);
  console.log(`  > Admin Panel: http://localhost:${PORT}/admin`);
  console.log('======================================================\n');
});

// Graceful termination
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
