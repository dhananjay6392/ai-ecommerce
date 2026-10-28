import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

export default function RecommendationsScreen({ navigation }) {
  const [recommendations, setRecommendations] = useState([]);
  const [algorithmInfo, setAlgorithmInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await api.get(`${ENDPOINTS.ML_RECOMMENDATIONS}?limit=16`);
      if (res && res.recommendations) {
        setRecommendations(res.recommendations);
        setAlgorithmInfo(res.algorithm || 'Hybrid Content + Collaborative Filtering');
      }
    } catch (err) {
      console.warn('[RecommendationsScreen] Error loading recommendations:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} title="AI Recommendations" />

      {/* ML Architecture Badge */}
      <View style={styles.algoBanner}>
        <View style={styles.algoIconRow}>
          <Ionicons name="sparkles" size={16} color="#06B6D4" />
          <Text style={styles.algoTitle}>IntelliCart Autonomous ML Engine</Text>
        </View>
        <Text style={styles.algoSubtitle}>
          {algorithmInfo || 'TF-IDF Cosine Similarity & Matrix Factorization with Real-Time Learning'}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Computing personalized recommendations...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="No Recommendations Yet"
          description="Browse and add items to your cart to let our Machine Learning service learn your taste."
          buttonText="Explore Products"
          onButtonPress={() => navigation.navigate('Catalog')}
        />
      ) : (
        <FlatList
          data={recommendations}
          numColumns={2}
          keyExtractor={(item) => (item._id || item.id).toString()}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
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
  algoBanner: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  algoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  algoTitle: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '800',
  },
  algoSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 13,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridContent: {
    paddingTop: 14,
    paddingBottom: 40,
  },
});
