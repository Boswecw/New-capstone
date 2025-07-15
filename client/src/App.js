// client/src/App.js - COMPLETE VERSION WITH ALL 7 ADMIN PAGES
// ✅ Removed React import (not needed in React 17+ with new JSX Transform)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
// import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// ✅ ALL 7 ADMIN PAGES - PROPERLY IMPORTED (CONFIRMED EXISTING)
import AdminDashboard from './pages/admin/AdminDashboard';     // ✅ 1/7
import AdminUsers from './pages/admin/AdminUsers';             // ✅ 2/7
import AdminPets from './pages/admin/AdminPets';               // ✅ 3/7
import AdminContacts from './pages/admin/AdminContacts';       // ✅ 4/7
import AdminReports from './pages/admin/AdminReports';         // ✅ 5/7
import AdminAnalytics from './pages/admin/AdminAnalytics';     // ✅ 6/7 FIXED: Real component
import AdminSettings from './pages/admin/AdminSettings';       // ✅ 7/7 FIXED: Real component

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
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetail />} />
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
                {/* 1/7 - Admin Dashboard */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                {/* 2/7 - Admin Pets Management */}
                <Route path="/admin/pets" element={
                  <ProtectedRoute adminOnly>
                    <AdminPets />
                  </ProtectedRoute>
                } />
                
                {/* 3/7 - Admin Users Management */}
                <Route path="/admin/users" element={
                  <ProtectedRoute adminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                } />
                
                {/* 4/7 - Admin Contacts Management */}
                <Route path="/admin/contacts" element={
                  <ProtectedRoute adminOnly>
                    <AdminContacts />
                  </ProtectedRoute>
                } />
                
                {/* 5/7 - Admin Reports */}
                <Route path="/admin/reports" element={
                  <ProtectedRoute adminOnly>
                    <AdminReports />
                  </ProtectedRoute>
                } />
                
                {/* 6/7 - ✅ FIXED: Admin Analytics - Now using REAL component */}
                <Route path="/admin/analytics" element={
                  <ProtectedRoute adminOnly>
                    <AdminAnalytics />
                  </ProtectedRoute>
                } />
                
                {/* 7/7 - ✅ FIXED: Admin Settings - Now using REAL component */}
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
            
            {/* React-Toastify Toast Container */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;