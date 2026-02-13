const fs = require('fs');
const path = require('path');

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

console.log('Cleaning dist folder...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  for (const file of files) {
    const filePath = path.join(distPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }
}

console.log('Copying index.html...');
let htmlContent = fs.readFileSync(
  path.join(__dirname, 'index.html'),
  'utf8'
);
htmlContent = htmlContent.replace(/\.\/dist\/style\.css/g, './style.css');
htmlContent = htmlContent.replace(/src=["']src\//g, (match) => {
  return match.replace('src/', '/src/');
});
fs.writeFileSync(
  path.join(distPath, 'index.html'),
  htmlContent,
  'utf8'
);

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
