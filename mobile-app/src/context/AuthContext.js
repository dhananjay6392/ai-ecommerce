import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

const TOKEN_KEY = '@intellicart_token';
const USER_KEY = '@intellicart_user';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session on launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Fetch fresh user profile in background
          try {
            const res = await api.get(ENDPOINTS.ME);
            if (res && (res.user || res.data)) {
              const freshUser = res.user || res.data;
              setUser(freshUser);
              await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
            }
          } catch (profileErr) {
            console.log('[Auth] Could not refresh profile, using cached user data');
          }
        }
      } catch (err) {
        console.warn('[Auth] Failed to restore session from storage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    const res = await api.post(ENDPOINTS.LOGIN, { email, password });
    if (res && res.success && res.token) {
      const activeUser = res.user || { email };
      setToken(res.token);
      setUser(activeUser);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(activeUser));
      return { success: true, user: activeUser };
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, confirmPassword) => {
    const res = await api.post(ENDPOINTS.REGISTER, {
      name,
      email,
      password,
      confirmPassword: confirmPassword || password,
    });
    if (res && res.success && res.token) {
      const activeUser = res.user || { name, email };
      setToken(res.token);
      setUser(activeUser);
      await AsyncStorage.setItem(TOKEN_KEY, res.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(activeUser));
      return { success: true, user: activeUser };
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await api.post(ENDPOINTS.LOGOUT, {}).catch(() => {});
    } catch (_) {}
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get(ENDPOINTS.ME);
      if (res && (res.user || res.data)) {
        const fresh = res.user || res.data;
        setUser(fresh);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      }
    } catch (err) {
      console.warn('[Auth] refreshProfile failed:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
