// client/src/contexts/AuthContext.js - Improved Debug + Strict Payload

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = (() => {
    if (process.env.NODE_ENV === "production") {
      return process.env.REACT_APP_API_BASE_URL || "https://furbabies-backend.onrender.com/api";
    }
    return process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
  })();

  console.log("🔧 API Config:", { API_BASE_URL });

  const validateToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        console.warn("Token invalid:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return null;
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        const userData = await validateToken(token);
        if (userData) {
          setUser(userData);
        } else {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [validateToken]);

  const login = async (credentials) => {
    const email = credentials?.email;
    const password = credentials?.password;

    // 🔒 Strict validation before sending
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.error("❌ Invalid email passed to login:", email);
      throw new Error("Email is required and must be valid.");
    }
    if (!password || typeof password !== "string" || password.length < 2) {
      console.error("❌ Invalid password passed to login:", password);
      throw new Error("Password is required.");
    }

    const loginPayload = { email, password };
    console.log("🔐 Attempting login:", loginPayload);

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
      });

      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        const errMsg = data.message || "Login failed";
        console.error("❌ Login failed:", errMsg);
        throw new Error(errMsg);
      }

      const { token, user: loggedInUser } = data.data;
      localStorage.setItem("token", token);
      setUser(loggedInUser);

      console.log("✅ Login successful for:", loggedInUser.email);
      return { success: true, user: loggedInUser, token };

    } catch (err) {
      console.error("💥 Login error:", err.message || err);
      throw err;
    }
  };

  const register = async (userData) => {
    const payload = {
      name: userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.name || "",
      email: userData.email,
      password: userData.password,
      ...(userData.phone && { phone: userData.phone }),
      ...(userData.address && { address: userData.address }),
      role: "user",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json")
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        const errMsg = data.message || "Registration failed";
        throw new Error(errMsg);
      }

      const { token, user: newUser } = data.data;
      localStorage.setItem("token", token);
      setUser(newUser);

      return { success: true, user: newUser, token };

    } catch (err) {
      console.error("💥 Registration error:", err.message || err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    console.log("🚪 Logged out");
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
