import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/orders/${id}`);
        if (res.success && (res.order || res.data)) {
          setOrder(res.order || res.data);
        } else {
          setError(res.message || 'Order could not be found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Any reserved inventory will be restored.')) {
      return;
    }

    try {
      setCancelling(true);
      const res = await api.put(`/orders/${id}/cancel`);
      if (res.success) {
        setOrder(res.order || res.data);
        setSuccessMessage('Order has been cancelled and stock has been restored.');
      } else {
        alert(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Order Not Found</h1>
        <p className="text-xs text-neutral-500">{error || 'The requested order does not exist or you do not have permission to view it.'}</p>
        <Link
          to="/orders"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddress || {};
  const isCancellable = order.orderStatus === 'PENDING' || (order.orderStatus === 'CONFIRMED' && order.paymentMethod === 'COD');

  const getStatusBadge = (status = '') => {
    const s = status.toUpperCase();
    if (s === 'CONFIRMED' || s === 'PAID' || s === 'DELIVERED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>{status}</span>
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>{status}</span>
        </span>
      );
    }
    if (s === 'CANCELLED' || s === 'FAILED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3 text-red-500" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Truck className="w-3 h-3 text-blue-500" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition text-neutral-600"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">
              <Package className="w-4 h-4 text-neutral-700" />
              <span>Order Details</span>
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
              Order #{order._id}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
          <Link
            to="/shop"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition"
          >
            Shop More
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4 text-xs">
          <div>
            <span className="text-neutral-400 block text-[11px]">Placed on</span>
            <span className="font-semibold text-neutral-900">
              {new Date(order.createdAt).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Fulfillment Status</span>
            {getStatusBadge(order.orderStatus)}
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Payment Status</span>
            {getStatusBadge(order.paymentStatus)}
          </div>
          <div>
            <span className="text-neutral-400 block text-[11px]">Payment Method</span>
            <span className="font-semibold text-neutral-900 uppercase">
              {order.paymentMethod || 'RAZORPAY'}
            </span>
          </div>
        </div>

        {order.razorpayOrderId && (
          <div className="text-xs text-neutral-500 pt-1 flex items-center space-x-2">
            <span className="text-neutral-400">Gateway Reference:</span>
            <span className="font-mono text-neutral-800">{order.razorpayOrderId}</span>
          </div>
        )}
      </div>

      {/* Grid: Delivery Destination & Items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Destination & Payment info (Span 1) */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center space-x-2 font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Shipping Address</span>
            </div>
            <p className="font-semibold text-neutral-900">
              {shipping.fullName || shipping.name || 'Recipient'}
            </p>
            <p className="text-neutral-600 leading-relaxed">
              {shipping.street}<br />
              {shipping.city}, {shipping.state} {shipping.postalCode}<br />
              {shipping.country || 'India'}
            </p>
            {shipping.phone && (
              <p className="text-neutral-500 pt-1">
                Phone: <strong className="text-neutral-800">{shipping.phone}</strong>
              </p>
            )}
            {shipping.email && (
              <p className="text-neutral-500">
                Email: <strong className="text-neutral-800">{shipping.email}</strong>
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center space-x-2 font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Payment Details</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Method</span>
              <span className="font-semibold text-neutral-900">{order.paymentMethod || 'RAZORPAY'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Payment Status</span>
              <span className="font-semibold">{order.paymentStatus}</span>
            </div>
            {order.paidAt && (
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Paid At</span>
                <span className="text-neutral-900">{new Date(order.paidAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Products & Bill (Span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <span>Items in this Order ({order.items?.length || 0})</span>
            </h2>

            <div className="divide-y divide-neutral-100">
              {(order.items || []).map((item, idx) => {
                const prod = item.product || {};
                const pId = prod._id || item.productId || item.product;
                return (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-neutral-50 p-1.5 border border-neutral-200 shrink-0 flex items-center justify-center">
                        <img
                          src={item.image || prod.thumbnail || (prod.images && prod.images[0]) || ''}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={pId ? `/product/${pId}` : '#'}
                          className="text-xs font-semibold text-neutral-900 hover:text-blue-600 truncate block transition"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-neutral-900 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span className="font-semibold text-emerald-700">
                  {(order.shippingFee === 0 || !order.shippingFee) ? 'FREE' : formatCurrency(order.shippingFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Discount</span>
                  <span className="font-semibold text-emerald-700">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total Amount</span>
                <span className="text-blue-600 text-base">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
