import api from './api';

export const sensorService = {
  getSensors: async () => {
    try {
      const response = await api.get('/sensors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSensorDetails: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentReading: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/latest-gas`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getHealth: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/health`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getReadingsHistory: async (sensorId: string, limit: number = 20) => {
    try {
      const start = '2020-01-01T00:00:00';
      const end = '2030-01-01T00:00:00';
      const response = await api.get(`/sensors/${sensorId}/readings?start=${start}&end=${end}&limit=${limit}`);
      return response.data; 
    } catch (error) {
      throw error;
    }
  }
};
