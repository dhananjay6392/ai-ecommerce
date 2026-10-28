import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    total,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const freeShippingThreshold = 5000;
  const freeShippingDiff = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (items.length === 0 && !isLoading) {
    return (
      <View style={styles.screen}>
        <Header navigation={navigation} title="Shopping Cart" />
        <EmptyState
          icon="cart-outline"
          title="Your Cart is Empty"
          description="Looks like you haven't added anything yet. Explore our AI curated products and add your favorite items!"
          buttonText="Explore Products"
          onButtonPress={() => navigation.navigate('Catalog')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} title="Shopping Cart" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Free Shipping Alert & Progress */}
        <View style={styles.shippingBanner}>
          <View style={styles.shippingTextRow}>
            <Ionicons
              name={freeShippingDiff === 0 ? 'checkmark-circle' : 'cube-outline'}
              size={18}
              color={freeShippingDiff === 0 ? Colors.success : Colors.secondary}
            />
            <Text style={styles.shippingTitle}>
              {freeShippingDiff === 0
                ? 'You unlocked FREE Express Shipping!'
                : `Add ₹${freeShippingDiff.toLocaleString('en-IN')} more for FREE Express Shipping`}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${freeShippingPercent}%` }]} />
          </View>
        </View>

        {/* Header with Clear button */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>
            Cart Items ({itemCount})
          </Text>
          <TouchableOpacity onPress={clearCart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear Cart</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {items.map((item, idx) => {
          const product = item.product || {};
          const pId = product._id || product.id || item.productId;
          const name = product.name || item.name || 'Product';
          const price = item.price || product.price || 0;
          const image =
            product.thumbnail ||
            (product.images && product.images[0]) ||
            item.image ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

          return (
            <View key={pId ? pId.toString() : idx} style={styles.itemCard}>
              <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />

              <View style={styles.itemDetails}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromCart(pId)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemUnitPrice}>₹{price.toLocaleString('en-IN')}</Text>

                <View style={styles.itemBottomRow}>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(pId, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperNum}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => updateQuantity(pId, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={Colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotal}>
                    ₹{(price * item.quantity).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Bill Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Shipping</Text>
            <Text
              style={[
                styles.summaryValue,
                shipping === 0 && { color: Colors.success, fontWeight: '700' },
              ]}
            >
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button Bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.barLabel}>Total Amount</Text>
          <Text style={styles.barAmount}>₹{total.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textWhite} />
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
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 12,
  },
  shippingBanner: {
    marginHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
  },
  shippingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shippingTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#0F172A',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  itemUnitPrice: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepperNum: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 8,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  barAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutBtnText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '800',
  },
});
