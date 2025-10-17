const bcrypt = require('bcryptjs');

// In-memory user storage
let users = [];
let userIdCounter = 1;

class User {
  constructor(userData) {
    this._id = userIdCounter++;
    this.username = userData.username;
    this.email = userData.email?.toLowerCase();
    this.password = userData.password;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
    this.avatar = userData.avatar || null;
    this.bio = userData.bio || '';
    this.location = userData.location || '';
    this.phone = userData.phone || '';
    this.isVerified = false;
    this.rating = { average: 0, count: 0 };
    this.favorites = [];
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  async save() {
    // Hash password before saving
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Check if user exists
    const existingIndex = users.findIndex(u => u._id === this._id);
    if (existingIndex >= 0) {
      users[existingIndex] = this;
    } else {
      users.push(this);
    }
    return this;
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    const obj = { ...this };
    delete obj.password;
    obj.fullName = this.fullName;
    return obj;
  }

  // Static methods
  static async findOne(query) {
    if (query.$or) {
      return users.find(user => 
        query.$or.some(condition => 
          Object.keys(condition).every(key => user[key] === condition[key])
        )
      ) || null;
    }
    
    return users.find(user => 
      Object.keys(query).every(key => user[key] === query[key])
    ) || null;
  }

  static async findById(id) {
    return users.find(user => user._id == id) || null;
  }
}

module.exports = User;
