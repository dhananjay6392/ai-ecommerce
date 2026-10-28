import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_API_URL = '@intellicart_custom_api_url';

// Default fallback API URL from environment, or emulator / local address
const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

let cachedApiUrl = null;

/**
 * Get current configured API Base URL
 */
export async function getApiBaseUrl() {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const customUrl = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (customUrl && customUrl.trim()) {
      cachedApiUrl = customUrl.trim().replace(/\/+$/, '');
      return cachedApiUrl;
    }
  } catch (err) {
    console.warn('[Config] Error reading stored API URL:', err);
  }
  cachedApiUrl = DEFAULT_API_URL.replace(/\/+$/, '');
  return cachedApiUrl;
}

/**
 * Set custom runtime API URL (e.g. for testing distributed APK with live server)
 */
export async function setApiBaseUrl(newUrl) {
  try {
    if (!newUrl || !newUrl.trim()) {
      await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
      cachedApiUrl = DEFAULT_API_URL.replace(/\/+$/, '');
      return cachedApiUrl;
    }
    const clean = newUrl.trim().replace(/\/+$/, '');
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, clean);
    cachedApiUrl = clean;
    return cachedApiUrl;
  } catch (err) {
    console.error('[Config] Error saving API URL:', err);
    throw err;
  }
}

/**
 * Reset API Base URL to default environment value
 */
export async function resetApiBaseUrl() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
    cachedApiUrl = DEFAULT_API_URL.replace(/\/+$/, '');
    return cachedApiUrl;
  } catch (err) {
    console.error('[Config] Error resetting API URL:', err);
    return DEFAULT_API_URL;
  }
}

/**
 * Test connectivity and latency to an API base URL
 */
export async function testApiHealth(targetUrl = null) {
  const base = targetUrl ? targetUrl.replace(/\/+$/, '') : await getApiBaseUrl();
  const startTime = Date.now();
  const timeoutMs = 7000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        latency,
        status: data.status || 'ONLINE',
        service: data.service || 'IntelliCart API',
        url: base,
      };
    }
    return {
      success: false,
      latency,
      status: `HTTP ${res.status}`,
      error: `Server returned HTTP ${res.status}`,
      url: base,
    };
  } catch (err) {
    clearTimeout(timer);
    const latency = Date.now() - startTime;
    return {
      success: false,
      latency,
      status: 'UNREACHABLE',
      error: err.name === 'AbortError' ? 'Connection timed out (7s)' : err.message,
      url: base,
    };
  }
}

export const ENDPOINTS = {
  HEALTH: '/health',
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  PRODUCT_SEARCH: '/products/search',
  FEATURED_PRODUCTS: '/products/featured',
  TRENDING_PRODUCTS: '/products/trending',
  CATEGORIES: '/categories',
  // AI Recommendations
  ML_RECOMMENDATIONS: '/ml/recommendations',
  // Cart
  CART: '/cart',
  CART_ITEM: (productId) => `/cart/${productId}`,
  // Wishlist
  WISHLIST: '/wishlist',
  WISHLIST_ITEM: (productId) => `/wishlist/${productId}`,
  WISHLIST_MOVE_TO_CART: (productId) => `/wishlist/${productId}/move-to-cart`,
  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id) => `/orders/${id}`,
  // Payments (Razorpay Test Mode)
  PAYMENT_CREATE_ORDER: '/payments/create-order',
  PAYMENT_VERIFY: '/payments/verify',
};
