// client/src/App.js - FINAL CLEAN VERSION w/ Cart integrated + Performance Monitor + Dev Filter Debug + FontAwesome

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { CartProvider } from "./contexts/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";

// FontAwesome icons imported individually in components (tree-shaking)

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Home from "./pages/Home";
import Pets from "./pages/Pets";
import Browse from "./pages/Browse";
import PetDetail from "./pages/PetDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { LoginForm } from "./components/Form/AuthForms";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart"; // ✅ new

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPets from "./pages/admin/AdminPets";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminReports from "./pages/admin/AdminReports";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNews from "./pages/admin/AdminNews";

// Admin Route & Layout
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/globals.css";

// Icons are imported individually in each component for better tree-shaking

// ============================================
// Performance Monitoring (kept in this file, outside JSX)
// ============================================
export const performanceMonitor = {
  logFilterPerformance: (filterName, startTime) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    // eslint-disable-next-line no-console
    console.log(`⚡ ${filterName} completed in ${duration}ms`);
    if (duration > 1000) {
      // eslint-disable-next-line no-console
      console.warn(`🐌 Slow filter detected: ${filterName} took ${duration}ms`);
    }
  },

  logImageLoadPerformance: (imageSrc, startTime, success) => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const status = success ? "✅" : "❌";
    // eslint-disable-next-line no-console
    console.log(`🖼️ ${status} Image load: ${imageSrc} (${duration}ms)`);
  },
};

// Expose globally in dev for quick console access (optional)
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-undef
  window.performanceMonitor = performanceMonitor;
}

// 🔧 Dev-only: install global /api/pets fetch monitor + test runners
if (process.env.NODE_ENV !== "production") {
  import("./dev/filterDebug").then((m) => m?.setupFilterDebug?.());
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="App d-flex flex-column min-vh-100">
                {/* Navigation */}
                <Navbar />

                {/* Toasts */}
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
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/cart" element={<Cart />} /> {/* ✅ new */}

                    {/* Protected User Route */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes (Protected and Nested) */}
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
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="contacts" element={<AdminContacts />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* Admin News Page (also protected separately) */}
                    <Route
                      path="/admin/news"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminNews />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

                {/* Footer */}
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;