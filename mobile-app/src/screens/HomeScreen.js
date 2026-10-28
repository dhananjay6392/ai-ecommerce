import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      // Parallel loading for fast initial experience
      const [catRes, aiRes, featRes, trendRes] = await Promise.allSettled([
        api.get(ENDPOINTS.CATEGORIES),
        api.get(`${ENDPOINTS.ML_RECOMMENDATIONS}?limit=6`),
        api.get(ENDPOINTS.FEATURED_PRODUCTS),
        api.get(ENDPOINTS.TRENDING_PRODUCTS),
      ]);

      if (catRes.status === 'fulfilled' && catRes.value) {
        setCategories(catRes.value.categories || catRes.value.data || []);
      }

      if (aiRes.status === 'fulfilled' && aiRes.value) {
        setAiRecommendations(aiRes.value.recommendations || []);
      }

      if (featRes.status === 'fulfilled' && featRes.value) {
        setFeaturedProducts(featRes.value.products || featRes.value.data || []);
      }

      if (trendRes.status === 'fulfilled' && trendRes.value) {
        setTrendingProducts(trendRes.value.products || trendRes.value.data || []);
      }
    } catch (err) {
      console.warn('[HomeScreen] Error loading home data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Catalog', { initialSearch: searchQuery.trim() });
    }
  };

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.primary, Colors.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search AI curated products, gadgets, apparel..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero AI Banner */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="hardware-chip-outline" size={12} color="#38BDF8" />
            <Text style={styles.heroBadgeText}>FastAPI ML Service Connected</Text>
          </View>
          <Text style={styles.heroTitle}>Autonomous AI-Driven Commerce</Text>
          <Text style={styles.heroSubtitle}>
            Personalized recommendations via TF-IDF Vectorization & Collaborative Filtering.
          </Text>

          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => navigation.navigate('Recommendations')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroCtaText}>Explore AI Engine</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textWhite} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Categories Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <CategoryChip
            label="All"
            isSelected={selectedCategory === null}
            onPress={() => {
              setSelectedCategory(null);
              navigation.navigate('Catalog');
            }}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat._id || cat.id || cat.slug}
              label={cat.name}
              isSelected={selectedCategory === (cat._id || cat.slug)}
              onPress={() => {
                setSelectedCategory(cat._id || cat.slug);
                navigation.navigate('Catalog', { categoryId: cat._id || cat.slug, categoryName: cat.name });
              }}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingText}>Fetching personalized catalog...</Text>
          </View>
        ) : (
          <>
            {/* AI Recommendations Carousel */}
            {aiRecommendations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.titleWithIcon}>
                    <Ionicons name="sparkles" size={18} color="#06B6D4" />
                    <Text style={styles.sectionTitle}>AI Recommendations For You</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Recommendations')}>
                    <Text style={styles.seeAllText}>More Picks</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={aiRecommendations}
                  keyExtractor={(item) => (item._id || item.id).toString()}
                  renderItem={({ item }) => (
                    <View style={{ marginRight: 12 }}>
                      <ProductCard
                        product={item}
                        width={180}
                        onPress={() =>
                          navigation.navigate('ProductDetail', { productId: item._id || item.id })
                        }
                      />
                    </View>
                  )}
                  contentContainerStyle={styles.horizontalList}
                />
              </View>
            )}

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Items</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Catalog', { sort: 'featured' })}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.productGrid}>
                  {featuredProducts.slice(0, 4).map((item) => (
                    <ProductCard
                      key={(item._id || item.id).toString()}
                      product={item}
                      onPress={() =>
                        navigation.navigate('ProductDetail', { productId: item._id || item.id })
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Trending Products */}
            {trendingProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.titleWithIcon}>
                    <Ionicons name="trending-up" size={18} color={Colors.warning} />
                    <Text style={styles.sectionTitle}>Trending in Catalog</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Catalog', { sort: 'trending' })}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.productGrid}>
                  {trendingProducts.slice(0, 4).map((item) => (
                    <ProductCard
                      key={(item._id || item.id).toString()}
                      product={item}
                      onPress={() =>
                        navigation.navigate('ProductDetail', { productId: item._id || item.id })
                      }
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textWhite,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 6,
    lineHeight: 18,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroCtaText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 13,
  },
});
