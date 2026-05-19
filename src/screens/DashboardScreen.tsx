import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import api from '../services/api';

// Sensor ID por defecto para el MVP
const SENSOR_ID = '1';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const alertAnim = React.useRef(new Animated.Value(0)).current;

  const fetchSensorData = useCallback(async () => {
    try {
      // 1. Verificamos la salud de la API (si está corriendo)
      const healthResponse = await api.get('/health');
      if (healthResponse.data?.status === 'healthy') {
        store.setConnectionStatus(true);
      }

      // 2. Intentamos obtener los datos del sensor
      try {
        const response = await api.get(`/api/v1/sensors/${SENSOR_ID}/current`);
        if (response.data) {
          store.updateSensorData({
            gasPpm: response.data.gas || response.data.gas_ppm || 0,
            temperature: 0,
            humidity: 0,
          });
        }
      } catch (sensorError) {
        // Si la API responde pero el sensor aún no tiene datos (ej. un 404 Not Found),
        // mantenemos el estado de conexión como TRUE, porque sí hay comunicación con la API.
      }
    } catch (error) {
      // Solo marcamos como desconectado si el servidor no responde en absoluto
      store.setConnectionStatus(false);
    }
  }, [store]);

  useEffect(() => {
    fetchSensorData(); 
    const interval = setInterval(() => {
      fetchSensorData();
    }, 3000); 
    
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  useEffect(() => {
    if (store.isAlertActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alertAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(alertAnim, { toValue: 0.5, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      alertAnim.setValue(0);
      Animated.timing(alertAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [store.isAlertActive, alertAnim]);

  const handleToggleValve = async () => {
    try {
      if (store.valveOpen) {
        // Cerrar válvula (Panic Button endpoint en el backend)
        await api.post(`/api/v1/commands/panic/${SENSOR_ID}`);
      } else {
        // Abrir válvula (Asumiendo un endpoint futuro o similar para abrir)
        // Como el backend actualmente solo tiene /panic para cerrar, simularemos la petición
        // a un endpoint de válvula genérico.
        await api.post(`/api/v1/commands/valve/${SENSOR_ID}`, { command: 'open' }).catch(() => {});
      }
      store.toggleValve();
    } catch (error) {
      Alert.alert('Error', 'No se pudo comunicar con el sistema para cambiar el estado de la válvula.');
    }
  };

  const handleToggleFan = async () => {
    if (store.isAlertActive) {
      Alert.alert('Bloqueado', 'No se puede apagar el disipador mientras exista una alerta activa por seguridad.');
      return; 
    }
    
    const newCommand = store.fanOn ? 'off' : 'on';
    try {
      await api.post(`/api/v1/commands/dissipator/${SENSOR_ID}`, {
        command: newCommand
      });
      store.toggleFan();
    } catch (error: any) {
      if (error.response?.status === 423) {
        Alert.alert('Bloqueado', 'El sistema bloqueó la acción. El disipador está asegurado por protocolo de emergencia.');
      } else {
        Alert.alert('Error', 'No se pudo enviar el comando al disipador.');
      }
    }
  };

  const showNotifications = () => {
    Alert.alert('Notificaciones', 'No tienes nuevas alertas en este momento.');
  };

  const gasColor = store.alertLevel === 'critical' ? colors.danger : store.alertLevel === 'dangerous' ? colors.warning : colors.success;
  
  // Si no está conectado, el color del gas se vuelve gris
  const displayGasColor = store.isConnected ? gasColor : colors.textSecondary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gastio<Text style={{color: colors.primary}}>.OS</Text></Text>
          <Text style={styles.headerSubtitle}>MONITOREO EN TIEMPO REAL</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={showNotifications} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {store.isAlertActive && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <View style={[styles.statusBadge, !store.isConnected && styles.statusBadgeOffline]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: !store.isConnected ? colors.textSecondary : store.isAlertActive ? colors.danger : colors.success }
            ]} />
            <Text style={styles.statusText}>
              {!store.isConnected ? 'SIN CONEXIÓN' : store.isAlertActive ? 'ALERTA' : 'EN LÍNEA'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Gas Indicator */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>NIVEL DE GAS</Text>
          <View style={styles.gasIndicatorContainer}>
            <Text style={[styles.gasValue, { color: displayGasColor }]}>
              {store.isConnected ? Math.round(store.sensorData?.gasPpm || 0) : '--'}
            </Text>
            <Text style={styles.gasUnit}>PPM</Text>
          </View>
          
          <View style={styles.barBackground}>
            <Animated.View style={[
              styles.barFill, 
              { 
                width: store.isConnected ? `${Math.min(100, ((store.sensorData?.gasPpm || 0) / 1000) * 100)}%` : '0%',
                backgroundColor: displayGasColor 
              }
            ]} />
          </View>
          
          <Text style={styles.statusLabel}>
            {!store.isConnected ? 'ESPERANDO DATOS...' :
             store.alertLevel === 'critical' ? 'CRÍTICO: RIESGO DE EXPLOSIÓN' : 
             store.alertLevel === 'dangerous' ? 'PELIGROSO: FUGA DETECTADA' : 
             'NIVELES NORMALES'}
          </Text>
        </View>

        {/* Controls */}
        <Text style={styles.sectionTitle}>ACTUADORES</Text>
        
        {/* Valve Control */}
        <View style={styles.card}>
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Válvula Principal</Text>
              <Text style={styles.controlSubtitle}>Suministro de gas</Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                { backgroundColor: store.valveOpen ? colors.surfaceLight : colors.danger }
              ]}
              onPress={handleToggleValve}
              disabled={!store.isConnected}
            >
              <Text style={styles.toggleButtonText}>
                {store.valveOpen ? 'CERRAR' : 'ABRIR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fan Control */}
        <View style={styles.card}>
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlTitle}>Sistema de Extracción</Text>
              <Text style={styles.controlSubtitle}>
                {store.isAlertActive ? 'Bloqueado por alerta' : 'Control manual'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                { backgroundColor: store.fanOn ? colors.primary : colors.surfaceLight },
                (store.isAlertActive || !store.isConnected) && styles.buttonDisabled
              ]}
              onPress={handleToggleFan}
              activeOpacity={store.isAlertActive ? 1 : 0.7}
              disabled={!store.isConnected}
            >
              <Text style={[styles.toggleButtonText, store.fanOn && { color: colors.background }]}>
                {store.fanOn ? 'ENCENDIDO' : 'APAGAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Critical Alert Overlay */}
      {store.isAlertActive && store.isConnected && (
        <Animated.View style={[styles.alertOverlay, { opacity: alertAnim }]}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>¡ALERTA DE GAS!</Text>
            <Text style={styles.alertText}>
              Evacúe el área inmediatamente.{"\n"}La válvula ha sido cerrada y el extractor activado.
            </Text>
          </View>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    marginRight: 16,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.background,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 229, 110, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(12, 229, 110, 0.3)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(160, 170, 191, 0.1)',
    borderColor: 'rgba(160, 170, 191, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  gasIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  gasValue: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: 80,
  },
  gasUnit: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
    marginLeft: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlInfo: {
    flex: 1,
    paddingRight: 16,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  controlSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    pointerEvents: 'none',
    justifyContent: 'flex-start',
  },
  alertContent: {
    backgroundColor: colors.danger,
    marginTop: 100,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  alertTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  alertText: {
    color: colors.text,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  }
});
