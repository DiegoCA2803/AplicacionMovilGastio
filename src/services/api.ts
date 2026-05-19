import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.gastio.space/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token si lo tuviéramos
api.interceptors.request.use((config) => {
  // const token = getAuthToken();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
