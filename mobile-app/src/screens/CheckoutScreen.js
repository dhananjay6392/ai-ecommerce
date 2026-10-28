import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import { ENDPOINTS } from '../config/api';

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [street, setStreet] = useState(user?.address?.street || '104 Innovation Hub, Cyber City');
  const [city, setCity] = useState(user?.address?.city || 'Bengaluru');
  const [state, setState] = useState(user?.address?.state || 'Karnataka');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '560001');
  const [country, setCountry] = useState(user?.address?.country || 'India');

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY_TEST');
  const [isProcessing, setIsProcessing] = useState(false);

  // Razorpay Test Mode Simulator Modal State
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [activeRazorpayData, setActiveRazorpayData] = useState(null);

  const fillDemoAddress = () => {
    setName(user?.name || 'Vivek Sharma');
    setPhone('9876543210');
    setStreet('Plot 42, AI Technology Park, Whitefield');
    setCity('Bengaluru');
    setState('Karnataka');
    setPostalCode('560066');
    setCountry('India');
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please sign in to place your order and track your delivery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Missing Address', 'Please fill in street, city, and postal code.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = {
        name: name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };

      // 1. Create Order in Backend DB
      const orderPayload = {
        shippingAddress,
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
        idempotencyKey: `idemp_mob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        items: items.map((it) => ({
          productId: it.product?._id || it.productId || it.product,
          quantity: it.quantity,
        })),
      };

      const orderRes = await api.post(ENDPOINTS.ORDERS, orderPayload);
      const createdOrder = orderRes.order || orderRes.data;

      if (!createdOrder || !createdOrder._id) {
        throw new Error('Failed to initiate order.');
      }

      // 2. If COD, complete immediately
      if (paymentMethod === 'COD') {
        await clearCart();
        setIsProcessing(false);
        navigation.replace('OrderDetail', { orderId: createdOrder._id, isNewOrder: true });
        return;
      }

      // 3. Initiate Razorpay Order for Test Mode
      const rzpRes = await api.post(ENDPOINTS.PAYMENT_CREATE_ORDER, {
        orderId: createdOrder._id,
      });

      if (!rzpRes || !rzpRes.success) {
        throw new Error(rzpRes.message || 'Razorpay order creation failed');
      }

      setActiveRazorpayData({
        orderId: createdOrder._id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        amount: rzpRes.amount,
        currency: rzpRes.currency || 'INR',
        keyId: rzpRes.keyId,
      });

      setIsProcessing(false);
      setRazorpayModalVisible(true);
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Order Placement Error', err.message || 'Could not place order');
    }
  };

  // Cancel simulated payment and release reserved stock
  const handleCancelPayment = async () => {
    if (activeRazorpayData?.orderId) {
      try {
        await api.post(ENDPOINTS.PAYMENT_VERIFY.replace('/verify', '/fail'), {
          orderId: activeRazorpayData.orderId,
          reason: 'User cancelled payment in mobile app',
        });
      } catch (_) {}
    }
    setRazorpayModalVisible(false);
  };

  // Simulate Razorpay Payment Success and Call Verification API
  const handleSimulatePaymentSuccess = async () => {
    if (!activeRazorpayData) return;
    setRazorpayModalVisible(false);
    setIsProcessing(true);

    try {
      const mockPaymentId = `pay_test_${Date.now()}`;
      const mockSignature = 'verified_mock_sig';

      const verifyRes = await api.post(ENDPOINTS.PAYMENT_VERIFY, {
        orderId: activeRazorpayData.orderId,
        razorpay_order_id: activeRazorpayData.razorpayOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      await clearCart();
      setIsProcessing(false);

      if (verifyRes && verifyRes.success) {
        navigation.replace('OrderDetail', {
          orderId: activeRazorpayData.orderId,
          isNewOrder: true,
          paymentSuccess: true,
        });
      } else {
        throw new Error(verifyRes.message || 'Verification rejected');
      }
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Payment Verification Failed', err.message);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Secure Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Address Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="location-outline" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <TouchableOpacity onPress={fillDemoAddress}>
            <Text style={styles.autofillText}>Autofill Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Address Form Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Recipient Name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.inputLabel}>Street Address</Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder="Apartment, building, street"
            placeholderTextColor={Colors.textMuted}
          />

          <View style={styles.rowTwo}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.rowTwo}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="PIN Code"
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <Ionicons name="card-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
        </View>

        {/* Razorpay Test Option */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'RAZORPAY_TEST' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('RAZORPAY_TEST')}
          activeOpacity={0.88}
        >
          <View style={styles.paymentRadioRow}>
            <Ionicons
              name={paymentMethod === 'RAZORPAY_TEST' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'RAZORPAY_TEST' ? Colors.secondary : Colors.textMuted}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.paymentMethodName}>Razorpay Payment Gateway</Text>
                <View style={styles.testBadge}>
                  <Text style={styles.testBadgeText}>Test Mode</Text>
                </View>
              </View>
              <Text style={styles.paymentMethodSub}>
                UPI, Credit/Debit Cards, NetBanking (Verified Signature Simulator)
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* COD Option */}
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('COD')}
          activeOpacity={0.88}
        >
          <View style={styles.paymentRadioRow}>
            <Ionicons
              name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'COD' ? Colors.secondary : Colors.textMuted}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.paymentMethodName}>Cash on Delivery</Text>
              <Text style={styles.paymentMethodSub}>Pay with cash upon receipt</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Order Items Preview */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Price Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({items.length})</Text>
            <Text style={styles.summaryVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryVal, shipping === 0 && { color: Colors.success }]}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Sticky Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarLabel}>To Pay</Text>
          <Text style={styles.bottomBarTotal}>₹{total.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
          activeOpacity={0.88}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color={Colors.textWhite} />
              <Text style={styles.payBtnText}>
                {paymentMethod === 'RAZORPAY_TEST' ? 'Pay with Razorpay' : 'Confirm Order'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay Test Mode Interactive Modal */}
      <Modal
        visible={razorpayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPayment}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.rzpLogoRow}>
                <Ionicons name="card" size={24} color="#06B6D4" />
                <Text style={styles.rzpModalTitle}>Razorpay Checkout</Text>
              </View>
              <View style={styles.testModePill}>
                <Text style={styles.testModePillText}>TEST MODE</Text>
              </View>
            </View>

            <View style={styles.modalOrderInfo}>
              <Text style={styles.modalInfoLabel}>Total Payable:</Text>
              <Text style={styles.modalInfoAmount}>₹{activeRazorpayData?.amount?.toLocaleString('en-IN')}</Text>
              <Text style={styles.modalOrderId}>Order ID: {activeRazorpayData?.razorpayOrderId}</Text>
            </View>

            <View style={styles.testNoteBox}>
              <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
              <Text style={styles.testNoteText}>
                Razorpay Test Mode is active. No real funds are deducted. Tap Simulate Payment to verify backend signature.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalSuccessBtn}
              onPress={handleSimulatePaymentSuccess}
            >
              <Ionicons name="checkmark-circle" size={18} color={Colors.textWhite} />
              <Text style={styles.modalSuccessBtnText}>Simulate Successful Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={handleCancelPayment}
            >
              <Text style={styles.modalCancelBtnText}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
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
  backBtn: {
    width: 40,
    height: 40,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  autofillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 8,
  },
  rowTwo: {
    flexDirection: 'row',
  },
  paymentCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 10,
  },
  paymentCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  paymentRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  testBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.warning,
  },
  paymentMethodSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
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
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  bottomBar: {
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
  bottomBarLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bottomBarTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  payBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rzpLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rzpModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  testModePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testModePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
  },
  modalOrderInfo: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalInfoAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  modalOrderId: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  testNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  testNoteText: {
    flex: 1,
    color: '#38BDF8',
    fontSize: 12,
    lineHeight: 16,
  },
  modalSuccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  modalSuccessBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
