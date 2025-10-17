const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample fashion images from Unsplash (free to use)
const sampleImages = {
  'hero-1.jpg': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop',
  'hero-2.jpg': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=600&fit=crop',
  'hero-3.jpg': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop',
  'category-tops.jpg': 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=300&fit=crop',
  'category-dresses.jpg': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop',
  'category-shoes.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
  'category-accessories.jpg': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function createSampleImages() {
  console.log('📸 Creating sample images...\n');
  
  const tempDir = path.join(__dirname, '..', 'temp-images');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const downloadPromises = [];
  
  for (const [filename, url] of Object.entries(sampleImages)) {
    const filepath = path.join(tempDir, filename);
    console.log(`⬇️  Downloading ${filename}...`);
    downloadPromises.push(
      downloadImage(url, filepath)
        .then(() => console.log(`✅ Created: ${filename}`))
        .catch(err => console.error(`❌ Failed to create ${filename}:`, err.message))
    );
  }

  try {
    await Promise.all(downloadPromises);
    console.log('\n🎉 All sample images created successfully!');
    console.log('\n📝 Next step: Run "node scripts/upload-images.js" to upload to Azure');
  } catch (error) {
    console.error('\n❌ Some images failed to download:', error);
  }
}

if (require.main === module) {
  createSampleImages();
}

module.exports = { createSampleImages, sampleImages };