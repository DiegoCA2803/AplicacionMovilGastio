import { create } from 'zustand';

interface SensorData {
  gasPpm: number;
  temperature: number;
  humidity: number;
}

interface AppState {
  isAuthenticated: boolean;
  user: { email: string } | null;
  sensorData: SensorData | null;
  valveOpen: boolean;
  fanOn: boolean;
  isAlertActive: boolean;
  alertLevel: 'none' | 'dangerous' | 'critical';
  isConnected: boolean;
  
  login: (email: string) => void;
  logout: () => void;
  updateSensorData: (data: SensorData) => void;
  setConnectionStatus: (status: boolean) => void;
  toggleValve: () => void;
  toggleFan: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  sensorData: { gasPpm: 0, temperature: 0, humidity: 0 },
  valveOpen: true,
  fanOn: false,
  isAlertActive: false,
  alertLevel: 'none',
  isConnected: false,

  login: (email) => set({ isAuthenticated: true, user: { email } }),
  logout: () => set({ isAuthenticated: false, user: null }),
  
  setConnectionStatus: (status) => set({ isConnected: status }),
  
  updateSensorData: (data) => set((state) => {
    // Evaluamos alertas según los nuevos umbrales
    let newAlertLevel: 'none' | 'dangerous' | 'critical' = 'none';
    if (data.gasPpm >= 1300) {
      newAlertLevel = 'critical';
    } else if (data.gasPpm >= 1000) {
      newAlertLevel = 'dangerous'; // Nivel medio, sin riesgo crítico
    }

    // Solo activamos las alarmas rojas y bloqueos de actuadores en nivel crítico
    const isAlertActive = newAlertLevel === 'critical';

    // Lógica local: si hay alerta crítica, el ventilador debe estar encendido y no se puede apagar manualmente.
    // La válvula se cierra si es crítico (>1300)
    let newFanOn = state.fanOn;
    let newValveOpen = state.valveOpen;

    if (isAlertActive) {
      newFanOn = true; // Auto encendido FR-016
      newValveOpen = false; // Auto cierre FR-002
    }

    return { 
      sensorData: data, 
      alertLevel: newAlertLevel, 
      isAlertActive,
      fanOn: newFanOn,
      valveOpen: newValveOpen
    };
  }),

  toggleValve: () => set((state) => ({ valveOpen: !state.valveOpen })),
  toggleFan: () => set((state) => {
    // FR-018: Impedir apagado manual si hay alerta
    if (state.isAlertActive && state.fanOn) {
      return state;
    }
    return { fanOn: !state.fanOn };
  }),
}));
