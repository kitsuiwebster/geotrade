const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './src/assets/images/cards';
const outputDir = './src/assets/images/cards/thumbnails';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function optimizeImages(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'thumbnails') {
      const relativeDir = path.relative(inputDir, fullPath);
      const thumbnailDir = path.join(outputDir, relativeDir);
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      optimizeImages(fullPath);
    } else if (item.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
      const relativeFile = path.relative(inputDir, fullPath);
      const outputPath = path.join(outputDir, relativeFile);
      const outputName = path.parse(outputPath).name + '.webp';
      const finalOutputPath = path.join(path.dirname(outputPath), outputName);
      
      sharp(fullPath)
        .resize(120, 80, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .webp({ quality: 30, effort: 6 })
        .toFile(finalOutputPath)
        .then(() => {
          console.log(`✓ Optimized: ${relativeFile} -> ${path.relative('.', finalOutputPath)}`);
        })
        .catch(err => {
          console.error(`✗ Error optimizing ${relativeFile}:`, err.message);
        });
    }
  });
}

console.log('🔄 Starting ultra-fast image optimization...');
optimizeImages(inputDir);
console.log('✅ Ultra-fast optimization completed!');