# FurBabies Pet Store 🐾

A modern pet adoption platform built with React and Node.js, helping connect loving families with pets in need of homes.

## Features

- **Pet Browse & Search**: View available dogs, cats, and aquatic pets
- **User Authentication**: Secure login and registration system
- **Pet Details**: Detailed information about each pet
- **Responsive Design**: Works great on desktop and mobile
- **Contact System**: Easy communication for adoption inquiries

## Tech Stack

**Frontend:**
- React 18
- React Router
- React Bootstrap
- Axios for API calls

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- CORS enabled

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

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
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - React app on http://localhost:3000

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the React frontend
- `npm start` - Start the production server
- `npm run build` - Build the React app for production

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/pets` - Get all pets
- `GET /api/pets?category=dog` - Get pets by category
- `GET /api/pets/:id` - Get specific pet details
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/contact` - Contact form submission

## Project Structure

```
furbabies-petstore/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   └── server.js
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Author**: Charles W Boswell
- **Email**: charliewboswell@gmail.com
- **GitHub**: [@yourusername](https://github.com/Boswecw)

## Acknowledgments

- Pet photos from [Unsplash](https://unsplash.com)
- Icons from [Font Awesome](https://fontawesome.com)
- UI components from [React Bootstrap](https://react-bootstrap.github.io)