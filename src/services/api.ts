import axios from 'axios';

// Crea una instancia de Axios con la URL base de nuestro servidor
const api = axios.create({
  baseURL: 'https://api.gastio.space',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor: Atrapa cada petición ANTES de enviarse al servidor.
// Sirve para inyectar automáticamente el "access_token" (Authorization: Bearer <token>)
// a todas las rutas, para no tener que ponerlo manualmente una por una.
api.interceptors.request.use((config) => {
  // Aquí iría la lógica para leer el token guardado (ej. AsyncStorage)
  // const token = getAuthToken();
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
