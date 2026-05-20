import api from './api';

export const sensorService = {
  // Obtiene la lista completa de todos los sensores registrados en el sistema.
  getSensors: async () => {
    try {
      const response = await api.get('/sensors');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtiene todos los detalles de configuración y estado de un sensor en particular.
  getSensorDetails: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Consulta el nivel actual de gas (PPM), temperatura y humedad del sensor.
  getCurrentReading: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/current`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verifica la "salud" del sensor (si está online, atascado, señal WiFi, etc.)
  getHealth: async (sensorId: string) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/health`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtiene el historial de lecturas (limitado a 'limit' registros).
  getReadingsHistory: async (sensorId: string, limit: number = 10) => {
    try {
      const response = await api.get(`/sensors/${sensorId}/readings?limit=${limit}`);
      return response.data; // Devuelve un objeto con { sensor_id, device_id, readings: [...] }
    } catch (error) {
      throw error;
    }
  }
};
