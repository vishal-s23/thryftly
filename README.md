# Thriftly - Sustainable Fashion Marketplace

A modern, sustainable fashion marketplace built with Node.js, Express, and MongoDB. Buy and sell pre-loved clothing items while promoting eco-friendly fashion choices.

## 🌟 Features

- **User Authentication** - Secure registration and login system
- **Product Listings** - Easy-to-use interface for listing fashion items
- **Image Upload** - Azure Blob Storage integration for product images
- **Advanced Search** - Filter by category, size, condition, price, and more
- **User Dashboard** - Manage listings, favorites, and profile
- **Responsive Design** - Works beautifully on desktop and mobile
- **Real-time Updates** - Dynamic content loading and updates

## 🚀 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Storage:** Azure Blob Storage
- **Frontend:** EJS, HTML5, CSS3, JavaScript
- **Authentication:** JWT & Express Sessions
- **Security:** Helmet, CORS, bcrypt

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vishal-s23/thryftly.git
   cd thryftly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/thriftly
   SESSION_SECRET=your-super-secret-key
   JWT_SECRET=your-jwt-secret-key
   AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
   AZURE_CONTAINER_NAME=clothing-images
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Run the application**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
thriftly/
├── config/
│   ├── azure.js          # Azure Blob Storage configuration
│   └── images.json       # Image URL mappings
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── images.js        # Image handling middleware
├── models/
│   ├── Product.js       # Product data model
│   └── User.js          # User data model
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── index.js         # Main page routes
│   ├── products.js      # Product CRUD routes
│   └── users.js         # User management routes
├── views/
│   ├── auth/            # Authentication templates
│   ├── *.ejs           # Page templates
│   └── layout.ejs       # Main layout template
├── scripts/             # Utility scripts
├── server.js           # Main application file
└── package.json
```

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Products
- `GET /api/products` - Get all products with filters
- `POST /api/products` - Create new product listing
- `GET /api/products/:id` - Get specific product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/like` - Like/unlike product

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/favorites` - Get user favorites

## 🔧 Configuration

### MongoDB Setup
Ensure MongoDB is installed and running. The app will create the database automatically.

### Azure Blob Storage
1. Create an Azure Storage Account
2. Create a container named `clothing-images`
3. Add the connection string to your `.env` file

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/thriftly |
| `SESSION_SECRET` | Session encryption key | - |
| `JWT_SECRET` | JWT signing key | - |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure storage connection | - |
| `AZURE_CONTAINER_NAME` | Azure container name | clothing-images |

## 📱 Features in Detail

### Product Categories
- Tops, Dresses, Bottoms, Outerwear
- Shoes, Accessories, Bags, Jewelry
- Swimwear, Activewear, Formal, Vintage

### Search & Filtering
- Text search across titles and descriptions
- Filter by category, size, condition
- Price range filtering
- Sort by price, date, popularity

### User Experience
- Intuitive navigation with search functionality
- Responsive design for all devices
- Real-time form validation
- Image preview and upload
- Like/favorite system

## 🚀 Deployment

The app is ready for deployment on platforms like:
- Heroku
- Vercel
- DigitalOcean
- AWS
- Azure App Service

Make sure to:
1. Set all environment variables
2. Use a production MongoDB instance
3. Configure Azure Blob Storage
4. Set `NODE_ENV=production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, please open an issue on GitHub or contact the development team.

---

**Happy Thrifting! 🌱**