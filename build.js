const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
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

console.log(`--- MARSH BARBARY BUILD: Complete! ${dirsToCopy.length} directories processed, ${copiedFilesCount} root files copied. ---`);
