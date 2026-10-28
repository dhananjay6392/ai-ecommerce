import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

const LOCAL_CART_KEY = '@intellicart_guest_cart';

const CartContext = createContext({
  items: [],
  itemCount: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  isLoading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Compute calculated amounts
  const subtotal = items.reduce((acc, item) => {
    const price = item.price || (item.product && item.product.price) || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  const shipping = items.length === 0 ? 0 : subtotal >= 5000 ? 0 : 250;
  const total = subtotal + shipping;
  const itemCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Load cart from backend or local storage
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const res = await api.get(ENDPOINTS.CART);
        if (res && res.cart && Array.isArray(res.cart.items)) {
          setItems(res.cart.items);
        } else if (res && Array.isArray(res.data)) {
          setItems(res.data);
        }
      } else {
        const stored = await AsyncStorage.getItem(LOCAL_CART_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          setItems([]);
        }
      }
    } catch (err) {
      console.warn('[Cart] Error loading cart:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Persist guest cart locally
  const saveGuestCart = async (newItems) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
    } catch (err) {
      console.warn('[Cart] Failed to persist guest cart:', err);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const pId = product._id || product.id || product.productId;
    const effectivePrice =
      product.discountPercentage > 0
        ? Math.round(product.price - (product.price * product.discountPercentage) / 100)
        : product.price;

    if (isAuthenticated) {
      try {
        const res = await api.post(ENDPOINTS.CART, {
          productId: pId,
          quantity,
        });
        if (res && res.cart && res.cart.items) {
          setItems(res.cart.items);
        } else {
          await refreshCart();
        }
        return { success: true, message: 'Item added to cart' };
      } catch (err) {
        throw new Error(err.message || 'Failed to add item to cart');
      }
    } else {
      // Guest local cart
      const existingIdx = items.findIndex((it) => {
        const itId = it.product?._id || it.productId || it.product;
        return itId?.toString() === pId?.toString();
      });

      let updated = [...items];
      if (existingIdx > -1) {
        updated[existingIdx].quantity += quantity;
      } else {
        updated.push({
          product,
          productId: pId,
          quantity,
          price: effectivePrice,
        });
      }
      await saveGuestCart(updated);
      return { success: true, message: 'Added to cart' };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    if (isAuthenticated) {
      try {
        const res = await api.put(ENDPOINTS.CART_ITEM(productId), { quantity });
        if (res && res.cart && res.cart.items) {
          setItems(res.cart.items);
        } else {
          await refreshCart();
        }
      } catch (err) {
        throw new Error(err.message || 'Failed to update quantity');
      }
    } else {
      const updated = items.map((it) => {
        const itId = it.product?._id || it.productId || it.product;
        if (itId?.toString() === productId?.toString()) {
          return { ...it, quantity };
        }
        return it;
      });
      await saveGuestCart(updated);
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await api.delete(ENDPOINTS.CART_ITEM(productId));
        if (res && res.cart && res.cart.items) {
          setItems(res.cart.items);
        } else {
          await refreshCart();
        }
      } catch (err) {
        throw new Error(err.message || 'Failed to remove item');
      }
    } else {
      const updated = items.filter((it) => {
        const itId = it.product?._id || it.productId || it.product;
        return itId?.toString() !== productId?.toString();
      });
      await saveGuestCart(updated);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete(ENDPOINTS.CART);
      } catch (_) {}
    }
    setItems([]);
    await AsyncStorage.removeItem(LOCAL_CART_KEY).catch(() => {});
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shipping,
        total,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
