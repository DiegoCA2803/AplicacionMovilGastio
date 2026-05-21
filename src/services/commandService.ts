import api from './api';

export const commandService = {
  cerrarValvula: async (sensorId: string) => {
    return api.post(`/sensors/${sensorId}/commands`, { command: 'VALVE_CLOSE' });
  },

  abrirValvula: async (sensorId: string) => {
    return api.post(`/sensors/${sensorId}/commands`, { command: 'VALVE_OPEN' });
  },

  activarVentilador: async (sensorId: string) => {
    return api.post(`/sensors/${sensorId}/commands`, { command: 'FAN_ON' });
  },

  apagarVentilador: async (sensorId: string) => {
    return api.post(`/sensors/${sensorId}/commands`, { command: 'FAN_OFF' });
  },
};
