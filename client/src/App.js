// client/src/App.js - UPDATED TO USE AUTHFORMS
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import Pets from './pages/Pets';
import Browse from './pages/Browse';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import About from './pages/About';
import Contact from './pages/Contact';
// ✅ CHANGED: Import LoginForm from AuthForms instead of Login page
import { LoginForm } from './components/Form/AuthForms';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPets from './pages/admin/AdminPets';
import AdminProducts from './pages/admin/AdminProducts';
import AdminContacts from './pages/admin/AdminContacts';
import AdminReports from './pages/admin/AdminReports';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNews from './pages/admin/AdminNews';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Bootstrap & Custom Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          {/* OPTIONAL: Add future flags to suppress React Router v7 warnings */}
          <Router 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <ScrollToTop />
            <div className="App d-flex flex-column min-vh-100">
              {/* Navigation */}
              <Navbar />

              {/* Toastify Container */}
              <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />

              {/* Main Content */}
              <main className="flex-grow-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/pets" element={<Pets />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/pets/:id" element={<PetDetail />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  {/* ✅ CHANGED: Use LoginForm from AuthForms instead of Login page */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected User Route */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute adminOnly>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/pets" element={
                    <ProtectedRoute adminOnly>
                      <AdminPets />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/products" element={
                    <ProtectedRoute adminOnly>
                      <AdminProducts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/contacts" element={
                    <ProtectedRoute adminOnly>
                      <AdminContacts />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <ProtectedRoute adminOnly>
                      <AdminReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute adminOnly>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute adminOnly>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/news" element={
                    <ProtectedRoute adminOnly>
                      <AdminNews />
                    </ProtectedRoute>
                  } />

                  {/* 404 Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;