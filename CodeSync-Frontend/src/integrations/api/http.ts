import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codesync_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('codesync_refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('codesync_access_token', accessToken);
          localStorage.setItem('codesync_refresh_token', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('codesync_access_token');
          localStorage.removeItem('codesync_refresh_token');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);
