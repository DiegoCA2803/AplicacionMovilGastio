import api from './api';

export const authService = {
  // Envía el correo y contraseña al backend para iniciar sesión.
  // Si tiene éxito, devuelve el token de acceso (access_token).
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtiene los datos del usuario actualmente autenticado (requiere token).
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
