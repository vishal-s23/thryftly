require('dotenv').config();
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

class DemoImageSetup {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_CONTAINER_NAME || 'clothing-images';
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
  }

  async createDemoContainer() {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists({});
      console.log('✅ Container created/verified:', this.containerName);
      return containerClient;
    } catch (error) {
      console.error('❌ Error creating container:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔗 Testing Azure connection...');
      const containerClient = await this.createDemoContainer();
      
      // Test by listing existing blobs
      console.log('📋 Existing images in container:');
      for await (const blob of containerClient.listBlobsFlat()) {
        console.log(`  - ${blob.name}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }

  // Generate placeholder URLs for demo purposes
  generateDemoImageConfig() {
    const baseUrl = `https://thriftstorage.blob.core.windows.net/${this.containerName}`;
    
    return {
      'hero-1.jpg': `${baseUrl}/hero-1.jpg`,
      'hero-2.jpg': `${baseUrl}/hero-2.jpg`, 
      'hero-3.jpg': `${baseUrl}/hero-3.jpg`,
      'category-tops.jpg': `${baseUrl}/category-tops.jpg`,
      'category-dresses.jpg': `${baseUrl}/category-dresses.jpg`,
      'category-shoes.jpg': `${baseUrl}/category-shoes.jpg`,
      'category-accessories.jpg': `${baseUrl}/category-accessories.jpg`
    };
  }
}

async function main() {
  console.log('🚀 Setting up demo images for Thriftly...\n');
  
  const setup = new DemoImageSetup();
  
  try {
    // Test the connection first
    const connected = await setup.testConnection();
    
    if (connected) {
      console.log('\n✅ Azure Blob Storage connection successful!');
      
      // Generate image config
      const imageConfig = setup.generateDemoImageConfig();
      
      // Save the config
      const configPath = path.join(__dirname, '..', 'config', 'images.json');
      fs.writeFileSync(configPath, JSON.stringify(imageConfig, null, 2));
      
      console.log('\n📋 Demo Image URLs:');
      console.log('===================');
      Object.entries(imageConfig).forEach(([name, url]) => {
        console.log(`${name}: ${url}`);
      });
      
      console.log(`\n💾 Configuration saved to: ${configPath}`);
      console.log('\n📝 Next steps:');
      console.log('1. Place your image files in the temp-images/ directory');
      console.log('2. Run: node scripts/upload-images.js');
      console.log('3. The images will be uploaded and URLs updated automatically');
      
    } else {
      console.log('❌ Please check your Azure connection string and try again.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DemoImageSetup;