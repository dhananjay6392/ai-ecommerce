import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import api from '../services/api';

export const WishlistPage = () => {
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  
  const [wishlistedProducts, setWishlistedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user) {
        try {
          const res = await api.get('/wishlist');
          if (res.success) {
            setWishlistedProducts(res.wishlist || []);
          }
        } catch (error) {
          console.error('Error fetching wishlist:', error);
        }
      } else {
        setWishlistedProducts([]);
      }
      setLoading(false);
    };

    fetchWishlist();
  }, [user]);

  const handleAddAllToCart = async () => {
    for (const prod of wishlistedProducts) {
      await addToCart(prod, 1);
      // Wait, let's keep it in wishlist too or remove it?
      // Usually, people just add to cart.
    }
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Saved Hardware</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            My Wishlist ({wishlistedProducts.length})
          </h1>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={handleAddAllToCart}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-2xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Move All to Bag</span>
          </button>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Your wishlist is currently empty</h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Click the heart icon on any product in our catalog to save items you'd like to revisit later.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
