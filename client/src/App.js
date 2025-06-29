// client/src/App.js
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Core Components (loaded immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded Page Components (loaded on demand)
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Pet Category Pages
const Browse = lazy(() => import('./pages/Browse'));
const Dogs = lazy(() => import('./pages/Dogs'));
const Cats = lazy(() => import('./pages/Cats'));
const Aquatics = lazy(() => import('./pages/Aquatics'));
const Birds = lazy(() => import('./pages/Birds'));
const SmallPets = lazy(() => import('./pages/SmallPets'));
const Supplies = lazy(() => import('./pages/Supplies'));

// Pet Detail and Search
const PetDetail = lazy(() => import('./pages/PetDetail'));
const SearchResults = lazy(() => import('./pages/SearchResults'));

// Authentication Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPets = lazy(() => import('./pages/admin/AdminPets'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

// Error Pages
const NotFound = lazy(() => import('./pages/NotFound'));
const ServerError = lazy(() => import('./pages/ServerError'));

// Loading component with FurBabies branding
const PageLoader = ({ text = 'Loading...' }) => (
  <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '60vh' }}>
    <div className="mb-3">
      <i className="fas fa-paw fa-3x text-primary mb-3 fa-spin"></i>
    </div>
    <LoadingSpinner text={text} />
  </div>
);

// Main App Component
function App() {
  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      toast.error('Something went wrong. Please try again.');
    };

    const handleError = (event) => {
      console.error('Global error:', event.error);
      toast.error('An unexpected error occurred.');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Check if Google Cloud Storage is configured
    if (!process.env.REACT_APP_GCS_BUCKET_NAME) {
      console.warn('Google Cloud Storage bucket not configured. Images may not load properly.');
    }

    // Preload critical images
    const preloadCriticalImages = () => {
      const criticalImages = [
        process.env.REACT_APP_GCS_BASE_URL + '/' + process.env.REACT_APP_GCS_BUCKET_NAME + '/brand/FurBabiesIcon.png',
        process.env.REACT_APP_GCS_BASE_URL + '/' + process.env.REACT_APP_GCS_BUCKET_NAME + '/defaults/default-pet.png'
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    };

    preloadCriticalImages();

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="App d-flex flex-column min-vh-100">
            {/* Navigation */}
            <Navbar />
            
            {/* Main Content */}
            <main className="flex-grow-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Home Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/index" element={<Navigate to="/" replace />} />
                  
                  {/* Pet Category Routes */}
                  <Route path="/dogs" element={<Dogs />} />
                  <Route path="/cats" element={<Cats />} />
                  <Route path="/aquatics" element={<Aquatics />} />
                  <Route path="/fish" element={<Navigate to="/aquatics" replace />} />
                  <Route path="/birds" element={<Birds />} />
                  <Route path="/small-pets" element={<SmallPets />} />
                  <Route path="/smallpets" element={<Navigate to="/small-pets" replace />} />
                  <Route path="/supplies" element={<Supplies />} />
                  <Route path="/accessories" element={<Navigate to="/supplies" replace />} />
                  
                  {/* Browse and Search Routes */}
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/browse/:category" element={<Browse />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/find" element={<Navigate to="/search" replace />} />
                  
                  {/* Individual Pet Routes */}
                  <Route path="/pet/:id" element={<PetDetail />} />
                  <Route path="/pets/:id" element={<Navigate to="/pet/:id" replace />} />
                  
                  {/* Information Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/signup" element={<Navigate to="/register" replace />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* Protected User Routes */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/account" 
                    element={<Navigate to="/profile" replace />} 
                  />
                  
                  {/* Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/dashboard" 
                    element={<Navigate to="/admin" replace />} 
                  />
                  <Route 
                    path="/admin/pets" 
                    element={
                      <AdminRoute>
                        <AdminPets />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <AdminRoute>
                        <AdminUsers />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/contacts" 
                    element={
                      <AdminRoute>
                        <AdminContacts />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/settings" 
                    element={
                      <AdminRoute>
                        <AdminSettings />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/analytics" 
                    element={
                      <AdminRoute>
                        <AdminAnalytics />
                      </AdminRoute>
                    } 
                  />
                  <Route 
                    path="/admin/reports" 
                    element={
                      <AdminRoute>
                        <AdminReports />
                      </AdminRoute>
                    } 
                  />
                  
                  {/* Error Routes */}
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/error" element={<Navigate to="/500" replace />} />
                  
                  {/* Catch-all 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            {/* Footer */}
            <Footer />
            
            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              toastClassName="custom-toast"
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;