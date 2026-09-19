import axios from 'axios';
import { store } from '../store';
import { setCredentials, clearCredentials } from '../store/authSlice';
import { queryClient } from './queryClient';

const BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// A separate bare axios instance for auth operations (no interceptors — prevents loops)
export const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from Redux store on every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — attempt silent token refresh once
// Skip auth endpoints to prevent refresh loops
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/me'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Don't intercept auth endpoints or already-retried requests
    const isAuthEndpoint = AUTH_PATHS.some((p) => original?.url?.includes(p));
    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await authApi.post('/auth/refresh-token', {});
      const newToken: string = res.data.data.accessToken;
      store.dispatch(setCredentials({ accessToken: newToken }));
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      refreshQueue.forEach((cb) => cb(''));
      refreshQueue = [];
      store.dispatch(clearCredentials());
      queryClient.clear();
      // Only redirect if not already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
