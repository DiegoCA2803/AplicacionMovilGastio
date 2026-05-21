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
    let newAlertLevel: 'none' | 'dangerous' | 'critical' = 'none';
    if (data.gasPpm >= 1300) {
      newAlertLevel = 'critical';
    } else if (data.gasPpm >= 1000) {
      newAlertLevel = 'dangerous';
    }

    const isAlertActive = newAlertLevel === 'critical';

    let newFanOn = state.fanOn;
    let newValveOpen = state.valveOpen;

    if (isAlertActive) {
      newFanOn = true;
      newValveOpen = false;
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
    if (state.isAlertActive && state.fanOn) {
      return state;
    }
    return { fanOn: !state.fanOn };
  }),
}));
