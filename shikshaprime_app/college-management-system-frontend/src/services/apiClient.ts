import axios, { AxiosError } from "axios";
import config from "../config";
import { getLogoutFn } from "../context/authContext";

const host = typeof window !== "undefined" ? window.location.hostname : "";
const apiUrl = process.env.NEXT_PUBLIC_API_URL === 'https://mainapp.shikshaprime.com:8081/api' ? 
`${process.env.NEXT_PUBLIC_API_URL.replace("mainapp.shikshaprime.com", host)}` : process.env.NEXT_PUBLIC_API_URL;


const apiClient = axios.create({
  baseURL: apiUrl || "http://localhost:8080/api",
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Attach token automatically from localStorage
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach tenant from cookie
  if (typeof document !== "undefined") {
    const tenantCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tenant="));
    if (tenantCookie) {
      const tenant = tenantCookie.split("=")[1];
      config.headers["x-tenant"] = tenant;
    }
  }

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {    
    let message = "Something went wrong. Please try again.";
    if (error.response) {
      const data: any = error.response.data;
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (error.response.status === 401) {
        message = "Unauthorized. Please log in again.";
        const logout = getLogoutFn();
        if (logout) logout();
      } else if (error.response.status === 403) {
        message = "Access denied. You don’t have permission.";
      } else if (error.response.status === 500) {
        message = "Server error. Please try later.";
      }
    } else if (error.request) {
      message = "No response from server. Check your connection.";
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;