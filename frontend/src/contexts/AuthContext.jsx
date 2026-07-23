import { createContext, useState, useEffect, useContext } from "react";
import { loginRequest, registerRequest } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from token on startup or refresh
  useEffect(() => {
    const restoreAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        // In a real app we might fetch user profile here. For now we parse token or set basic authenticated state
        setUser({ email: parseEmailFromToken(storedToken) });
      }
      setLoading(false);
    };
    restoreAuth();
  }, []);

  // Listen to unauthorized-logout event from api interceptor
  useEffect(() => {
    const handleUnauthorizedLogout = () => {
      logout();
    };
    window.addEventListener("unauthorized-logout", handleUnauthorizedLogout);
    return () => {
      window.removeEventListener("unauthorized-logout", handleUnauthorizedLogout);
    };
  }, []);

  // Helper function to decode email from JWT payload
  const parseEmailFromToken = (token) => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub; // subject contains the user's email in Spring security setup
    } catch (e) {
      return null;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser({ email: parseEmailFromToken(data.token) });
      return { success: true };
    } catch (error) {
      logout();
      return {
        success: false,
        message: error.response?.data?.error || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      await registerRequest(name, email, password);
      // Auto login user after registration
      return await login(email, password);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
