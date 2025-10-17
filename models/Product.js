// In-memory product storage
let products = [];
let productIdCounter = 1;

class Product {
  constructor(productData) {
    this._id = productIdCounter++;
    this.title = productData.title;
    this.description = productData.description;
    this.price = productData.price;
    this.originalPrice = productData.originalPrice;
    this.category = productData.category;
    this.subcategory = productData.subcategory;
    this.brand = productData.brand;
    this.size = productData.size;
    this.condition = productData.condition;
    this.color = productData.color;
    this.material = productData.material;
    this.images = productData.images || [];
    this.seller = productData.seller;
    this.status = productData.status || 'available';
    this.measurements = productData.measurements || {};
    this.tags = productData.tags || [];
    this.likes = [];
    this.views = 0;
    this.featured = false;
    this.negotiable = productData.negotiable || true;
    this.shippingOptions = productData.shippingOptions || {
      freeShipping: false,
      shippingCost: 0,
      expeditedAvailable: false
    };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  async save() {
    this.updatedAt = new Date();
    
    const existingIndex = products.findIndex(p => p._id === this._id);
    if (existingIndex >= 0) {
      products[existingIndex] = this;
    } else {
      products.push(this);
    }
    return this;
  }

  async populate(field, select) {
    // Simple populate implementation
    if (field === 'seller') {
      const User = require('./User');
      const seller = await User.findById(this.seller);
      if (seller) {
        this.seller = seller;
      }
    }
    return this;
  }

  // Static methods
  static async find(query = {}) {
    let filtered = products.filter(product => {
      // Simple query matching
      return Object.keys(query).every(key => {
        if (key === '$text') {
          const searchTerm = query[key].$search.toLowerCase();
          return product.title.toLowerCase().includes(searchTerm) ||
                 product.description.toLowerCase().includes(searchTerm) ||
                 (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
                 product.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        }
        if (key === 'price' && typeof query[key] === 'object') {
          const priceQuery = query[key];
          if (priceQuery.$gte && product.price < priceQuery.$gte) return false;
          if (priceQuery.$lte && product.price > priceQuery.$lte) return false;
          return true;
        }
        if (typeof query[key] === 'object' && query[key].constructor.name === 'RegExp') {
          return query[key].test(product[key]);
        }
        return product[key] === query[key];
      });
    });

    return filtered;
  }

  static async findById(id) {
    return products.find(product => product._id == id) || null;
  }

  static async findByIdAndDelete(id) {
    const index = products.findIndex(product => product._id == id);
    if (index >= 0) {
      const deleted = products[index];
      products.splice(index, 1);
      return deleted;
    }
    return null;
  }

  static async countDocuments(query = {}) {
    return products.filter(product => {
      return Object.keys(query).every(key => product[key] === query[key]);
    }).length;
  }
}

module.exports = Product;
