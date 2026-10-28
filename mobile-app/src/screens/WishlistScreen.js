import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistScreen({ navigation }) {
  const { wishlist, removeFromWishlist, moveToCart, isLoading } = useWishlist();

  if (wishlist.length === 0 && !isLoading) {
    return (
      <View style={styles.screen}>
        <Header navigation={navigation} title="Your Wishlist" />
        <EmptyState
          icon="heart-outline"
          title="Your Wishlist is Empty"
          description="Save products you want to buy later by tapping the heart icon on any product."
          buttonText="Browse Catalog"
          onButtonPress={() => navigation.navigate('Catalog')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} title="Your Wishlist" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Saved Items ({wishlist.length})</Text>
        </View>

        {wishlist.map((item, idx) => {
          const pId = item._id || item.id || item;
          const name = item.name || 'Saved Product';
          const price = item.price || 0;
          const discount = item.discountPercentage || 0;
          const effectivePrice =
            discount > 0 ? Math.round(price - (price * discount) / 100) : price;
          const image =
            item.thumbnail ||
            (item.images && item.images[0]) ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

          return (
            <TouchableOpacity
              key={pId ? pId.toString() : idx}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ProductDetail', { productId: pId })}
            >
              <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

              <View style={styles.details}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={2}>
                    {name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromWishlist(pId)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{effectivePrice.toLocaleString('en-IN')}</Text>
                  {discount > 0 && (
                    <Text style={styles.oldPrice}>₹{price.toLocaleString('en-IN')}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.moveToCartBtn}
                  onPress={() => moveToCart(pId)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bag-handle-outline" size={15} color={Colors.textWhite} />
                  <Text style={styles.moveToCartText}>Move to Cart</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#0F172A',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginRight: 6,
  },
  removeBtn: {
    padding: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  oldPrice: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  moveToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  moveToCartText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
