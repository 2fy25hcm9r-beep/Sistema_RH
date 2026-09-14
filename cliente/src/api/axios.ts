/**
 * Configuración de Axios para llamadas HTTP al backend.
 *
 * - Define la baseURL y los headers por defecto.
 * - Agrega el token JWT automáticamente en cada request.
 * - Renueva el token si expira y redirige a login si falla.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy configurado en vite.config.ts
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para agregar el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para renovar el token si expira y redirigir a login si falla
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/token/refresh/', { refresh: refreshToken });
          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
