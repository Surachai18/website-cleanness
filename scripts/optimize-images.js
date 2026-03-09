/**
 * Compress and resize images in src/ for faster web loading.
 * Run: node scripts/optimize-images.js
 * Requires: npm install sharp (devDependency)
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp... Run: npm install --save-dev sharp');
  process.exit(1);
}

const SRC = path.join(__dirname, '..', 'src');
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 82;

function getAllImages(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      getAllImages(full, list);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(e.name)) {
      list.push(full);
    }
  }
  return list;
}

async function optimize(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const isPng = ext === '.png';
  const stat = fs.statSync(filePath);
  const sizeBefore = (stat.size / 1024).toFixed(1);

  try {
    let pipeline = sharp(filePath);
    const meta = await pipeline.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    const needResize = w > MAX_WIDTH || h > MAX_HEIGHT;

    if (needResize) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true });
    }

    if (isPng) {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else {
      pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    }

    const buf = await pipeline.toBuffer();
    const sizeAfter = (buf.length / 1024).toFixed(1);
    const saved = ((1 - buf.length / stat.size) * 100).toFixed(0);

    fs.writeFileSync(filePath, buf);
    console.log(path.relative(SRC, filePath) + ': ' + sizeBefore + ' KB -> ' + sizeAfter + ' KB (-' + saved + '%)');
    return { sizeBefore: stat.size, sizeAfter: buf.length };
  } catch (err) {
    console.error('Error:', filePath, err.message);
    return null;
  }
}

async function main() {
  const files = getAllImages(SRC);
  console.log('Optimizing ' + files.length + ' images (max ' + MAX_WIDTH + 'px, JPEG quality ' + JPEG_QUALITY + ')...\n');

  let totalBefore = 0, totalAfter = 0;
  for (const f of files) {
    const r = await optimize(f);
    if (r) {
      totalBefore += r.sizeBefore;
      totalAfter += r.sizeAfter;
    }
  }

  const saved = ((1 - totalAfter / totalBefore) * 100).toFixed(0);
  console.log('\nTotal: ' + (totalBefore / 1024 / 1024).toFixed(2) + ' MB -> ' + (totalAfter / 1024 / 1024).toFixed(2) + ' MB (-' + saved + '%)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
