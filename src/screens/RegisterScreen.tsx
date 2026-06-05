import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { register, linkBiometric, isBiometricAvailable } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onRegister: () => void;
  onBack: () => void;
}

export function RegisterScreen({ onRegister, onBack }: Props) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvail, setBiometricAvail] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
    isBiometricAvailable().then(setBiometricAvail);
  }, []);

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    // Use email as username — guaranteed unique since email is also unique
    const derivedUsername = email.toLowerCase().trim();
    setLoading(true);
    setError('');
    const result = await register(derivedUsername, email, password);
    if (!result.success || !result.user) {
      setLoading(false);
      setError(result.error ?? 'Registration failed.');
      return;
    }
    if (enableBiometric && biometricAvail) {
      await linkBiometric(result.user);
    }
    setLoading(false);
    setUser(result.user);
    onRegister();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#04040A', '#0A0814', '#080410', '#04040A']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%',
            maxWidth: 380,
            alignSelf: 'center',
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Begin Your Journey</Text>
            <Text style={styles.subtitle}>Join the Order of TrumpCard</Text>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerSym}>✦</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Email field — single entry point */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email address"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={false}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor={Colors.gold}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>
          </View>

          {/* Password fields */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                selectionColor={Colors.gold}
                textContentType="newPassword"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                selectionColor={Colors.gold}
                textContentType="newPassword"
              />
            </View>
          </View>

          {/* Biometric toggle */}
          {biometricAvail && (
            <View style={styles.biometricRow}>
              <View>
                <Text style={styles.biometricLabel}>Enable Fingerprint Login</Text>
                <Text style={styles.biometricSub}>Unlock with your fingerprint</Text>
              </View>
              <Switch
                value={enableBiometric}
                onValueChange={setEnableBiometric}
                trackColor={{ false: Colors.border, true: Colors.goldDark }}
                thumbColor={enableBiometric ? Colors.gold : Colors.textMuted}
              />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Register button */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B6914', '#C9A84C', '#FFD700', '#C9A84C', '#8B6914']}
              style={styles.registerBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.backgroundDeep} />
              ) : (
                <Text style={styles.registerBtnText}>CLAIM YOUR DESTINY</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to login */}
          <View style={styles.backRow}>
            <Text style={styles.backPrompt}>Already initiated? </Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backLink}>Return to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Extra bottom padding so content clears the keyboard */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#04040A' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },
  header: { alignItems: 'center', marginBottom: 18 },
  title: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xxl,
    color: Colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: Typography.serifItalic,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 1.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: 200,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.goldDark, opacity: 0.6 },
  dividerSym: { color: Colors.gold, fontSize: 12, marginHorizontal: 10 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontFamily: Typography.displayBold,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontFamily: Typography.serif,
    fontSize: Typography.base,
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  biometricLabel: {
    fontFamily: Typography.displayBold,
    fontSize: 12,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  biometricSub: {
    fontFamily: Typography.serif,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontFamily: Typography.serif,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 10,
  },
  registerBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  registerBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  registerBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 14,
    color: Colors.backgroundDeep,
    letterSpacing: 4,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  backPrompt: { fontFamily: Typography.serif, fontSize: 14, color: Colors.textSecondary },
  backLink: {
    fontFamily: Typography.serifItalic,
    fontSize: 14,
    color: Colors.goldLight ?? Colors.gold,
    textDecorationLine: 'underline',
  },
});
