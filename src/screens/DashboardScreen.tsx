import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { sensorService } from '../services/sensorService';
import { commandService } from '../services/commandService';
import { dateFormatter } from '../utils/dateFormatter';

// Este ID se obtendrá dinámicamente de la API
let SENSOR_ID = '';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const alertAnim = React.useRef(new Animated.Value(0)).current;
  const [readingsHistory, setReadingsHistory] = useState<any[]>([]);

  const fetchSensorData = useCallback(async () => {
    try {
      // 0. Si no tenemos el SENSOR_ID, lo buscamos de la lista
      if (!SENSOR_ID) {
        const sensors = await sensorService.getSensors();
        if (sensors && sensors.length > 0) {
          SENSOR_ID = sensors[0].id;
        } else {
          store.setConnectionStatus(false);
          return;
        }
      }

      let isActuallyConnected = false;

      // 1. Verificamos la salud del sensor
      try {
        const healthResponse = await sensorService.getHealth(SENSOR_ID);
        if (healthResponse?.health_status) {
          isActuallyConnected = healthResponse.diagnostics?.mqtt_connected ?? true;
        }
      } catch (healthError) {
         isActuallyConnected = false;
      }

      // Evitamos actualizaciones de estado si ya sabíamos que estaba desconectado y falló la API
      // Pero si falla solo la conexión MQTT, igual queremos traer el historial.
      
      // 2. Intentamos obtener los datos del sensor
      try {
        const data = await sensorService.getCurrentReading(SENSOR_ID);
        if (data && data.reading) {
          store.updateSensorData({
            gasPpm: data.reading.gas_ppm || 0,
            temperature: data.reading.temperature_c || 0,
            humidity: data.reading.humidity_percent || 0,
          });
        }
      } catch (sensorError) {
        // Ignoramos si no hay lectura actual
      }

      // 3. Obtenemos el historial de lecturas y forzamos la actualización
      try {
        const historyData = await sensorService.getReadingsHistory(SENSOR_ID, 10);
        if (historyData && historyData.readings && historyData.readings.length > 0) {
          setReadingsHistory(historyData.readings.reverse()); // Reverse para que el último dato quede a la derecha del gráfico
          
          // Si el endpoint de current falló, tomamos el valor del historial más reciente
          const latest = historyData.readings[historyData.readings.length - 1];
          if (latest) {
            store.updateSensorData({
              gasPpm: latest.gas_ppm || latest.gas || 0,
              temperature: latest.temperature_c || 0,
              humidity: latest.humidity_percent || 0,
            });
          }
        }
      } catch (historyError) {
        // Silencioso si falla el historial
      }

      // 4. Actualizamos el estado de conexión al final para evitar parpadeos visuales (flickering)
      store.setConnectionStatus(isActuallyConnected);

    } catch (error) {
      // Ignorar para no bloquear la UI
    }
  }, [store]);

  useEffect(() => {
    fetchSensorData(); 
    const interval = setInterval(() => {
      fetchSensorData();
    }, 2000); 
    
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
        // Cerrar válvula
        await commandService.cerrarValvula(SENSOR_ID);
        store.toggleValve();
      } else {
        // Abrir válvula (Actualmente no soportado)
        try {
          await commandService.abrirValvula(SENSOR_ID);
          store.toggleValve();
        } catch (error: any) {
          Alert.alert('No soportado', error.message || 'La acción no está implementada en el backend actual.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo comunicar con el sistema para cambiar el estado de la válvula.');
    }
  };

  const handleToggleFan = async () => {
    if (store.isAlertActive) {
      Alert.alert('Bloqueado', 'No se puede apagar el disipador mientras exista una alerta activa por seguridad.');
      return; 
    }
    
    try {
      if (store.fanOn) {
        await commandService.apagarVentilador(SENSOR_ID);
      } else {
        await commandService.activarVentilador(SENSOR_ID);
      }
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
  
  const displayGasColor = gasColor;

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
          <TouchableOpacity onPress={() => store.logout()} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status indicator row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, !store.isConnected && styles.statusBadgeOffline]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: !store.isConnected ? colors.textSecondary : store.isAlertActive ? colors.danger : colors.success }
            ]} />
            <Text style={styles.statusText}>
              {!store.isConnected ? 'SISTEMA DESCONECTADO' : store.isAlertActive ? 'ESTADO: ALERTA' : 'SISTEMA EN LÍNEA'}
            </Text>
          </View>
        </View>
        
        {/* Main Gas Indicator */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>NIVEL DE GAS</Text>
          <View style={styles.gasIndicatorContainer}>
            <Text style={[styles.gasValue, { color: displayGasColor }]}>
              {Math.round(store.sensorData?.gasPpm || 0)}
            </Text>
            <Text style={styles.gasUnit}>PPM</Text>
          </View>
          
          <View style={styles.barBackground}>
            <Animated.View style={[
              styles.barFill, 
              { 
                width: `${Math.min(100, ((store.sensorData?.gasPpm || 0) / 3000) * 100)}%`,
                backgroundColor: displayGasColor 
              }
            ]} />
          </View>
          
          <Text style={styles.statusLabel}>
            {!store.isConnected ? 'ESPERANDO DATOS...' :
             store.alertLevel === 'critical' ? 'CRÍTICO: RIESGO ALTO DE EXPLOSIÓN' : 
             store.alertLevel === 'dangerous' ? 'NIVEL MEDIO: PRECAUCIÓN' : 
             'NIVEL NORMAL DE GAS'}
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
                { 
                  backgroundColor: store.valveOpen ? 'transparent' : '#EF4444',
                  borderColor: store.valveOpen ? '#334155' : '#B91C1C'
                }
              ]}
              onPress={handleToggleValve}
              disabled={!store.isConnected}
            >
              <Text style={[styles.toggleButtonText, { color: store.valveOpen ? '#E2E8F0' : '#FFFFFF' }]}>
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
                {store.isAlertActive ? 'Bloqueado (Protocolo de Alerta)' : 'Control manual'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggleButton, 
                { 
                  backgroundColor: store.fanOn ? colors.primary : 'transparent',
                  borderColor: store.fanOn ? colors.primary : '#334155'
                },
                (store.isAlertActive || !store.isConnected) && styles.buttonDisabled
              ]}
              onPress={handleToggleFan}
              activeOpacity={store.isAlertActive ? 1 : 0.7}
              disabled={!store.isConnected}
            >
              <Text style={[styles.toggleButtonText, { color: store.fanOn ? '#FFFFFF' : '#E2E8F0' }]}>
                {store.fanOn ? 'ENCENDIDO' : 'APAGAR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Readings History Chart */}
        <Text style={styles.sectionTitle}>HISTORIAL (Gráfico en Vivo)</Text>
        <View style={styles.card}>
          {readingsHistory.length === 0 ? (
            <Text style={styles.historyEmptyText}>Recopilando datos en tiempo real...</Text>
          ) : (
            <View style={{ height: 180, width: '100%', marginTop: 10 }}>
              {(() => {
                // Escala fija: 0 a 3000 para que 600 se vea abajo como normal
                const maxPpm = 3000;
                const minPpm = 0;
                const range = maxPpm - minPpm;
                
                const width = 300; // Ancho base de referencia
                const height = 140; // Alto
                const padding = 10;
                
                const points = readingsHistory.map((r, i) => {
                  const x = padding + (i / (readingsHistory.length - 1)) * (width - padding * 2);
                  const y = height - padding - (((r.gas_ppm || 0) - minPpm) / range) * (height - padding * 2);
                  return { x, y, value: r.gas_ppm || 0 };
                });

                const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
                
                // Area base para gradiente
                const areaData = `${pathData} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;

                return (
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    {/* Y-Axis Labels */}
                    <View style={{ width: 35, justifyContent: 'space-between', paddingVertical: padding }}>
                      <Text style={{ color: '#8A94A6', fontSize: 10 }}>3000</Text>
                      <Text style={{ color: '#8A94A6', fontSize: 10 }}>1500</Text>
                      <Text style={{ color: '#8A94A6', fontSize: 10 }}>0</Text>
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                        <Defs>
                          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.0" />
                          </LinearGradient>
                        </Defs>
                        
                        {/* Background Grid Lines */}
                        {[0, 0.5, 1].map((ratio, i) => (
                          <Path 
                            key={`grid-${i}`}
                            d={`M 0 ${height - padding - ratio * (height - padding * 2)} L ${width} ${height - padding - ratio * (height - padding * 2)}`} 
                            stroke="#111111" 
                            strokeWidth="1" 
                          />
                        ))}

                        <Polygon points={areaData.replace(/M|L|Z/g, '')} fill="url(#gradient)" />
                        <Path d={pathData} fill="none" stroke={colors.primary} strokeWidth="2" />
                        
                        {points.map((p, i) => (
                          <Circle key={i} cx={p.x} cy={p.y} r="3" fill="#000000" stroke={colors.primary} strokeWidth="2" />
                        ))}
                      </Svg>
                    </View>
                  </View>
                );
              })()}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingLeft: 35 }}>
                <Text style={{ color: '#666666', fontSize: 10 }}>-20 seg</Text>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>AHORA</Text>
              </View>
            </View>
          )}
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
    backgroundColor: '#000000', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    marginRight: 16,
    position: 'relative',
  },
  logoutBtn: {
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  statusRow: {
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusBadgeOffline: {
    opacity: 0.6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#111111',
  },
  cardTitle: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  gasIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  gasValue: {
    fontSize: 64,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -2,
    lineHeight: 70,
  },
  gasUnit: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginLeft: 8,
  },
  barBackground: {
    height: 2,
    backgroundColor: '#111111',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 1,
  },
  statusLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 16,
    paddingLeft: 4,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  controlSubtitle: {
    fontSize: 11,
    color: '#666666',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  toggleButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    pointerEvents: 'none',
    justifyContent: 'flex-start',
  },
  alertContent: {
    backgroundColor: '#EF4444',
    marginTop: 60,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  historyEmptyText: {
    color: '#8A94A6',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  }
});
