import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Interceptor to automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized response and dispatch a logout event
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      // Dispatch a custom event to notify React context/components of unauthorized status
      window.dispatchEvent(new Event("unauthorized-logout"));
    }
    return Promise.reject(error);
  }
);

export default api;