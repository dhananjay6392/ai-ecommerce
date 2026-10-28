import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadProductData = async () => {
      try {
        const [prodRes, mlRes] = await Promise.allSettled([
          api.get(ENDPOINTS.PRODUCT_BY_ID(productId)),
          api.get(`${ENDPOINTS.ML_RECOMMENDATIONS}?productId=${productId}&limit=4`),
        ]);

        if (isMounted) {
          if (prodRes.status === 'fulfilled' && prodRes.value) {
            const p = prodRes.value.product || prodRes.value.data || prodRes.value;
            setProduct(p);
            const initialImg =
              p.thumbnail || (p.images && p.images[0]) || null;
            setSelectedImage(initialImg);
          }

          if (mlRes.status === 'fulfilled' && mlRes.value) {
            setRelatedProducts(mlRes.value.recommendations || []);
          }
        }
      } catch (err) {
        console.warn('[ProductDetail] Error loading data:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProductData();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      showToast(`Added ${quantity} item(s) to Cart!`);
    } catch (err) {
      showToast(err.message || 'Error adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addToCart(product, quantity);
      navigation.navigate('Checkout');
    } catch (err) {
      showToast(err.message || 'Error proceeding to checkout');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading product intelligence...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Catalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const wishlisted = isWishlisted(product._id || product.id);
  const discount = product.discountPercentage || product.discount || 0;
  const originalPrice = product.price || 0;
  const effectivePrice =
    discount > 0
      ? Math.round(originalPrice - (originalPrice * discount) / 100)
      : originalPrice;

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

  const categoryName =
    typeof product.category === 'object' && product.category?.name
      ? product.category.name
      : product.category || 'Tech';

  return (
    <View style={styles.screen}>
      {/* Top Floating App Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.roundNavBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity
          style={styles.roundNavBtn}
          onPress={() => toggleWishlist(product)}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={wishlisted ? Colors.danger : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Image Showcase */}
        <View style={styles.imageShowcase}>
          <Image
            source={{ uri: selectedImage || images[0] }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails Carousel if multiple */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
            {images.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbBox,
                  (selectedImage === img || (!selectedImage && idx === 0)) && styles.thumbActive,
                ]}
                onPress={() => setSelectedImage(img)}
              >
                <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Details Header */}
        <View style={styles.infoCard}>
          <View style={styles.categoryBadgeRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{categoryName}</Text>
            </View>
            {product.brand && (
              <Text style={styles.brandText}>Brand: {product.brand}</Text>
            )}
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Rating & Stock Status */}
          <View style={styles.ratingAndStockRow}>
            <View style={styles.starRow}>
              <Ionicons name="star" size={16} color={Colors.star} />
              <Text style={styles.starValue}>{product.averageRating || '4.8'}</Text>
              <Text style={styles.ratingCount}>({product.reviewsCount || 12} Verified Reviews)</Text>
            </View>

            <View
              style={[
                styles.stockPill,
                {
                  backgroundColor:
                    product.stock > 10
                      ? Colors.successBg
                      : product.stock > 0
                      ? Colors.warningBg
                      : Colors.dangerBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.stockPillText,
                  {
                    color:
                      product.stock > 10
                        ? Colors.success
                        : product.stock > 0
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              >
                {product.stock > 10
                  ? `In Stock (${product.stock})`
                  : product.stock > 0
                  ? `Only ${product.stock} Left`
                  : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.effectivePrice}>₹{effectivePrice.toLocaleString('en-IN')}</Text>
            {discount > 0 && (
              <>
                <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
                <Text style={styles.savingsTag}>
                  Save ₹{(originalPrice - effectivePrice).toLocaleString('en-IN')}
                </Text>
              </>
            )}
          </View>

          {/* AI Recommendation Intelligence Callout */}
          <View style={styles.aiInsightBox}>
            <View style={styles.aiInsightHeader}>
              <Ionicons name="sparkles" size={16} color="#22D3EE" />
              <Text style={styles.aiInsightTitle}>IntelliCart AI Recommendation Analysis</Text>
            </View>
            <Text style={styles.aiInsightBody}>
              {product.recommendationReason ||
                `Matched based on high semantic alignment with '${categoryName}' and strong customer satisfaction rating of ${product.averageRating || 4.8}/5.`}
            </Text>
          </View>

          {/* Quantity Stepper */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={18} color={quantity <= 1 ? Colors.textDisabled : Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                disabled={product.stock <= quantity}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={product.stock <= quantity ? Colors.textDisabled : Colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descSectionTitle}>Product Overview</Text>
            <Text style={styles.descText}>
              {product.description ||
                'Experience state of the art performance and quality, curated specifically by IntelliCart AI.'}
            </Text>
          </View>
        </View>

        {/* Related AI Recommendations Carousel */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="git-network-outline" size={18} color={Colors.secondary} />
              <Text style={styles.relatedTitle}>Customers Also Considered</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={relatedProducts}
              keyExtractor={(item) => (item._id || item.id).toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <View style={{ marginRight: 12 }}>
                  <ProductCard
                    product={item}
                    width={180}
                    onPress={() =>
                      navigation.push('ProductDetail', { productId: item._id || item.id })
                    }
                  />
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* Toast Notification Banner */}
      {toastMessage !== '' && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, product.stock === 0 && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={addingToCart || product.stock === 0}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color={Colors.textWhite} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyNowBtn, product.stock === 0 && styles.disabledBtn]}
          onPress={handleBuyNow}
          disabled={product.stock === 0}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: Colors.textWhite,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roundNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  imageShowcase: {
    width: width,
    height: 280,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainImage: {
    width: width * 0.9,
    height: 260,
  },
  discountBadge: {
    position: 'absolute',
    top: 14,
    left: 16,
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: 12,
  },
  thumbRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
  },
  thumbActive: {
    borderColor: Colors.secondary,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    padding: 16,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  categoryPillText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  brandText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  ratingAndStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  ratingCount: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 14,
  },
  effectivePrice: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsTag: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '700',
  },
  aiInsightBox: {
    marginTop: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiInsightTitle: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  aiInsightBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stepperBtn: {
    padding: 10,
    width: 38,
    alignItems: 'center',
  },
  stepperValue: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  descSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  relatedSection: {
    marginTop: 20,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 99,
  },
  toastText: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceHover,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    height: 48,
    borderRadius: 12,
  },
  addToCartText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
  },
  buyNowText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
