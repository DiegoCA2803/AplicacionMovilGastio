import api from './api';

export const alertService = {
  getAlertsHistory: async (sensorId?: string) => {
    try {
      const url = sensorId ? `/alerts?sensor_id=${sensorId}&limit=10` : '/alerts';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
