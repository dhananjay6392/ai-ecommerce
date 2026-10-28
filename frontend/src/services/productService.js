import api from './api';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_REVIEWS, SEARCH_SUGGESTIONS } from '../data/mockData';

/**
 * IntelliCart Product & Catalog Service
 * Seamlessly interfaces with MongoDB backend REST API with resilient fallback.
 */

export const getFeaturedProducts = async (limit = 6) => {
  try {
    const res = await api.get(`/products/featured?limit=${limit}`);
    if (res && res.products && res.products.length > 0) {
      return res.products;
    }
  } catch (err) {
    console.warn('[ProductService] Backend offline, falling back to mock featured items:', err.message);
  }
  return MOCK_PRODUCTS.filter((p) => p.featured).slice(0, limit);
};

export const getTrendingProducts = async (limit = 4) => {
  try {
    const res = await api.get(`/products/trending?limit=${limit}`);
    if (res && res.products && res.products.length > 0) {
      return res.products;
    }
  } catch (err) {
    console.warn('[ProductService] Backend offline, falling back to mock trending items:', err.message);
  }
  return MOCK_PRODUCTS.filter((p) => p.trending).slice(0, limit);
};

export const getRecommendedProducts = async (productId = null, limit = 4) => {
  try {
    if (productId) {
      const res = await api.get(`/products?limit=8`);
      if (res && res.products && res.products.length > 0) {
        return res.products.filter((p) => p._id !== productId).slice(0, limit);
      }
    } else {
      const res = await api.get(`/products/featured?limit=${limit}`);
      if (res && res.products && res.products.length > 0) {
        return res.products;
      }
    }
  } catch (err) {
    console.warn('[ProductService] Recommended fallback:', err.message);
  }

  if (productId) {
    const current = MOCK_PRODUCTS.find((p) => p._id === productId);
    const related = MOCK_PRODUCTS.filter(
      (p) => p._id !== productId && (!current || p.categorySlug === current.categorySlug)
    );
    if (related.length >= limit) return related.slice(0, limit);
    return [...related, ...MOCK_PRODUCTS.filter((p) => p._id !== productId && !related.includes(p))].slice(0, limit);
  }
  return MOCK_PRODUCTS.filter((p) => p.recommended).slice(0, limit);
};

export const getDealsProducts = async () => {
  try {
    const res = await api.get('/products?limit=30');
    if (res && res.products && res.products.length > 0) {
      const deals = res.products.filter((p) => (p.discountPercentage > 0 || p.discount > 0));
      if (deals.length > 0) {
        return deals.sort((a, b) => (b.discountPercentage || b.discount || 0) - (a.discountPercentage || a.discount || 0));
      }
    }
  } catch (err) {
    console.warn('[ProductService] Deals fallback:', err.message);
  }
  return MOCK_PRODUCTS.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
};

export const getCategories = async () => {
  try {
    const res = await api.get('/categories');
    if (res && (res.categories || res.data) && (res.categories?.length > 0 || res.data?.length > 0)) {
      return res.categories || res.data;
    }
  } catch (err) {
    console.warn('[ProductService] Categories fallback:', err.message);
  }
  return MOCK_CATEGORIES;
};

export const getBrands = async () => {
  try {
    const res = await api.get('/products/brands');
    if (res && res.brands && res.brands.length > 0) {
      return res.brands;
    }
  } catch (err) {
    console.warn('[ProductService] Brands fallback:', err.message);
  }
  const brandsSet = new Set(MOCK_PRODUCTS.map((p) => p.brand));
  return Array.from(brandsSet).sort();
};

export const getProductById = async (id) => {
  try {
    const res = await api.get(`/products/${id}`);
    if (res && (res.product || res.data)) {
      return res.product || res.data;
    }
  } catch (err) {
    console.warn('[ProductService] Product detail fallback:', err.message);
  }
  const found = MOCK_PRODUCTS.find((p) => p._id === id || p.slug === id);
  return found || MOCK_PRODUCTS[0];
};

export const getProductReviews = async (productId) => {
  try {
    const res = await api.get(`/products/${productId}/reviews`);
    if (res && (res.reviews || res.data)) {
      return {
        reviews: res.reviews || res.data || [],
        sentimentStats: res.sentimentStats || {
          positivePercentage: 88,
          neutralPercentage: 9,
          negativePercentage: 3,
        },
        count: res.count || res.reviews?.length || 0,
      };
    }
  } catch (err) {
    console.warn('[ProductService] Reviews fallback:', err.message);
  }
  const reviews = MOCK_REVIEWS.filter((r) => r.productId === productId || !r.productId);
  return {
    reviews: reviews.length > 0 ? reviews : MOCK_REVIEWS,
    sentimentStats: {
      positivePercentage: 88,
      neutralPercentage: 9,
      negativePercentage: 3,
    },
    count: reviews.length || 3,
  };
};

export const queryProducts = async ({
  search = '',
  category = '',
  brand = '',
  sort = 'featured',
  minPrice = '',
  maxPrice = '',
  minRating = '',
  inStock = false,
  page = 1,
  limit = 12,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minRating) params.set('rating', minRating);
    if (inStock) params.set('inStock', 'true');
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const res = await api.get(`/products?${params.toString()}`);
    if (res && res.products) {
      return {
        products: res.products,
        total: res.total || res.pagination?.total || res.products.length,
        totalPages: res.totalPages || res.pagination?.totalPages || 1,
        page: res.pagination?.page || page,
        limit: res.pagination?.limit || limit,
      };
    }
  } catch (err) {
    console.warn('[ProductService] Product query fallback:', err.message);
  }

  // Client-side fallback if backend request fails
  let list = [...MOCK_PRODUCTS];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  }

  if (category) {
    list = list.filter((p) => p.categorySlug === category || p.category?._id === category || p.category?.slug === category);
  }

  if (brand) {
    const brandList = brand.split(',').map((b) => b.trim().toLowerCase());
    list = list.filter((p) => brandList.includes(p.brand.toLowerCase()));
  }

  if (minPrice) {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) list = list.filter((p) => p.price >= min);
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) list = list.filter((p) => p.price <= max);
  }

  if (minRating) {
    const r = parseFloat(minRating);
    if (!isNaN(r)) list = list.filter((p) => (p.averageRating || p.rating || 0) >= r);
  }

  if (inStock) {
    list = list.filter((p) => p.stock > 0);
  }

  if (sort === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    list.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
  } else if (sort === 'sales') {
    list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  } else if (sort === 'newest') {
    list.reverse();
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;

  return {
    products: list.slice(startIndex, startIndex + limit),
    total,
    totalPages,
    page,
    limit,
  };
};

export const getSearchSuggestions = () => SEARCH_SUGGESTIONS;
