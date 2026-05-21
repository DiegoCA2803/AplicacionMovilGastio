import api from './api';

export const alertService = {
  getAlertsHistory: async () => {
    try {
      const response = await api.get('/alerts');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
