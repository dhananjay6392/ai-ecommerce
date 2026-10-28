import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/orders');
        if (res.success) {
          setOrders(res.orders || []);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-neutral-700" />
            <span>Fulfillment History</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Order History & Shipments
          </h1>
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="rounded-2xl bg-white border border-neutral-200/90 shadow-2xs overflow-hidden"
          >
            {/* Order Header Strip */}
            <div className="p-4 sm:p-5 bg-neutral-50 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Order Placed</span>
                  <span className="font-semibold text-neutral-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Total Billed</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Order Number</span>
                  <span className="font-mono font-semibold text-neutral-900">{order._id}</span>
                </div>
                {order.paymentMethod && (
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Payment</span>
                    <span className="font-semibold text-neutral-900 uppercase text-[11px]">{order.paymentMethod}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {order.orderStatus === 'PENDING' ? <Clock className="w-3 h-3 text-amber-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  <span className={order.orderStatus === 'PENDING' ? 'text-amber-700' : 'text-emerald-700'}>{order.orderStatus}</span>
                </span>
                <Link
                  to={`/orders/${order._id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-500 pb-2">
                <span className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Air Courier Tracking: <strong className="text-neutral-800">{order.trackingNumber || 'Pending Allocation'}</strong></span>
                </span>
                <span>Delivered to {order.shippingAddress.city}</span>
              </div>

              <div className="divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-neutral-50 p-1.5 border border-neutral-200 shrink-0 flex items-center justify-center">
                        <img
                          src={item.image || item.product?.thumbnail}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div>
                        <Link
                          to={`/product/${item.product}`}
                          className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-blue-600 line-clamp-1 transition"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-xs font-bold text-neutral-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <Link
                        to={`/product/${item.product}`}
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                      >
                        Buy Again
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
