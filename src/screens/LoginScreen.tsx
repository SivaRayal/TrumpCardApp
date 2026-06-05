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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { login, loginWithBiometric, hasBiometricLinked, isBiometricAvailable } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const { height: H } = Dimensions.get('window');

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

export function LoginScreen({ onLogin, onRegister }: Props) {
  const { setUser } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvail, setBiometricAvail] = useState(false);
  const [biometricLinked, setBiometricLinked] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(60)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(formTranslate, { toValue: 0, friction: 7, useNativeDriver: true, delay: 300 }),
      Animated.timing(formOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();

    // Floating card animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Check biometric
    Promise.all([isBiometricAvailable(), hasBiometricLinked()]).then(([avail, linked]) => {
      setBiometricAvail(avail);
      setBiometricLinked(linked);
    });
  }, []);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(emailOrUsername, password);
    setLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      onLogin();
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithBiometric();
    setLoading(false);
    if (result.success && result.user) {
      setUser(result.user);
      onLogin();
    } else {
      setError(result.error ?? 'Biometric failed.');
    }
  };

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#04040A', '#08081C', '#100A10', '#04040A']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative card */}
        <Animated.View
          style={[styles.decorCard, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <LinearGradient
            colors={['#0D0D22', '#1A0A18', '#0A0D22']}
            style={styles.miniCard}
          >
            <View style={styles.miniCardBorder} />
            <Text style={styles.miniCardText}>✦ TC ✦</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: titleOpacity, alignItems: 'center' }}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.subtitle}>Your destiny awaits</Text>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerSym}>✦</Text>
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            { opacity: formOpacity, transform: [{ translateY: formTranslate }] },
          ]}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL OR USERNAME</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={emailOrUsername}
                onChangeText={setEmailOrUsername}
                placeholder="Enter your email or username"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor={Colors.gold}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                selectionColor={Colors.gold}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={['#8B6914', '#C9A84C', '#FFD700', '#C9A84C', '#8B6914']}
              style={styles.loginBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.backgroundDeep} />
              ) : (
                <Text style={styles.loginBtnText}>REVEAL YOUR CARD</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Biometric */}
          {biometricAvail && biometricLinked && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometric}
              activeOpacity={0.75}
              disabled={loading}
            >
              <View style={styles.biometricInner}>
                <Text style={styles.biometricIcon}>⬡</Text>
                <Text style={styles.biometricText}>Use Fingerprint</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>New to TrumpCard? </Text>
            <TouchableOpacity onPress={onRegister}>
              <Text style={styles.registerLink}>Begin Your Journey</Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  decorCard: {
    marginBottom: 30,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  miniCard: {
    width: 70,
    height: 100,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardBorder: {
    position: 'absolute',
    top: 5, left: 5, right: 5, bottom: 5,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: 6,
    opacity: 0.8,
  },
  miniCardText: {
    fontSize: 14,
    color: Colors.gold,
    fontFamily: Typography.displayBold,
    letterSpacing: 2,
  },
  welcome: {
    fontFamily: Typography.displayBold,
    fontSize: Typography.xxl,
    color: Colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: Colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontFamily: Typography.serifItalic,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.goldDark,
    opacity: 0.6,
  },
  dividerSym: {
    color: Colors.gold,
    fontSize: 12,
    marginHorizontal: 10,
  },
  form: { width: '100%', maxWidth: 380 },
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
  errorText: {
    fontFamily: Typography.serif,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  loginBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    fontFamily: Typography.displayBold,
    fontSize: 14,
    color: Colors.backgroundDeep,
    letterSpacing: 4,
  },
  biometricBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.goldDark,
    borderRadius: 8,
    paddingVertical: 14,
  },
  biometricInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  biometricIcon: { fontSize: 22, color: Colors.gold },
  biometricText: {
    fontFamily: Typography.displayBold,
    fontSize: 13,
    color: Colors.gold,
    letterSpacing: 2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerPrompt: {
    fontFamily: Typography.serif,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontFamily: Typography.serifItalic,
    fontSize: 14,
    color: Colors.goldLight ?? Colors.gold,
    textDecorationLine: 'underline',
  },
});
