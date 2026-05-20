import api from './api';

export const alertService = {
  // Obtiene el historial completo de las alertas (peligro/crítico) registradas.
  getAlerts: async () => {
    try {
      const response = await api.get('/alerts');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
