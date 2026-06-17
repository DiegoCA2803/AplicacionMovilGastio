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
        login(response.user?.email || email.trim(), response.access_token);
      } else {
        setError('Respuesta inesperada del servidor.');
        setLoading(false);
      }
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 422) {
          setError('Contraseña incorrecta o usuario inválido.');
        } else if (err.response.status === 404) {
          setError('El usuario no existe.');
        } else {
          setError(`Error del servidor (${err.response.status}). Intente más tarde.`);
        }
      } else {
        setError('No se pudo conectar con el servidor. Verifique su internet.');
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
          <Text style={styles.subtitle}>SISTEMA DE DETECCIÓN</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: '#0A0A0A',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111111',
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
    color: '#666666',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#000000',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#111111',
  },
  button: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
