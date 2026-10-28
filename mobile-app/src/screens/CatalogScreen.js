import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: Low' },
  { id: 'price_desc', label: 'Price: High' },
  { id: 'rating', label: 'Top Rated' },
];

export default function CatalogScreen({ route, navigation }) {
  const initialCategory = route?.params?.categoryId || null;
  const initialSearch = route?.params?.initialSearch || '';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState('newest');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync params if passed via navigation
  useEffect(() => {
    if (route?.params?.categoryId !== undefined) {
      setSelectedCategory(route.params.categoryId);
    }
    if (route?.params?.initialSearch !== undefined) {
      setSearch(route.params.initialSearch);
    }
  }, [route?.params]);

  // Load categories
  useEffect(() => {
    api.get(ENDPOINTS.CATEGORIES)
      .then((res) => {
        if (res && (res.categories || res.data)) {
          setCategories(res.categories || res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `${ENDPOINTS.PRODUCTS}?limit=40`;

      if (search.trim()) {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }

      if (selectedCategory) {
        endpoint += `&category=${selectedCategory}`;
      }

      if (selectedSort === 'price_asc') {
        endpoint += `&sort=price`;
      } else if (selectedSort === 'price_desc') {
        endpoint += `&sort=-price`;
      } else if (selectedSort === 'rating') {
        endpoint += `&sort=-averageRating`;
      } else {
        endpoint += `&sort=-createdAt`;
      }

      const res = await api.get(endpoint);
      if (res && (res.products || res.data)) {
        setProducts(res.products || res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn('[Catalog] Error fetching products:', err.message);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, selectedSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 280);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} title="Product Catalog" />

      {/* Search Input Bar */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all products & gadgets..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips Scroll */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <CategoryChip
            label="All Items"
            isSelected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat._id || cat.id || cat.slug}
              label={cat.name}
              isSelected={selectedCategory === (cat._id || cat.slug)}
              onPress={() => setSelectedCategory(cat._id || cat.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sort Options Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCount}>
          {products.length} {products.length === 1 ? 'Product' : 'Products'} Found
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortBadge, selectedSort === opt.id && styles.sortBadgeActive]}
              onPress={() => setSelectedSort(opt.id)}
            >
              <Text style={[styles.sortText, selectedSort === opt.id && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Grid View */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingMessage}>Filtering catalog...</Text>
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No products found"
          description={
            search
              ? `No items match "${search}". Try checking for spelling or adjusting filters.`
              : 'No items available in this category.'
          }
          buttonText="Reset All Filters"
          onButtonPress={() => {
            setSearch('');
            setSelectedCategory(null);
            setSelectedSort('newest');
          }}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => (item._id || item.id).toString()}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.secondary}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item._id || item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  categoriesWrapper: {
    paddingVertical: 4,
  },
  chipScroll: {
    paddingHorizontal: 16,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 12,
  },
  sortScroll: {
    gap: 6,
  },
  sortBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sortBadgeActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: Colors.primaryLight,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sortTextActive: {
    color: Colors.primaryLight,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridContainer: {
    paddingTop: 14,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMessage: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 13,
  },
});
