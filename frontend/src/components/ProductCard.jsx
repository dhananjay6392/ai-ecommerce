import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Plus, Sparkles, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getDiscountedPrice } from '../utils/format';

export const ProductCard = ({ product, showRecommendationBadge = false }) => {
  const { addToCart, cart } = useCart();
  const { user, toggleWishlist } = useAuth();

  if (!product) return null;

  const isWishlisted = user?.wishlist?.includes(product._id);
  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 8;

  // Check if item is already in cart
  const inCart = cart?.items?.some(
    (item) => (item.product?._id || item.product?.id || item.product) === product._id
  );

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <div className="group relative bg-white border border-neutral-200/90 rounded-2xl overflow-hidden hover:border-neutral-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] sm:aspect-square bg-neutral-100/70 p-4 sm:p-6 overflow-hidden flex items-center justify-center">
        {/* Recommendation or Sale Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.discount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-neutral-900 text-white shadow-2xs">
              Save {product.discount}%
            </span>
          )}
          {showRecommendationBadge && product.matchScore && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 text-blue-600 border border-blue-200 shadow-2xs flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{Math.round(product.matchScore * 100)}% Match</span>
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-xs'
              : 'bg-white/90 text-neutral-400 hover:text-rose-500 hover:bg-white border border-neutral-200/80 shadow-xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Image */}
        <Link to={`/product/${product._id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={product.thumbnail || product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Details Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
        <div>
          {/* Category & Brand Eyebrow */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span className="font-semibold text-neutral-700 tracking-wider text-[11px] uppercase">
              {product.brand}
            </span>
            <span className="text-[11px] text-neutral-400 truncate max-w-[120px]">
              {product.category?.name || product.categoryName}
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product._id}`} className="block">
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Tagline / Subtitle */}
          {product.tagline && (
            <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
              {product.tagline}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center space-x-1.5 mt-2">
            <div className="flex text-amber-400 items-center">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-semibold text-neutral-800 ml-1">
                {(product.averageRating || product.rating || 4.8).toFixed(1)}
              </span>
            </div>
            <span className="text-neutral-300 text-xs">•</span>
            <span className="text-xs text-neutral-400">
              ({product.reviewCount || 24} reviews)
            </span>
          </div>

          {/* Stock state */}
          {isLowStock && (
            <p className="text-[11px] text-amber-600 font-medium mt-1.5">
              Only {product.stock} units left in stock
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between mt-auto">
          <div>
            <div className="text-base font-bold text-neutral-900 tracking-tight">
              {formatCurrency(discountedPrice)}
            </div>
            {product.discount > 0 && (
              <div className="text-[11px] text-neutral-400 line-through">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : inCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs active:scale-95'
            }`}
          >
            {inCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>In Bag</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
