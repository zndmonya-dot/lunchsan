// SVGからPNGアイコンを生成するスクリプト
// 使用: node scripts/generate-icons.js
// 必要なパッケージ: sharp (npm install sharp)

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../app/icon.svg');
const publicDir = path.join(__dirname, '../public');

// SVGファイルを読み込む
const svgBuffer = fs.readFileSync(svgPath);

// 各サイズのPNGを生成
const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }
  
  // favicon.icoも生成（32x32）
  const faviconPath = path.join(__dirname, '../app/favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log(`Generated favicon placeholder: ${faviconPath.replace('.ico', '.png')}`);
  console.log('Note: Convert PNG to ICO format using an online tool if needed');
}

generateIcons().catch(console.error);

