import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({ baseURL: `${API_URL}/api` });

// send the token (saved in localStorage at login) with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// token expired / user deactivated -> clear token, AuthContext sends the user to /login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/auth/login")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("authExpired"));
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || "Something went wrong";
export const fileUrl = (name) => `${API_URL}/uploads/${name}`;

export default api;
