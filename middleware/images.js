const fs = require('fs');
const path = require('path');

class ImageService {
  constructor() {
    this.imageUrls = {};
    this.loadImageConfig();
  }

  loadImageConfig() {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'images.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        this.imageUrls = JSON.parse(configData);
        console.log('✅ Image URLs loaded from config');
      } else {
        console.log('⚠️  No image config found, using local images');
        this.imageUrls = {};
      }
    } catch (error) {
      console.error('❌ Error loading image config:', error.message);
      this.imageUrls = {};
    }
  }

  getImageUrl(imageName) {
    // Return Azure URL if available, otherwise fallback to local path
    return this.imageUrls[imageName] || `/images/${imageName}`;
  }

  getAllImageUrls() {
    return this.imageUrls;
  }

  // Helper function to get image URL with fallback
  getImageUrlWithFallback(imageName, fallbackPath = null) {
    if (this.imageUrls[imageName]) {
      return this.imageUrls[imageName];
    }
    return fallbackPath || `/images/${imageName}`;
  }
}

const imageService = new ImageService();

// Middleware to add image service to res.locals
function imageMiddleware(req, res, next) {
  // Make image service available to all templates
  res.locals.getImageUrl = (imageName) => imageService.getImageUrl(imageName);
  res.locals.images = imageService.getAllImageUrls();
  next();
}

module.exports = {
  imageMiddleware,
  imageService
};