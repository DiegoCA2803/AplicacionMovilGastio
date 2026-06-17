import api from './api';

export const commandService = {
  cerrarValvula: async (sensorId: string) => {
    return api.post(`/commands/valve/${sensorId}`, { command: 'close' });
  },

  abrirValvula: async (sensorId: string) => {
    return api.post(`/commands/valve/${sensorId}`, { command: 'open' });
  },

  activarVentilador: async (sensorId: string) => {
    return api.post(`/commands/dissipator/${sensorId}`, { command: 'on' });
  },

  apagarVentilador: async (sensorId: string) => {
    return api.post(`/commands/dissipator/${sensorId}`, { command: 'off' });
  },
};
