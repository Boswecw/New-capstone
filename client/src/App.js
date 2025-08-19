// client/src/App.js - COMPLETE FIXED VERSION
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import ErrorBoundary from "./components/ErrorBoundary";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Auth Components - FIXED: Import LoginForm from AuthForms
import { LoginForm } from "./components/Form/AuthForms";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Pets from "./pages/Pets";
import Browse from "./pages/Browse";
import Products from "./pages/Products";
import News from "./pages/News";
import PetDetail from "./pages/PetDetail";
import ProductDetail from "./pages/ProductDetail";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPets from "./pages/admin/AdminPets";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="App d-flex flex-column min-vh-100">
            <Navbar />
            
            <main className="flex-grow-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/pets" element={<Pets />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/products" element={<Products />} />
                <Route path="/news" element={<News />} />
                <Route path="/pets/:id" element={<PetDetail />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Auth Routes - FIXED: Using LoginForm component */}
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/profile" element={<Profile />} />

                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="pets" element={<AdminPets />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            <Footer />
          </div>

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
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;