import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellicart_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const isAuthenticated = !!currentUser;
  const isAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN';

  // Refresh current user session from /api/auth/me
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('intellicart_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      // If 401 or invalid token, clean state
      if (err.status === 401 || err.message?.includes('token') || err.message?.includes('Access denied')) {
        setCurrentUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('intellicart_token');
        localStorage.removeItem('intellicart_user');
      }
      throw err;
    }
  }, []);

  // Initial session hydration
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const savedToken = localStorage.getItem('token') || localStorage.getItem('intellicart_token');
      // If token exists or checking cookie
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (isMounted && res.success && res.user) {
            setCurrentUser(res.user);
            localStorage.setItem('intellicart_user', JSON.stringify(res.user));
          }
        } catch {
          if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('intellicart_token');
            localStorage.removeItem('intellicart_user');
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to session expired event from API client
    const handleSessionExpired = () => {
      if (isMounted) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('intellicart:session_expired', handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('intellicart:session_expired', handleSessionExpired);
    };
  }, []);

  // Login action
  const login = async (email, password, rememberMe = true) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('intellicart_token', res.token);
        }
        localStorage.setItem('intellicart_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed.');
    } catch (err) {
      throw err;
    }
  };

  // Register action
  const register = async (name, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword: confirmPassword || password,
      });

      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('intellicart_token', res.token);
        }
        localStorage.setItem('intellicart_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        setIsAuthModalOpen(false);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Registration failed.');
    } catch (err) {
      throw err;
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('intellicart_token');
      localStorage.removeItem('intellicart_user');
      setCurrentUser(null);
    }
  };

  // Update profile action
  const updateProfile = async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('intellicart_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  // Wishlist toggle
  const toggleWishlist = async (productId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }

    try {
      const currentList = currentUser.wishlist || [];
      const exists = currentList.includes(productId);
      
      let res;
      if (exists) {
        res = await api.delete(`/wishlist/${productId}`);
      } else {
        res = await api.post(`/wishlist/${productId}`);
      }
      
      if (res.success) {
        // Backend now returns the array of ObjectIds in `res.wishlist`
        const updatedList = res.wishlist || [];
        const updatedUser = { ...currentUser, wishlist: updatedList };
        setCurrentUser(updatedUser);
        localStorage.setItem('intellicart_user', JSON.stringify(updatedUser));
        return !exists; // Return new state (added -> true, removed -> false)
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      // Fallback local toggle in case of network issue
      const currentList = currentUser.wishlist || [];
      const exists = currentList.includes(productId);
      const updatedWishlist = exists
        ? currentList.filter((id) => id !== productId)
        : [...currentList, productId];

      const updatedUser = { ...currentUser, wishlist: updatedWishlist };
      setCurrentUser(updatedUser);
      localStorage.setItem('intellicart_user', JSON.stringify(updatedUser));
      return !exists;
    }
    return false;
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser, // Convenience alias for existing components
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        toggleWishlist,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
