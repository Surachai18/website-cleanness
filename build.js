const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const htmlPages = [
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
const rootFiles = [
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest'
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function emptyDir(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
    return;
  }

  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

function normalizeHtml(htmlContent) {
  return htmlContent
    .replace(/\.\/dist\/style\.css/g, './style.css')
    .replace(/src=(["'])src\//g, 'src=$1/src/');
}

console.log('Cleaning dist folder...');
emptyDir(distPath);

for (const name of htmlPages) {
  const srcPath = path.join(__dirname, name);
  if (!fs.existsSync(srcPath)) continue;
  console.log('Copying ' + name + '...');
  const htmlContent = normalizeHtml(fs.readFileSync(srcPath, 'utf8'));
  fs.writeFileSync(path.join(distPath, name), htmlContent, 'utf8');
}

console.log('Copying style.css...');
fs.copyFileSync(
  path.join(__dirname, 'style.css'),
  path.join(distPath, 'style.css')
);

const gscFiles = fs.readdirSync(__dirname).filter((name) =>
  /^google[a-z0-9]+\.html$/.test(name)
);
for (const file of gscFiles) {
  fs.copyFileSync(
    path.join(__dirname, file),
    path.join(distPath, file)
  );
}

for (const file of rootFiles) {
  const srcPath = path.join(__dirname, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(distPath, file));
  }
}

console.log('Copying src folder...');
copyDir(
  path.join(__dirname, 'src'),
  path.join(distPath, 'src')
);

console.log('Build complete! All files are in the dist folder.');
console.log('You can now deploy the entire dist folder.');
