import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { createUser, findUserByEmail, findUserByUsername, validateLogin, User } from './database';

const SESSION_KEY = 'trumpcard_session';
const BIOMETRIC_USER_KEY = 'trumpcard_biometric_user';

export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (!username || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return { success: false, error: 'Email already registered.' };
    }
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return { success: false, error: 'Account already exists.' };
    }
    const user = await createUser(username, email, password);
    await saveSession(user);
    return { success: true, user };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Registration failed.' };
  }
}

export async function login(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const user = await validateLogin(emailOrUsername, password);
    if (!user) {
      return { success: false, error: 'Invalid credentials.' };
    }
    await saveSession(user);
    return { success: true, user };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Login failed.' };
  }
}

export async function loginWithBiometric(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) {
      return { success: false, error: 'Biometric authentication not available.' };
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enter TrumpCard',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
    });
    if (!result.success) {
      return { success: false, error: 'Biometric authentication failed.' };
    }
    const stored = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
    if (!stored) {
      return { success: false, error: 'No account linked to biometrics.' };
    }
    const user: User = JSON.parse(stored);
    await saveSession(user);
    return { success: true, user };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Biometric failed.' };
  }
}

export async function linkBiometric(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) {
      return { success: false, error: 'Biometric not available on this device.' };
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm biometric to link',
    });
    if (!result.success) {
      return { success: false, error: 'Authentication cancelled.' };
    }
    await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, JSON.stringify(user));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function hasBiometricLinked(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
  return !!stored;
}

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function saveSession(user: User): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

export async function getSession(): Promise<User | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
