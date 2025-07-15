// client/src/App.js - CUSTOM TOAST SYSTEM VERSION
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext'; // ✅ Custom toast system
import ErrorBoundary from './components/ErrorBoundary';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer'; // ✅ Custom toast container

// Pages
import Home from './pages/Home';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import NewsDetail from './pages/NewsDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// ✅ ALL 7 ADMIN PAGES
import AdminDashboard from './pages/admin/AdminDashboard';     
import AdminUsers from './pages/admin/AdminUsers';             
import AdminPets from './pages/admin/AdminPets';               
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

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider> {/* ✅ Wrap with custom ToastProvider */}
          <Router>
            <div className="App">
              <Navbar />
              
              <main>
                <Routes>
                  {/* ========== PUBLIC ROUTES ========== */}
                  <Route path="/" element={<Home />} />
                  <Route path="/pets" element={<Pets />} />
                  <Route path="/pets/:id" element={<PetDetail />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* ========== PROTECTED USER ROUTES ========== */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
                  {/* ========== ADMIN ROUTES (ALL 7 CONFIRMED PAGES) ========== */}
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/pets" element={
                    <ProtectedRoute adminOnly>
                      <AdminPets />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/users" element={
                    <ProtectedRoute adminOnly>
                      <AdminUsers />
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

                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <Footer />
              
              {/* ✅ Custom Toast Container */}
              <ToastContainer />
            </div>
          </Router>
        </ToastProvider> {/* ✅ Close custom ToastProvider */}
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;