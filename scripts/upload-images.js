require('dotenv').config();
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const https = require('https');

class ImageUploader {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_CONTAINER_NAME || 'clothing-images';
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
  }

  async uploadFromBuffer(buffer, fileName, mimeType = 'image/jpeg') {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({});

      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimeType
        }
      });

      console.log(`✅ Uploaded: ${fileName}`);
      console.log(`📸 URL: ${blockBlobClient.url}`);
      return blockBlobClient.url;
    } catch (error) {
      console.error(`❌ Error uploading ${fileName}:`, error.message);
      throw error;
    }
  }

  async uploadFromFile(filePath, blobName) {
    try {
      const buffer = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(filePath);
      return await this.uploadFromBuffer(buffer, blobName, mimeType);
    } catch (error) {
      console.error(`❌ Error uploading file ${filePath}:`, error.message);
      throw error;
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}

async function main() {
  console.log('🚀 Starting image upload to Azure Blob Storage...\n');
  
  const uploader = new ImageUploader();
  const uploadsDir = path.join(__dirname, '..', 'temp-images');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const imageUrls = {};

  try {
    // List of images to upload from temp-images directory
    const imagesToUpload = [
      { file: 'hero-1.jpg', blob: 'hero-1.jpg' },
      { file: 'hero-2.jpg', blob: 'hero-2.jpg' },
      { file: 'hero-3.jpg', blob: 'hero-3.jpg' },
      { file: 'category-tops.jpg', blob: 'category-tops.jpg' },
      { file: 'category-dresses.jpg', blob: 'category-dresses.jpg' },
      { file: 'category-shoes.jpg', blob: 'category-shoes.jpg' },
      { file: 'category-accessories.jpg', blob: 'category-accessories.jpg' }
    ];

    for (const { file, blob } of imagesToUpload) {
      const filePath = path.join(uploadsDir, file);
      if (fs.existsSync(filePath)) {
        const url = await uploader.uploadFromFile(filePath, blob);
        imageUrls[blob] = url;
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }

    console.log('\n📋 Upload Summary:');
    console.log('==================');
    Object.entries(imageUrls).forEach(([name, url]) => {
      console.log(`${name}: ${url}`);
    });

    // Update the image URLs in a config file
    const configPath = path.join(__dirname, '..', 'config', 'images.json');
    fs.writeFileSync(configPath, JSON.stringify(imageUrls, null, 2));
    console.log(`\n💾 Image URLs saved to: ${configPath}`);

  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ImageUploader;