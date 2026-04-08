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

const htmlFiles = [
  'index.html',
  'about-cleanness.html',
  'services.html',
  'service-big-cleaning.html',
  'service-general-cleaning-6-steps.html',
  'service-floor-scrubbing-polishing.html',
  'service-glass-wiping.html',
  'service-bathroom-cleaning.html',
  'service-kitchen-cleaning.html',
  'service-mattress-sofa-dust-mite.html',
  'service-disinfection-deodorizing.html',
  'service-pressure-washing.html',
  'why-choose-us.html',
  'portfolio.html',
  'reviews.html',
  'faq.html',
  'contact.html'
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

function logIssues(items, logger) {
  for (const item of items) {
    logger(`- ${item}`);
  }
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

for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(distPath, htmlFile);
  if (!fs.existsSync(htmlPath)) {
    errors.push(`Missing HTML page in dist: ${htmlFile}`);
    continue;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  if (html.includes('./dist/style.css')) {
    errors.push(`${htmlFile} still points to ./dist/style.css. It must point to ./style.css in dist build.`);
  }

  if (!html.includes('./style.css')) {
    warnings.push(`Could not find ./style.css in dist/${htmlFile}.`);
  }

  const srcMatches = [...html.matchAll(/\ssrc=["']([^"']+)["']/g)].map((m) => decodeHtmlAttr(m[1]));
  const imageSrc = srcMatches.filter((p) => p.startsWith('/src/') || p.startsWith('src/'));

  let missingImageCount = 0;
  for (const img of imageSrc) {
    const normalized = img.startsWith('/') ? img.slice(1) : img;
    if (!exists(normalized)) {
      missingImageCount += 1;
      if (missingImageCount <= 10) {
        errors.push(`Missing image referenced by dist/${htmlFile}: ${img}`);
      }
    }
  }

  if (missingImageCount > 10) {
    errors.push(`dist/${htmlFile} has ${missingImageCount} missing images. Showing first 10 only.`);
  }

  const relativeSrcPaths = imageSrc.filter((p) => p.startsWith('src/'));
  if (relativeSrcPaths.length > 0) {
    warnings.push(`Found ${relativeSrcPaths.length} relative image path(s) in dist/${htmlFile}. Prefer /src/...`);
  }
}

console.log('\nSummary');
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) logIssues(errors, console.error);
if (warnings.length > 0) logIssues(warnings, console.warn);

if (errors.length > 0) {
  process.exit(1);
}

console.log('Build check passed.');
