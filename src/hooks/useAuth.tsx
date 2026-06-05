import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, clearSession, saveSession } from '../services/auth';
import { User } from '../services/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: (updated: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(u => {
      setUserState(u);
      setLoading(false);
    });
  }, []);

  const setUser = (u: User | null) => setUserState(u);

  const logout = async () => {
    await clearSession();
    setUserState(null);
  };

  const refreshUser = async (updated: User) => {
    await saveSession(updated);
    setUserState(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
