import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const LOCAL_WISHLIST_KEY = '@intellicart_guest_wishlist';

const WishlistContext = createContext({
  wishlist: [],
  isLoading: false,
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  moveToCart: async () => {},
  refreshWishlist: async () => {},
});

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const res = await api.get(ENDPOINTS.WISHLIST);
        if (res && Array.isArray(res.wishlist)) {
          setWishlist(res.wishlist);
        } else if (res && Array.isArray(res.data)) {
          setWishlist(res.data);
        }
      } else {
        const stored = await AsyncStorage.getItem(LOCAL_WISHLIST_KEY);
        if (stored) {
          setWishlist(JSON.parse(stored));
        } else {
          setWishlist([]);
        }
      }
    } catch (err) {
      console.warn('[Wishlist] Error loading wishlist:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const saveGuestWishlist = async (items) => {
    setWishlist(items);
    try {
      await AsyncStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('[Wishlist] Failed to save guest wishlist:', err);
    }
  };

  const isWishlisted = (productId) => {
    if (!productId) return false;
    return wishlist.some((item) => {
      const id = item._id || item.id || item;
      return id?.toString() === productId?.toString();
    });
  };

  const addToWishlist = async (product) => {
    const pId = product._id || product.id || product;
    if (isAuthenticated) {
      try {
        await api.post(ENDPOINTS.WISHLIST_ITEM(pId));
        await refreshWishlist();
      } catch (err) {
        throw new Error(err.message || 'Failed to add to wishlist');
      }
    } else {
      if (!isWishlisted(pId)) {
        const updated = [...wishlist, product];
        await saveGuestWishlist(updated);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        await api.delete(ENDPOINTS.WISHLIST_ITEM(productId));
        await refreshWishlist();
      } catch (err) {
        throw new Error(err.message || 'Failed to remove from wishlist');
      }
    } else {
      const updated = wishlist.filter((item) => {
        const id = item._id || item.id || item;
        return id?.toString() !== productId?.toString();
      });
      await saveGuestWishlist(updated);
    }
  };

  const toggleWishlist = async (product) => {
    const pId = product._id || product.id || product;
    if (isWishlisted(pId)) {
      await removeFromWishlist(pId);
      return false;
    } else {
      await addToWishlist(product);
      return true;
    }
  };

  const moveToCart = async (productId) => {
    if (isAuthenticated) {
      try {
        await api.post(ENDPOINTS.WISHLIST_MOVE_TO_CART(productId));
        await refreshWishlist();
        await refreshCart();
      } catch (err) {
        throw new Error(err.message || 'Failed to move to cart');
      }
    } else {
      await removeFromWishlist(productId);
      await refreshCart();
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
