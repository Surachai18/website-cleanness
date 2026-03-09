const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const errors = [];
const warnings = [];

const requiredFiles = [
  'index.html',
  'style.css',
  'src/assets/logo.png',
  'src/qrcode.png'
];

function exists(relPath) {
  return fs.existsSync(path.join(distPath, relPath));
}

function decodeHtmlAttr(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

console.log('Checking dist build...');

if (!fs.existsSync(distPath)) {
  console.error('ERROR: dist folder does not exist. Run `npm run build` first.');
  process.exit(1);
}

console.log('Validating required files:');
for (const file of requiredFiles) {
  if (exists(file)) {
    console.log(`  OK   ${file}`);
  } else {
    errors.push(`Missing required file: ${file}`);
    console.log(`  FAIL ${file}`);
  }
}

const htmlPath = path.join(distPath, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  if (html.includes('./dist/style.css')) {
    errors.push('index.html still points to ./dist/style.css. It must point to ./style.css in dist build.');
  }

  if (!html.includes('./style.css')) {
    warnings.push('Could not find ./style.css in dist/index.html.');
  }

  const srcMatches = [...html.matchAll(/\ssrc=["']([^"']+)["']/g)].map((m) => decodeHtmlAttr(m[1]));
  const imageSrc = srcMatches.filter((p) => p.startsWith('/src/') || p.startsWith('src/'));

  let missingImageCount = 0;
  for (const img of imageSrc) {
    const normalized = img.startsWith('/') ? img.slice(1) : img;
    if (!exists(normalized)) {
      missingImageCount += 1;
      if (missingImageCount <= 10) {
        errors.push(`Missing image referenced by dist/index.html: ${img}`);
      }
    }
  }

  if (missingImageCount > 10) {
    errors.push(`...and ${missingImageCount - 10} more missing images.`);
  }

  const relativeSrcPaths = imageSrc.filter((p) => p.startsWith('src/'));
  if (relativeSrcPaths.length > 0) {
    warnings.push(`Found ${relativeSrcPaths.length} relative image path(s) in dist/index.html. Prefer /src/...`);
  }
}

console.log('\nSummary');
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  for (const e of errors) {
    console.error(`- ${e}`);
  }
}

if (warnings.length > 0) {
  for (const w of warnings) {
    console.warn(`- ${w}`);
  }
}

if (errors.length > 0) {
  process.exit(1);
}

console.log('Build check passed.');
