// client/src/App.js - COMPLETE WITH NEWS ROUTES
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';

// Pages
import Home from './pages/Home';
import Pets from './pages/Pets';
import Browse from './pages/Browse';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import News from './pages/News';                    // ✅ News listing page
import NewsDetail from './pages/NewsDetail';        // ✅ Individual news article page
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// ✅ ALL 8 ADMIN PAGES
import AdminDashboard from './pages/admin/AdminDashboard';     
import AdminUsers from './pages/admin/AdminUsers';             
import AdminPets from './pages/admin/AdminPets';               
import AdminProducts from './pages/admin/AdminProducts';       
import AdminContacts from './pages/admin/AdminContacts';       
import AdminReports from './pages/admin/AdminReports';         
import AdminAnalytics from './pages/admin/AdminAnalytics';     
import AdminSettings from './pages/admin/AdminSettings';       

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Custom CSS
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="App d-flex flex-column min-vh-100">
              {/* Navigation */}
              <Navbar />
              
              {/* Toast Notifications */}
              <ToastContainer />
              
              {/* Main Content */}
              <main className="flex-grow-1">
                <Routes>
                  {/* ===== PUBLIC ROUTES ===== */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  
                  {/* Pet Routes */}
                  <Route path="/pets" element={<Pets />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/pets/:id" element={<PetDetail />} />
                  
                  {/* Product Routes */}
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  
                  {/* ✅ NEWS ROUTES - ADDED */}
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetail />} />
                  
                  {/* Info Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected User Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* ===== ADMIN ROUTES ===== */}
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
                  
                  {/* ===== 404 ROUTE ===== */}
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