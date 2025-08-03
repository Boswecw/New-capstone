# FurBabies Pet Store 🐾

A modern pet adoption platform built with the MERN stack, helping connect loving families with pets in need of homes. Includes a custom image proxy service and a heart-based pet rating system.

---

## ✨ Key Features

- 🐶 **Pet Browse & Search**: View adoptable dogs, cats, and aquatics
- ❤️ **Heart-Based Rating System**: Users can rate pets using heart icons
- 🔐 **User Authentication**: Secure login and registration with JWT
- 📝 **Pet Details**: Full pet profiles with fallback images
- 📱 **Responsive Design**: Mobile-first UI with Bootstrap
- 📸 **Image Management**: Google Cloud Storage + proxy fallback
- ⚙️ **Admin Dashboard**: Manage pets, products, and users

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 (with Hooks)
- React Router v6
- React Bootstrap UI
- Axios HTTP client
- FontAwesome Icons via `react-icons`

**Backend:**
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT Authentication & Middleware
- Image Proxy Server for GCS
- Rate Limiting & Security Headers

**Cloud & DevOps:**
- Google Cloud Storage (GCS)
- MongoDB Atlas
- Render.com for deployment
- Nodemon + Concurrently for Dev

---

## 🚧 Challenges Solved

### 🖼️ Image Delivery & CORS
**Problem:** Google Cloud Storage lacks free CORS config.

**Solution:**
- Proxy server route: `/api/images/gcs/*`
- Adds CORS headers
- Automatic fallback to Unsplash
- Optimized caching & graceful error handling

### ❤️ Heart Rating System
- Fully interactive pet rating
- Stored on backend with `/pets/:id/rate`
- Built using `react-icons/fa` (FontAwesome hearts)
- Prevents duplicate ratings per session

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas
- Git + npm
- GCS bucket (optional)

### Installation

```bash
# Clone the repo
https://github.com/Boswecw/furbabies-petstore.git
cd furbabies-petstore

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Required Packages
```bash
npm install react-icons
```

### Environment Variables
Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongo_url
JWT_SECRET=your_secret
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Start the App
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📦 Scripts

| Command            | Description                      |
|--------------------|----------------------------------|
| `npm run dev`      | Start fullstack dev servers      |
| `npm run client`   | React app only                   |
| `npm run server`   | API server only                  |
| `npm start`        | Prod server                      |
| `npm run build`    | Build React for deployment       |

---

## 🔌 API Endpoints

### Pets
- `GET /api/pets`
- `GET /api/pets/:id`
- `GET /api/pets/featured`
- `POST /api/pets/:id/rate` ❤️ Rate pet

### Users
- `POST /api/users/login`
- `POST /api/users/register`

### Products
- `GET /api/products`
- `GET /api/products/featured`

### Images
- `GET /api/images/gcs/:path`
- `GET /api/images/fallback/:category`

---

## 🧱 Project Structure

```
furbabies-petstore/
├── client/
│   ├── components/ → UI (PetCard, SafeImage, HeartRating)
│   ├── pages/      → Browse, Detail views
│   ├── services/   → Axios API utils
├── server/
│   ├── routes/     → pets.js, images.js
│   ├── models/     → Pet, User, Product
│   └── server.js
```

---

## 🌍 Environment Variables

| Variable        | Description              | Required |
|----------------|--------------------------|----------|
| MONGODB_URI     | MongoDB Atlas connection | ✅       |
| JWT_SECRET      | JWT signing key          | ✅       |
| NODE_ENV        | Environment              | ✅       |
| PORT            | Backend server port      | ✅       |
| FRONTEND_URL    | CORS origin              | ✅       |

---

## 📦 Dependencies

```bash
npm install react-icons react-router-dom react-bootstrap axios concurrently dotenv
```

---

## 🧪 Testing & Debugging

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/pets
curl http://localhost:5000/api/images/health
```

---

## 🖥️ Deployment (Render)

### Backend
- Auto-deploy from GitHub `main`
- Build Command: `npm install`
- Start Command: `npm start`
- Set environment variables manually

### Frontend
- Render Static Site
- Root: `client`
- Build Command: `npm install && npm run build`
- Publish directory: `client/build`

---

## 👨‍💻 Author

- **Name**: Charles W Boswell
- **Email**: charliewboswell@gmail.com
- **GitHub**: [@Boswecw](https://github.com/Boswecw)
- **Live App**: [new-capstone.onrender.com](https://new-capstone.onrender.com)

---

## 🙏 Acknowledgments

- React Bootstrap
- Font Awesome (via `react-icons`)
- Unsplash for image fallbacks
- MongoDB Atlas & GCS Hosting

> 💡 *This project showcases fullstack skills, secure API design, third-party image workarounds, and interactive user engagement features like pet rating.*
