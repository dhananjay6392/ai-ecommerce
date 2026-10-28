import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  PackageCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import api from '../services/api';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, totalAmount, clearCart, showNotification } = useCart();
  const { user, openAuthModal } = useAuth();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user ? user.name : 'Alex Rivera',
    email: user ? user.email : 'alex@example.com',
    street: '42 Silicon Avenue, Tech Quarter',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560100',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value,
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (cart.items.length === 0 || processing) return;

    setProcessing(true);

    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 1. Create the application order
      const orderPayload = {
        shippingAddress,
        paymentMethod: paymentMethod === 'cod' ? 'COD' : 'RAZORPAY',
        idempotencyKey,
      };

      const orderRes = await api.post('/orders', orderPayload);
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create order');
      }
      const order = orderRes.order || orderRes.data;
      const orderId = order._id;

      // 2. If Cash on Delivery, no payment gateway step is required
      if (paymentMethod === 'cod') {
        clearCart();
        setConfirmedOrder(order);
        setProcessing(false);
        return;
      }

      // 3. Online Payment: Request Razorpay order
      const rzpRes = await api.post('/payments/create-order', { orderId });
      if (!rzpRes.success) {
        throw new Error(rzpRes.message || 'Failed to initiate payment');
      }

      // 4. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        await api.post('/payments/fail', { orderId, reason: 'Razorpay SDK load failure' });
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 5. Open Razorpay Checkout
      const options = {
        key: rzpRes.keyId,
        amount: Math.round(rzpRes.amount * 100),
        currency: rzpRes.currency,
        name: 'IntelliCart AI',
        description: `Order ${orderId}`,
        order_id: rzpRes.razorpayOrderId,
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            if (verifyRes.success) {
              clearCart();
              setConfirmedOrder(verifyRes.order || order);
            } else {
              showNotification(verifyRes.message || 'Payment verification failed', 'error');
              await api.post('/payments/fail', { orderId, reason: 'Verification rejected' });
              setProcessing(false);
            }
          } catch (err) {
            showNotification(err.response?.data?.message || err.message || 'Verification error', 'error');
            await api.post('/payments/fail', { orderId, reason: err.message });
            setProcessing(false);
          }
        },
        prefill: {
          name: shippingAddress.fullName || user.name,
          email: shippingAddress.email || user.email,
          contact: shippingAddress.phone || '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: async function () {
            setProcessing(false);
            showNotification('Payment cancelled. Reserved stock was released.', 'info');
            try {
              await api.post('/payments/fail', { orderId, reason: 'User dismissed modal' });
            } catch (_) {}
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', async function (response) {
        showNotification(response.error.description || 'Payment failed', 'error');
        setProcessing(false);
        try {
          await api.post('/payments/fail', { orderId, reason: response.error.description });
        } catch (_) {}
      });

      paymentObject.open();

    } catch (error) {
      showNotification(error.response?.data?.message || error.message || 'An error occurred during checkout', 'error');
      setProcessing(false);
    }
  };


  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
            {confirmedOrder.paymentMethod === 'COD' ? 'Order Recorded • Cash on Delivery' : 'Payment Verified & Order Confirmed'}
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Thank you! Your order is confirmed.
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            Reference ID: <strong className="text-neutral-900">{confirmedOrder._id}</strong> • Confirmation dispatched to {shippingAddress.email}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-neutral-200 text-left space-y-4 shadow-2xs">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-neutral-100">
            <span className="text-neutral-500">Payment Method:</span>
            <span className="font-semibold text-neutral-900">
              {confirmedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay (Paid)'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pb-3 border-b border-neutral-100">
            <span className="text-neutral-500">Order Status:</span>
            <span className="font-semibold text-neutral-900">{confirmedOrder.orderStatus}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-3 border-b border-neutral-100">
            <span className="text-neutral-500">Destination:</span>
            <span className="text-neutral-900 text-right">
              {confirmedOrder.shippingAddress?.street}, {confirmedOrder.shippingAddress?.city},{' '}
              {confirmedOrder.shippingAddress?.state} - {confirmedOrder.shippingAddress?.postalCode}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-1">
            <span>Total Billed:</span>
            <span className="text-blue-600 text-base">{formatCurrency(confirmedOrder.totalAmount)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            to={`/orders/${confirmedOrder._id}`}
            className="px-6 py-3 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs transition flex items-center justify-center space-x-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>View Full Order Details</span>
          </Link>
          <Link
            to="/orders"
            className="px-6 py-3 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition flex items-center justify-center space-x-2"
          >
            <span>All Orders</span>
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-800 hover:bg-neutral-50 transition flex items-center justify-center space-x-2"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const shippingFee = totalAmount >= 5000 ? 0 : 250;
  const grandTotal = totalAmount + shippingFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Express Checkout</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Cryptographically encrypted checkout with instant warehouse dispatch.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4 max-w-lg mx-auto">
          <ShoppingBag className="w-10 h-10 text-neutral-400 mx-auto" />
          <h2 className="text-base font-bold text-neutral-900">Your shopping bag is empty</h2>
          <p className="text-xs text-neutral-500">Please add items to your shopping bag before proceeding to checkout.</p>
          <Link to="/shop" className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Form: Shipping & Payment Method (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Destination Card */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>1. Shipping Destination</span>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={shippingAddress.fullName}
                      onChange={handleAddressChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={shippingAddress.email}
                      onChange={handleAddressChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={shippingAddress.street}
                    onChange={handleAddressChange}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={shippingAddress.postalCode}
                      onChange={handleAddressChange}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Processor Selection */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>2. Payment Option</span>
              </div>

              <div className="space-y-2.5">
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'razorpay'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="text-neutral-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">Credit / Debit Card & NetBanking</span>
                      <span className="text-[11px] text-neutral-500">Visa, Mastercard, RuPay & American Express</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Encrypted
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'upi'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="text-neutral-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">UPI Instant Payment</span>
                      <span className="text-[11px] text-neutral-500">Google Pay, PhonePe, Paytm, CRED</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                    Zero Fee
                  </span>
                </label>

                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-neutral-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">Cash on Delivery (COD)</span>
                      <span className="text-[11px] text-neutral-500">Pay physically with cash or card upon arrival</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Pay on Arrival
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary (Span 5) */}
          <div className="lg:col-span-5 space-y-5 sticky top-24">
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 pb-3 border-b border-neutral-100">
                Order Review ({cart.items.length} products)
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.items.map((item) => {
                  const prod = item.product || {};
                  return (
                    <div key={prod._id} className="flex items-center space-x-3 text-xs">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={prod.thumbnail || prod.images?.[0]}
                          alt=""
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 truncate">{prod.name}</p>
                        <p className="text-[11px] text-neutral-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-neutral-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-4 border-t border-neutral-100 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="text-neutral-900 font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Express Delivery</span>
                  <span className="text-emerald-700 font-semibold">
                    {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total Amount</span>
                  <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{processing ? 'Processing Payment...' : `Complete Order • ${formatCurrency(grandTotal)}`}</span>
              </button>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-neutral-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>HMAC-SHA256 Encrypted Security Guarantee</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
