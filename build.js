#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Resolve true project root regardless of whether build.js is executed directly or via node_modules/.bin/vite
let rootDir = __dirname;
while (rootDir && rootDir !== path.dirname(rootDir)) {
  if (fs.existsSync(path.join(rootDir, 'index.html'))) {
    break;
  }
  rootDir = path.dirname(rootDir);
}
if (!fs.existsSync(path.join(rootDir, 'index.html'))) {
  rootDir = process.cwd();
}
const distDir = path.join(rootDir, 'dist');

console.log('--- MARSH BARBARY BUILD: Generating Static Distribution ---');

// 1. Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Directories to copy
const dirsToCopy = [
  'admin',
  'account',
  'cart',
  'components',
  'css',
  'js',
  'assets',
  'design',
  'supabase'
];

for (const dir of dirsToCopy) {
  const src = path.join(rootDir, dir);
  const dest = path.join(distDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`[DIR] Copied: ${dir} -> dist/${dir}`);
  }
}

// 3. HTML and static asset files in root
const files = fs.readdirSync(rootDir);
let copiedFilesCount = 0;

for (const file of files) {
  const fullPath = path.join(rootDir, file);
  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    const ext = path.extname(file).toLowerCase();

    // Copy all HTML files and root images/icons
    if (ext === '.html' || ext === '.ico' || ext === '.svg' || ext === '.webmanifest') {
      fs.copyFileSync(fullPath, path.join(distDir, file));
      console.log(`[FILE] Copied: ${file} -> dist/${file}`);
      copiedFilesCount++;
    }
  } catch (err) {
    console.warn(`Warning inspecting ${file}:`, err.message);
  }
}

// 4. Copy deployment configuration files for Vercel & PaaS host compatibility
const deployConfigs = ['package.json', 'package-lock.json', 'vercel.json', 'build.js', 'vite.config.js'];
for (const config of deployConfigs) {
  const src = path.join(rootDir, config);
  const dest = path.join(distDir, config);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`[CONFIG] Copied: ${config} -> dist/${config}`);
  }
}

// 5. Create executable vite shim inside dist/node_modules/.bin and dist/root for Vercel CLI fallback
try {
  const binDir = path.join(distDir, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  
  const viteShimContent = '#!/usr/bin/env node\nrequire("../../build.js");\n';
  const viteShimPath = path.join(binDir, 'vite');
  fs.writeFileSync(viteShimPath, viteShimContent, { mode: 0o755 });
  
  const viteCmdContent = '@node "%~dp0\\..\\..\\build.js" %*\n';
  fs.writeFileSync(path.join(binDir, 'vite.cmd'), viteCmdContent);

  const rootViteShim = '#!/bin/sh\nnode build.js "$@"\n';
  fs.writeFileSync(path.join(distDir, 'vite'), rootViteShim, { mode: 0o755 });
  
  console.log('[SHIM] Created vite fallback runners in dist/node_modules/.bin/vite and dist/vite');
} catch (shimErr) {
  console.warn('Warning creating vite shim:', shimErr.message);
}

console.log(`--- MARSH BARBARY BUILD: Complete! ${dirsToCopy.length} directories processed, ${copiedFilesCount} root files copied. ---`);

