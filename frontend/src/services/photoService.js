import axios from "axios";
import { getToken } from "./authService";

/**
 * Photo Service
 * API client for photo-related operations
 */

// URL gốc của API backend - tự động dùng hostname hiện tại
// Cho phép truy cập từ localhost hoặc IP trong mạng LAN
const getBackendUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8080/api`;
};

const API_BASE_URL = getBackendUrl();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle connection errors
    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("Network Error")
    ) {
      console.error(
        "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.",
      );
      error.message =
        "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.";
    }

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Unauthorized or Forbidden - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login page
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Fetch all photos with GPS coordinates
 */
export const fetchPhotosWithGps = async () => {
  try {
    const response = await apiClient.get("/photos/with-gps");
    return response.data;
  } catch (error) {
    console.error("Error fetching photos with GPS:", error);
    throw error;
  }
};

/**
 * Fetch all photos
 */
export const fetchAllPhotos = async () => {
  try {
    const response = await apiClient.get("/photos");
    return response.data;
  } catch (error) {
    console.error("Error fetching all photos:", error);
    throw error;
  }
};

/**
 * Fetch photo by ID
 */
export const fetchPhotoById = async (id) => {
  try {
    const response = await apiClient.get(`/photos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching photo ${id}:`, error);
    throw error;
  }
};

/**
 * Upload a new photo
 */
export const uploadPhoto = async (file, description = "") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }

    // Add GPS coordinates if available
    if (file.latitude && file.longitude) {
      formData.append("latitude", file.latitude);
      formData.append("longitude", file.longitude);
    } else if (
      description &&
      typeof description === "object" &&
      description.latitude &&
      description.longitude
    ) {
      // Handle case where lat/lon passed as 2nd arg object (if refactored) - but let's stick to current signature pattern
      // Actually, better to just check arguments or properties
    }

    // Alternative: Pass explicit args. But for backward compat, let's look at how it's called.
    // The previous call was: uploadPhoto(selectedFile, description)
    // We can change it to: uploadPhoto(selectedFile, description, location)
    // OR attach location to file object.

    const response = await apiClient.post("/photos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
};

/**
 * Delete a photo
 */
export const deletePhoto = async (id) => {
  try {
    await apiClient.delete(`/photos/${id}`);
  } catch (error) {
    console.error(`Error deleting photo ${id}:`, error);
    throw error;
  }
};

/**
 * Update photo location (for photos without GPS)
 */
export const updatePhotoLocation = async (id, latitude, longitude) => {
  try {
    const response = await apiClient.put(`/photos/${id}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating location for photo ${id}:`, error);
    throw error;
  }
};

export default {
  fetchPhotosWithGps,
  fetchAllPhotos,
  fetchPhotoById,
  uploadPhoto,
  deletePhoto,
  updatePhotoLocation,
};
