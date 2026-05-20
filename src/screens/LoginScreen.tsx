import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { authService } from '../services/authService';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAppStore((state) => state.login);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor, ingresa tus credenciales.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(email.trim(), password);
      if (response && response.access_token) {
        login(response.user?.email || email.trim());
      } else {
        setError('Respuesta inesperada del servidor.');
        setLoading(false);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 404) {
        setError('Credenciales inválidas. Solo personal autorizado.');
      } else {
        setError('Error al intentar conectar con el servidor.');
      }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <Text style={styles.title}>Gastio<Text style={styles.titleHighlight}>.OS</Text></Text>
          <Text style={styles.subtitle}>Sistema Inteligente de Detección</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={styles.input}
              placeholder="operador@gastio.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>AUTENTICAR</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Acceso Restringido • Solo Operadores</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleHighlight: {
    color: '#3B82F6',
  },
  subtitle: {
    fontSize: 12,
    color: '#8A94A6',
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: '#14171C',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1D24',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8A94A6',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1A1D24',
    height: 48,
    borderRadius: 6,
    paddingHorizontal: 16,
    color: '#E2E8F0',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2E37',
  },
  button: {
    backgroundColor: '#3B82F6',
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#8A94A6',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
