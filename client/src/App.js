// client/src/App.js
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

// Import Bootstrap, FontAwesome and custom styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

// Lazy load all components for better performance
const Home = lazy(() => import('./pages/Home'));
const Dogs = lazy(() => import('./pages/Dogs'));
const Cats = lazy(() => import('./pages/Cats'));
const Aquatics = lazy(() => import('./pages/Aquatics'));
const Birds = lazy(() => import('./pages/Birds'));
const SmallPets = lazy(() => import('./pages/SmallPets'));
const Supplies = lazy(() => import('./pages/Supplies'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Browse = lazy(() => import('./pages/Browse'));
const PetDetail = lazy(() => import('./pages/PetDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const AddPet = lazy(() => import('./pages/AddPet'));
const EditPet = lazy(() => import('./pages/EditPet'));
const Favorites = lazy(() => import('./pages/Favorites'));
const MyPets = lazy(() => import('./pages/MyPets'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Help = lazy(() => import('./pages/Help'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPets = lazy(() => import('./pages/admin/AdminPets'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

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
                  <Route path="/animal/:id" element={<Navigate to="/pet/:id" replace />} />
                  
                  {/* Information Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/about-us" element={<Navigate to="/about" replace />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/support" element={<Navigate to="/help" replace />} />
                  <Route path="/faq" element={<Navigate to="/help" replace />} />
                  
                  {/* Legal Pages */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
                  
                  {/* Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signin" element={<Navigate to="/login" replace />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/signup" element={<Navigate to="/register" replace />} />
                  <Route path="/join" element={<Navigate to="/register" replace />} />
                  
                  {/* Protected User Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/account" element={
                    <ProtectedRoute>
                      <Navigate to="/profile" replace />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/add-pet" element={
                    <ProtectedRoute>
                      <AddPet />
                    </ProtectedRoute>
                  } />
                  <Route path="/pets/add" element={
                    <ProtectedRoute>
                      <Navigate to="/add-pet" replace />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/edit-pet/:id" element={
                    <ProtectedRoute>
                      <EditPet />
                    </ProtectedRoute>
                  } />
                  <Route path="/pets/edit/:id" element={
                    <ProtectedRoute>
                      <Navigate to="/edit-pet/:id" replace />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/favorites" element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  } />
                  <Route path="/favourites" element={
                    <ProtectedRoute>
                      <Navigate to="/favorites" replace />
                    </ProtectedRoute>
                  } />
                  <Route path="/wishlist" element={
                    <ProtectedRoute>
                      <Navigate to="/favorites" replace />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/my-pets" element={
                    <ProtectedRoute>
                      <MyPets />
                    </ProtectedRoute>
                  } />
                  <Route path="/mypets" element={
                    <ProtectedRoute>
                      <Navigate to="/my-pets" replace />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Routes with Nested Routing */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }>
                    {/* Admin Dashboard */}
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<Navigate to="/admin" replace />} />
                    
                    {/* Pet Management */}
                    <Route path="pets" element={<AdminPets />} />
                    <Route path="pets/add" element={<AddPet />} />
                    <Route path="pets/edit/:id" element={<EditPet />} />
                    <Route path="pets/:id" element={<PetDetail />} />
                    
                    {/* User Management */}
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="customers" element={<Navigate to="/admin/users" replace />} />
                    
                    {/* Contact Management */}
                    <Route path="contacts" element={<AdminContacts />} />
                    <Route path="messages" element={<Navigate to="/admin/contacts" replace />} />
                    <Route path="inquiries" element={<Navigate to="/admin/contacts" replace />} />
                    
                    {/* Analytics and Reports */}
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="stats" element={<Navigate to="/admin/analytics" replace />} />
                    <Route path="reports" element={<AdminReports />} />
                    
                    {/* Settings */}
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="config" element={<Navigate to="/admin/settings" replace />} />
                    
                    {/* Admin 404 */}
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Route>
                  
                  {/* API Documentation Route */}
                  <Route path="/api" element={
                    <div className="container py-5">
                      <div className="row justify-content-center">
                        <div className="col-md-8 text-center">
                          <h1><i className="fas fa-code me-2"></i>API Documentation</h1>
                          <p className="lead">
                            Welcome to the FurBabies API documentation.
                          </p>
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            API documentation is available for developers.
                          </div>
                          <a 
                            href={`${process.env.REACT_APP_API_URL || '/api'}/health`}
                            className="btn btn-primary me-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-heartbeat me-2"></i>
                            API Health Check
                          </a>
                          <a 
                            href="/"
                            className="btn btn-outline-secondary"
                          >
                            <i className="fas fa-home me-2"></i>
                            Back to Home
                          </a>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="/api-docs" element={<Navigate to="/api" replace />} />
                  <Route path="/docs" element={<Navigate to="/api" replace />} />
                  
                  {/* Health Check Route */}
                  <Route path="/health" element={
                    <div className="container py-5 text-center">
                      <div className="row justify-content-center">
                        <div className="col-md-6">
                          <i className="fas fa-heartbeat fa-3x text-success mb-3"></i>
                          <h2>FurBabies is Healthy!</h2>
                          <p className="text-muted">
                            All systems are operational.
                          </p>
                          <a href="/" className="btn btn-primary">
                            <i className="fas fa-home me-2"></i>
                            Go Home
                          </a>
                        </div>
                      </div>
                    </div>
                  } />
                  
                  {/* Legacy Routes (for SEO and backwards compatibility) */}
                  <Route path="/petstore" element={<Navigate to="/" replace />} />
                  <Route path="/pet-store" element={<Navigate to="/" replace />} />
                  <Route path="/furbabies" element={<Navigate to="/" replace />} />
                  <Route path="/fur-babies" element={<Navigate to="/" replace />} />
                  
                  {/* Catch-all route for 404 - Must be last */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            
            {/* Footer */}
            <Footer />
            
            {/* Global Toast Notifications */}
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
              bodyClassName="custom-toast-body"
              progressClassName="custom-toast-progress"
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;