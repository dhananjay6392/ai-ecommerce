import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalAmount,
    totalItems,
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 5000;
  const progressPercent = Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalAmount);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="text-base font-bold text-neutral-900">
              Shopping Bag ({totalItems})
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              {remainingForFreeShipping === 0 ? (
                <span className="text-emerald-700 font-semibold">You unlocked Free Express Shipping!</span>
              ) : (
                <span>
                  Add <strong className="text-neutral-900">{formatCurrency(remainingForFreeShipping)}</strong> for Free Express Delivery
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold text-neutral-700">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                remainingForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-neutral-900'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Your bag is empty</h3>
                <p className="text-xs text-neutral-500 max-w-xs mt-1">
                  Explore our curated hardware, acoustics, and computing systems to add items.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Discover Collections
              </button>
            </div>
          ) : (
            cart.items.map((item) => {
              const product = item.product;
              const pId = product?._id || product?.id || product;
              return (
                <div
                  key={pId}
                  className="flex space-x-3.5 p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 transition bg-white"
                >
                  {/* Thumbnail */}
                  <div className="w-18 h-18 rounded-lg bg-neutral-100 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={product?.thumbnail || product?.images?.[0]}
                      alt={product?.name || 'Product'}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${pId}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-semibold text-neutral-900 hover:text-blue-600 line-clamp-1 transition"
                        >
                          {product?.name || 'IntelliCart Hardware'}
                        </Link>
                        <button
                          onClick={() => removeFromCart(pId)}
                          className="text-neutral-400 hover:text-rose-600 transition p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {product?.brand} • {product?.categoryName || product?.category?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(pId, item.quantity - 1)}
                          className="text-neutral-500 hover:text-neutral-900 transition p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold text-neutral-900 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(pId, item.quantity + 1)}
                          className="text-neutral-500 hover:text-neutral-900 transition p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for item */}
                      <div className="text-xs font-bold text-neutral-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.items.length > 0 && (
          <div className="p-5 border-t border-neutral-200 bg-neutral-50 space-y-3">
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-neutral-900">
                  {remainingForFreeShipping === 0 ? 'FREE' : formatCurrency(250)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Estimated Total</span>
                <span>
                  {formatCurrency(totalAmount + (remainingForFreeShipping === 0 ? 0 : 250))}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted 256-bit checkout guaranteed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
