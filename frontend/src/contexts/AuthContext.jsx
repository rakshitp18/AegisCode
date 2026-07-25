import { createContext, useState, useEffect, useContext } from "react";
import { loginRequest, registerRequest } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to decode email from JWT payload
  const parseEmailFromToken = (token) => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub; // subject contains the user's email in Spring security setup
    } catch {
      return null;
    }
  };

  const logout = (shouldRedirect = false) => {
    localStorage.removeItem("token");
    if (shouldRedirect) {
      window.location.href = "/";
      return;
    }
    setToken(null);
    setUser(null);
  };

  const loadUserProfile = (email) => {
    try {
      const stored = localStorage.getItem(`profile_${email}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
    }
    return { name: email.split("@")[0], image: null };
  };

  const updateProfile = (name, image) => {
    if (!user) return;
    const email = user.email;
    const profile = { name, image };
    localStorage.setItem(`profile_${email}`, JSON.stringify(profile));
    setUser({ email, ...profile });
  };

  // Restore user from token on startup or refresh
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
          const email = parseEmailFromToken(storedToken);
          const profile = loadUserProfile(email);
          setUser({ email, name: profile.name, image: profile.image });
        }
      } catch (e) {
        console.error("Failed to restore authentication state:", e);
      } finally {
        setLoading(false);
      }
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      const userEmail = parseEmailFromToken(data.token);
      const profile = loadUserProfile(userEmail);
      setUser({ email: userEmail, name: profile.name, image: profile.image });
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
      // Save their registration name to local storage profile so they start with it
      localStorage.setItem(`profile_${email}`, JSON.stringify({ name, image: null }));
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
    updateProfile,
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
