import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('intellicart_cart');
      return saved ? JSON.parse(saved) : { items: [], subtotal: 0, shipping: 0, total: 0 };
    } catch {
      return { items: [], subtotal: 0, shipping: 0, total: 0 };
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchCart = async () => {
    if (user) {
      try {
        const res = await api.get('/cart');
        if (res.success && res.cart) {
          setCart(res.cart);
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Clean up or retain local cart when logged out
      try {
        const saved = localStorage.getItem('intellicart_cart');
        setCart(saved ? JSON.parse(saved) : { items: [], subtotal: 0, shipping: 0, total: 0 });
      } catch {
        setCart({ items: [], subtotal: 0, shipping: 0, total: 0 });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('intellicart_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to persist cart to localStorage', e);
      }
    }
  }, [cart, user]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  const addToCart = async (product, quantity = 1) => {
    if (!product) return false;

    if (product.stock !== undefined && quantity > product.stock) {
      showNotification(`Only ${product.stock} units available in stock.`, 'error');
      return false;
    }

    if (user) {
      try {
        const res = await api.post('/cart', { productId: product._id || product.id, quantity });
        if (res.success && res.cart) {
          setCart(res.cart);
          showNotification(`Added "${product.name}" to your bag.`);
          setIsCartOpen(true);
          return true;
        }
      } catch (error) {
        showNotification(error.message || 'Failed to add item to cart.', 'error');
        return false;
      }
    } else {
      // Local cart fallback
      const existingIndex = cart.items.findIndex(
        (item) => (item.product?._id || item.product?.id || item.product) === (product._id || product.id)
      );
      const currentQtyInCart = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
      const requestedTotal = currentQtyInCart + quantity;

      if (product.stock !== undefined && requestedTotal > product.stock) {
        showNotification(`Only ${product.stock} units available in stock.`, 'error');
        return false;
      }

      const discount = product.discountPercentage || product.discount || 0;
      const effectivePrice =
        discount > 0
          ? Math.round(product.price - (product.price * discount) / 100)
          : product.price;

      let updatedItems = [...cart.items];
      if (existingIndex > -1) {
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: requestedTotal,
          price: effectivePrice,
        };
      } else {
        updatedItems.push({
          product,
          quantity,
          price: effectivePrice,
        });
      }

      // calculate subtotal locally
      const subtotal = updatedItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
      const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 250;
      const total = subtotal + shipping;

      setCart({ items: updatedItems, subtotal, shipping, total });
      showNotification(`Added "${product.name}" to your bag.`);
      setIsCartOpen(true);
      return true;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(productId);
    }
    
    if (user) {
      try {
        const res = await api.put(`/cart/${productId}`, { quantity });
        if (res.success && res.cart) setCart(res.cart);
      } catch (error) {
        showNotification(error.message || 'Failed to update quantity.', 'error');
      }
    } else {
      const updatedItems = cart.items.map((item) => {
        const pId = item.product?._id || item.product?.id || item.product;
        if (pId === productId) {
          return { ...item, quantity };
        }
        return item;
      });
      const subtotal = updatedItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
      const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 250;
      setCart({ items: updatedItems, subtotal, shipping, total: subtotal + shipping });
    }
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        const res = await api.delete(`/cart/${productId}`);
        if (res.success && res.cart) {
          setCart(res.cart);
          showNotification('Item removed from shopping bag.', 'info');
        }
      } catch (error) {
        showNotification(error.message || 'Failed to remove item.', 'error');
      }
    } else {
      const updatedItems = cart.items.filter(
        (item) => (item.product?._id || item.product?.id || item.product) !== productId
      );
      const subtotal = updatedItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
      const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 250;
      setCart({ items: updatedItems, subtotal, shipping, total: subtotal + shipping });
      showNotification('Item removed from shopping bag.', 'info');
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const res = await api.delete('/cart');
        if (res.success && res.cart) setCart(res.cart);
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    } else {
      setCart({ items: [], subtotal: 0, shipping: 0, total: 0 });
    }
  };

  const totalAmount = cart.total !== undefined ? cart.total : cart.items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  const totalItems = cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalAmount,
        totalItems,
        notification,
        showNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

