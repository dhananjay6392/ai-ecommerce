import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

export default function ProductCard({
  product,
  onPress,
  width: customWidth = CARD_WIDTH,
}) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const pId = product._id || product.id;
  const wishlisted = isWishlisted(pId);

  const originalPrice = product.price || 0;
  const discount = product.discountPercentage || product.discount || 0;
  const effectivePrice =
    discount > 0
      ? Math.round(originalPrice - (originalPrice * discount) / 100)
      : originalPrice;

  const imageUrl =
    product.thumbnail ||
    (product.images && product.images[0]) ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';

  const categoryName =
    typeof product.category === 'object' && product.category?.name
      ? product.category.name
      : product.category || 'Tech';

  const handleAddToCart = async () => {
    try {
      await addToCart(product, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    } catch (err) {
      console.warn('Error adding to cart:', err.message);
    }
  };

  const matchPercent = product.matchScore
    ? Math.round(product.matchScore * 100)
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { width: customWidth }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Product Image Box */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={wishlisted ? Colors.danger : Colors.textPrimary}
          />
        </TouchableOpacity>

        {/* AI Match Badge */}
        {matchPercent && (
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={10} color="#22D3EE" />
            <Text style={styles.aiBadgeText}>{matchPercent}% Match</Text>
          </View>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.content}>
        <Text style={styles.categoryText} numberOfLines={1}>
          {product.brand ? `${product.brand} • ` : ''}
          {categoryName}
        </Text>

        <Text style={styles.titleText} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={Colors.star} />
          <Text style={styles.ratingText}>
            {product.averageRating || product.rating || '4.8'}
          </Text>
          <Text style={styles.reviewsCount}>
            ({product.reviewsCount || product.numReviews || 12})
          </Text>
        </View>

        {/* Price & Action Row */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceText}>₹{effectivePrice.toLocaleString('en-IN')}</Text>
            {discount > 0 && (
              <Text style={styles.originalPriceText}>
                ₹{originalPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, justAdded && styles.addBtnSuccess]}
            onPress={handleAddToCart}
            disabled={justAdded || product.stock === 0}
          >
            <Ionicons
              name={justAdded ? 'checkmark' : product.stock === 0 ? 'close' : 'cart-outline'}
              size={16}
              color={Colors.textWhite}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  aiBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  aiBadgeText: {
    color: '#22D3EE',
    fontSize: 10,
    fontWeight: '700',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    padding: 10,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
    minHeight: 34,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewsCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  originalPriceText: {
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnSuccess: {
    backgroundColor: Colors.success,
  },
});
