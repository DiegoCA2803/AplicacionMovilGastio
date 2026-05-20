import api from './api';

export const commandService = {
  // Envía una orden de emergencia al ESP32 para cerrar inmediatamente la válvula de gas.
  cerrarValvula: async (sensorId: string) => {
    return api.post(`/commands/panic/${sensorId}`);
  },

  // (Pendiente) Envía una orden para abrir la válvula. El backend actual no lo soporta.
  abrirValvula: async (sensorId: string) => {
    throw new Error("El backend actual no soporta la acción de abrir la válvula.");
  },

  // Envía una orden al ESP32 para encender el ventilador/disipador.
  activarVentilador: async (sensorId: string) => {
    return api.post(`/commands/dissipator/${sensorId}`, { command: 'on' });
  },

  // Envía una orden al ESP32 para apagar el ventilador/disipador de forma segura.
  apagarVentilador: async (sensorId: string) => {
    return api.post(`/commands/dissipator/${sensorId}`, { command: 'off' });
  }
};
