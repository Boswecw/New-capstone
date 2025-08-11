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
- Git + Yarn
- GCS bucket (optional)

### Installation

```bash
# Clone the repo
https://github.com/Boswecw/furbabies-petstore.git
cd furbabies-petstore

# Install server dependencies
yarn install

# Install client dependencies
cd client
yarn install
cd ..
```

### Required Packages
```bash
yarn add react-icons
```

### Environment Variables
Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongo_url
JWT_SECRET=your_secret
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=notifications@example.com
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### Start the App
```bash
yarn dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📦 Scripts

| Command          | Description                    |
|------------------|--------------------------------|
| `yarn dev`       | Start fullstack dev servers    |
| `yarn client`    | React app only                 |
| `yarn server`    | API server only                |
| `yarn start`     | Prod server                    |
| `yarn build`     | Build React for deployment     |

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
| REACT_APP_API_URL | Base URL for frontend API requests | ✅ (prod) |
| SMTP_HOST       | SMTP server hostname     | ✅       |
| SMTP_PORT       | SMTP server port         | ✅       |
| SMTP_USER       | SMTP username            | ✅       |
| SMTP_PASS       | SMTP password            | ✅       |
| SMTP_FROM       | Sender email address     | ✅       |
| ADMIN_EMAILS    | Admin notification emails (comma-separated) | ✅       |

---

## 📦 Dependencies

```bash
yarn add react-icons react-router-dom react-bootstrap axios concurrently dotenv
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
- Build Command: `yarn install`
- Start Command: `yarn start`
- Set environment variables manually
<<<<<<< HEAD

=======

>>>>>>> 7147bbd10087f3d8c934a448e0fc622cfd9f09f1
### Frontend
- Render Static Site
- Root: `client`
- Build Command: `yarn install && yarn build`
<<<<<<< HEAD
- Publish directory: `client/build`
=======
- Publish directory: `build`
>>>>>>> 7147bbd10087f3d8c934a448e0fc622cfd9f09f1

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
