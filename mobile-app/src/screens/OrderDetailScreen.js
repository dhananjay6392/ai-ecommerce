import React, { useState, useEffect } from 'react';
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
import { Colors } from '../theme/colors';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, isNewOrder, paymentSuccess } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!orderId) {
      setLoading(false);
      return;
    }

    api.get(ENDPOINTS.ORDER_BY_ID(orderId))
      .then((res) => {
        if (isMounted) {
          setOrder(res.order || res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[OrderDetail] Error loading order:', err.message);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleCancelOrder = () => {
    if (!order) return;
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order? Any reserved inventory will be released.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel Order',
            style: 'destructive',
            onPress: async () => {
              setCancelling(true);
              try {
                const res = await api.put(`/orders/${order._id}/cancel`);
                if (res && (res.order || res.data)) {
                  setOrder(res.order || res.data);
                  Alert.alert('Order Cancelled', 'Your order was cancelled successfully.');
                }
              } catch (err) {
                Alert.alert('Cancellation Error', err.message || 'Could not cancel order.');
              } finally {
                setCancelling(false);
              }
            },
          },
        ]
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orderStatus = order.orderStatus || 'PENDING';
  const paymentStatus = order.paymentStatus || 'PENDING';
  const address = order.shippingAddress || {};

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Orders')}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order Details</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Banner if freshly placed */}
        {isNewOrder && (
          <View style={styles.successBanner}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.successTitle}>Order Successfully Placed!</Text>
              <Text style={styles.successSubtitle}>
                {paymentSuccess
                  ? 'Payment verified via Razorpay Test Mode. Your items will be dispatched soon.'
                  : 'Your order has been recorded in the database.'}
              </Text>
            </View>
          </View>
        )}

        {/* Order Meta Header */}
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Order Identifier</Text>
              <Text style={styles.metaValue}>#{order._id.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    orderStatus === 'CONFIRMED' || orderStatus === 'DELIVERED'
                      ? Colors.successBg
                      : Colors.warningBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      orderStatus === 'CONFIRMED' || orderStatus === 'DELIVERED'
                        ? Colors.success
                        : Colors.warning,
                  },
                ]}
              >
                {orderStatus}
              </Text>
            </View>
          </View>

          {order.razorpayOrderId && (
            <View style={styles.rzpRefBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.secondary} />
              <Text style={styles.rzpRefText}>
                Razorpay Order: {order.razorpayOrderId}
              </Text>
            </View>
          )}

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              Placed on:{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent'}
            </Text>
            <Text style={styles.paymentStatusText}>
              Payment: <Text style={{ color: paymentStatus === 'PAID' ? Colors.success : Colors.warning }}>{paymentStatus}</Text>
            </Text>
          </View>
        </View>

        {/* Delivery Timeline / Tracking */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fulfillment Status</Text>

          <View style={styles.timelineRow}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <Ionicons name="checkmark" size={12} color={Colors.textWhite} />
              </View>
              <Text style={styles.timelineStepText}>Placed</Text>
            </View>

            <View style={[styles.timelineLine, styles.timelineLineActive]} />

            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <Ionicons name="checkmark" size={12} color={Colors.textWhite} />
              </View>
              <Text style={styles.timelineStepText}>Confirmed</Text>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={styles.timelineDot}>
                <Ionicons name="cube-outline" size={12} color={Colors.textMuted} />
              </View>
              <Text style={styles.timelineStepText}>Shipped</Text>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={styles.timelineDot}>
                <Ionicons name="checkmark-done-outline" size={12} color={Colors.textMuted} />
              </View>
              <Text style={styles.timelineStepText}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressName}>{address.fullName || address.name || 'Recipient'}</Text>
          <Text style={styles.addressLine}>{address.street || 'Address'}</Text>
          <Text style={styles.addressLine}>
            {address.city}, {address.state} - {address.postalCode}
          </Text>
          <Text style={styles.addressLine}>{address.country || 'India'}</Text>
          {address.phone && (
            <Text style={styles.addressPhone}>Phone: {address.phone}</Text>
          )}
        </View>

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ordered Items ({(order.items || []).length})</Text>

          {(order.items || []).map((item, idx) => {
            const product = item.product || {};
            const name = item.name || product.name || 'Item';
            const price = item.price || 0;
            const image =
              item.image ||
              product.thumbnail ||
              (product.images && product.images[0]) ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150';

            return (
              <View key={idx} style={styles.itemRow}>
                <Image source={{ uri: image }} style={styles.itemThumb} resizeMode="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {name}
                  </Text>
                  <Text style={styles.itemQtyPrice}>
                    Qty: {item.quantity} × ₹{price.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(price * item.quantity).toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Price Receipt */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt & Billing</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billVal}>₹{(order.subtotal || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Shipping Fee</Text>
            <Text style={styles.billVal}>
              {(order.shippingFee || 0) === 0 ? 'FREE' : `₹${order.shippingFee}`}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Paid</Text>
            <Text style={styles.grandTotalVal}>
              ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Cancel Order Button if eligible */}
        {(order.orderStatus === 'PENDING' || (order.orderStatus === 'CONFIRMED' && order.paymentMethod === 'COD')) && (
          <TouchableOpacity
            style={[styles.continueShoppingBtn, { backgroundColor: '#EF4444', marginBottom: 10 }]}
            onPress={handleCancelOrder}
            disabled={cancelling}
            activeOpacity={0.88}
          >
            <Text style={styles.continueShoppingText}>
              {cancelling ? 'Cancelling Order...' : 'Cancel Order'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Back to Home Button */}
        <TouchableOpacity
          style={styles.continueShoppingBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.88}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  errorText: {
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
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
  },
  successSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rzpRefBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  rzpRefText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  timelineStep: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  timelineStepText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: 18,
  },
  timelineLineActive: {
    backgroundColor: Colors.primary,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  billDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  continueShoppingBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  continueShoppingText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
