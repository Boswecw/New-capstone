# FurBabies Pet Store 🐾

A modern pet adoption platform built with React and Node.js, helping connect loving families with pets in need of homes. Features a custom image proxy solution to handle cross-origin image delivery challenges.

## ✨ Key Features

- **Pet Browse & Search**: View available dogs, cats, and aquatic pets with high-quality images
- **User Authentication**: Secure login and registration system with JWT
- **Pet Details**: Comprehensive information about each pet
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Contact System**: Easy communication for adoption inquiries
- **Image Management**: Custom proxy solution for reliable image delivery
- **Admin Dashboard**: Product and pet management interface

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Hooks
- React Router for navigation
- React Bootstrap for UI components
- Axios for API communication
- Custom image handling with fallback support

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- CORS configuration
- Rate limiting and security middleware
- Custom image proxy service

**Cloud Services:**
- Google Cloud Storage for image hosting
- MongoDB Atlas for database hosting
- Render for application deployment

**Development Tools:**
- Concurrently for development workflow
- Nodemon for server auto-restart
- Environment-based configuration

## 🚧 Technical Challenges Solved

### Image Delivery & CORS Issues
**Challenge**: Free Google Cloud Storage buckets don't support CORS configuration, causing cross-origin image loading failures.

**Solution**: Implemented a custom Express.js image proxy service that:
- Serves GCS images through the application server
- Adds proper CORS headers
- Provides automatic fallback to reliable CDN images
- Includes caching for improved performance
- Handles errors gracefully with user-friendly fallbacks

### Key Implementation Details:
- **Proxy Route**: `/api/images/gcs/*` serves images with proper headers
- **Fallback System**: Automatic switching to Unsplash CDN on failures
- **Error Handling**: Graceful degradation with category-specific fallbacks
- **Performance**: 24-hour caching with optimized headers

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git
- Google Cloud Storage bucket (optional, fallbacks provided)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Boswecw/furbabies-petstore.git
   cd furbabies-petstore
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - React app on http://localhost:3000

## 📜 Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the React frontend
- `npm start` - Start the production server
- `npm run build` - Build the React app for production

## 🔌 API Endpoints

### Core Application
- `GET /api/health` - Server health check with service status
- `GET /api/pets` - Get all pets with filtering options
- `GET /api/pets/:id` - Get specific pet details
- `GET /api/pets/featured` - Get featured pets for homepage
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `POST /api/contact` - Contact form submission

### Products & Shopping
- `GET /api/products` - Get all products with filtering
- `GET /api/products/:id` - Get specific product details
- `GET /api/products/featured` - Get featured products

### Image Proxy Service
- `GET /api/images/gcs/*` - Proxy for Google Cloud Storage images
- `GET /api/images/fallback/:category` - Get fallback images by category
- `GET /api/images/health` - Image service health check

### Google Cloud Storage
- `GET /api/gcs/buckets/:bucket/images` - List images in GCS bucket
- `GET /api/gcs/config` - Get GCS configuration status

## 📁 Project Structure

```
furbabies-petstore/
├── client/                 # React frontend
│   ├── public/
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ProxyImage.js    # Custom image component
│   │   │   ├── PetCard.js       # Pet display card
│   │   │   ├── ProductCard.js   # Product display card
│   │   │   └── SafeImage.js     # Error-handling image component
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   │   └── imageUtils.js    # Image URL handling
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # API routes
│   │   ├── images.js       # Image proxy service
│   │   ├── pets.js         # Pet management
│   │   ├── products.js     # Product management
│   │   ├── users.js        # User authentication
│   │   ├── contact.js      # Contact form
│   │   └── gcs.js          # Google Cloud Storage
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js           # Main server file
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Key Features & Implementation

### Image Management System
- **Proxy Service**: Custom Express middleware for image delivery
- **Fallback Strategy**: Automatic fallback to CDN images on failures
- **Performance**: Cached responses with optimized headers
- **Error Handling**: Graceful degradation with user-friendly messages

### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Bootstrap Integration**: Consistent UI components
- **Custom CSS**: Enhanced styling with CSS modules

### Database Design
- **Pet Schema**: Comprehensive pet information with image references
- **Product Schema**: E-commerce ready product management
- **User Schema**: Secure authentication with JWT

## 🌍 Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` | ✅ |
| `NODE_ENV` | Environment mode | `development` or `production` | ✅ |
| `PORT` | Server port | `5000` | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.com` | 🔶 |

## 🚀 Deployment

### Render Deployment
The application is configured for easy deployment on Render:

1. **Backend**: Auto-deploys from main branch
2. **Environment Variables**: Set in Render dashboard
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

### Production Considerations
- **CORS**: Configured for production domains
- **Rate Limiting**: Implemented for API protection
- **Error Handling**: Production-safe error messages
- **Static Files**: Optimized serving in production mode

## 🧪 Testing & Development

### Image Proxy Testing
```bash
# Test image proxy health
curl https://your-app.onrender.com/api/images/health

# Test image delivery
curl https://your-app.onrender.com/api/images/gcs/pets/sample.jpg

# Test fallback system
curl https://your-app.onrender.com/api/images/fallback/pet
```

### Local Development
```bash
# Start with logging
npm run dev

# Test API endpoints
curl http://localhost:5000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Contact & Links

- **Author**: Charles W Boswell
- **Email**: charliewboswell@gmail.com
- **GitHub**: [@Boswecw](https://github.com/Boswecw)
- **Live Demo**: [FurBabies Pet Store](https://new-capstone.onrender.com)

## 🙏 Acknowledgments

- **Images**: Pet photos from [Unsplash](https://unsplash.com) with fallback CDN
- **Icons**: [Font Awesome](https://fontawesome.com) for UI icons
- **UI Framework**: [React Bootstrap](https://react-bootstrap.github.io) for components
- **Cloud Services**: Google Cloud Storage for image hosting
- **Database**: MongoDB Atlas for reliable data storage

---

*This project demonstrates full-stack development skills, problem-solving abilities, and production-ready code architecture. The custom image proxy solution showcases technical creativity in overcoming third-party service limitations.*