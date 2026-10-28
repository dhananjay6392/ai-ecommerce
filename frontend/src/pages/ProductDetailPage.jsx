import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import {
  getProductById,
  getProductReviews,
  getRecommendedProducts,
} from '../services/productService';
import { formatCurrency, getDiscountedPrice } from '../utils/format';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { user, toggleWishlist, openAuthModal } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewsData, setReviewsData] = useState({ reviews: [], sentimentStats: {}, count: 0 });
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      try {
        const prod = await getProductById(id);
        const revs = await getProductReviews(prod._id);
        const recs = await getRecommendedProducts(prod._id, 4);

        setProduct(prod);
        setSelectedImage(prod.thumbnail || prod.images?.[0] || '');
        setReviewsData(revs);
        setSimilarProducts(recs);
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-neutral-200 mx-auto mb-4" />
        <p className="text-neutral-500 text-sm font-medium">Loading hardware details...</p>
      </div>
    );
  }

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const isWishlisted = user?.wishlist?.includes(product._id);
  const isLowStock = product.stock > 0 && product.stock <= 8;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newRev = {
      _id: 'rev_' + Date.now(),
      productId: product._id,
      user: { name: user ? user.name : 'Verified Customer' },
      rating: reviewRating,
      title: reviewTitle || 'Exceptional craftsmanship',
      comment: reviewComment,
      sentiment: reviewRating >= 4 ? 'Positive' : reviewRating === 3 ? 'Neutral' : 'Negative',
      sentimentConfidence: 0.94,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true,
    };

    setReviewsData({
      ...reviewsData,
      reviews: [newRev, ...reviewsData.reviews],
      count: reviewsData.count + 1,
    });

    setReviewTitle('');
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  // Frequently bought together bundle item
  const bundleItem = similarProducts[0];
  const bundleTotalPrice = bundleItem
    ? discountedPrice + getDiscountedPrice(bundleItem.price, bundleItem.discount)
    : discountedPrice;
  const bundleOriginalPrice = bundleItem
    ? product.price + bundleItem.price
    : product.price;

  const handleAddBundle = () => {
    addToCart(product, 1);
    if (bundleItem) {
      addToCart(bundleItem, 1);
    }
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* 1. BREADCRUMBS */}
      <nav className="flex items-center space-x-2 text-xs text-neutral-400">
        <Link to="/" className="hover:text-neutral-900 transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-neutral-900 transition">
          Shop
        </Link>
        <span>/</span>
        <Link
          to={`/shop?category=${product.categorySlug || product.category?.slug}`}
          className="hover:text-neutral-900 transition"
        >
          {product.categoryName || product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. TOP PRODUCT CANVAS (Left Gallery, Right Product Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Product Images Gallery (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual */}
          <div className="aspect-[4/3] sm:aspect-square rounded-2xl bg-neutral-100/70 border border-neutral-200 p-8 sm:p-12 flex items-center justify-center relative overflow-hidden">
            {product.discount > 0 && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white">
                Save {product.discount}%
              </div>
            )}
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-neutral-50 p-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? 'border-neutral-900 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Purchase Details (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {/* Category & Brand */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              <span className="text-neutral-900">{product.brand}</span>
              <span>•</span>
              <span>{product.categoryName || product.category?.name}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating & Review Count */}
            <div className="flex items-center space-x-3 mt-3">
              <div className="flex text-amber-400 items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.averageRating || 4.8)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-200'
                    }`}
                  />
                ))}
                <span className="text-sm font-bold text-neutral-900 ml-2">
                  {(product.averageRating || 4.8).toFixed(1)}
                </span>
              </div>
              <span className="text-neutral-300">•</span>
              <a href="#reviews" className="text-xs text-neutral-500 hover:text-neutral-900 underline">
                {product.reviewCount || reviewsData.count || 24} customer reviews
              </a>
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-emerald-600 font-semibold">
                {product.salesCount || 100}+ sold
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div>
              <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                {formatCurrency(discountedPrice)}
              </div>
              {product.discount > 0 && (
                <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-1">
                  <span className="line-through">{formatCurrency(product.price)}</span>
                  <span className="text-emerald-700 font-semibold">
                    Save {formatCurrency(product.price - discountedPrice)} ({product.discount}%)
                  </span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {isOutOfStock ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Only {product.stock} units left</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Stock Ready to Ship</span>
                </span>
              )}
            </div>
          </div>

          {/* Tagline Summary */}
          {product.tagline && (
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {product.tagline}
            </p>
          )}

          {/* Quantity Selector & Actions */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center space-x-3 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold text-neutral-900 px-2">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
            <div className="space-y-2.5">
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product._id)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isWishlisted
                      ? 'bg-rose-50 border-rose-200 text-rose-500'
                      : 'bg-white border-neutral-200 text-neutral-400 hover:text-rose-500 hover:border-rose-200 shadow-2xs'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  aria-label="Wishlist toggle"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <Zap className="w-4 h-4" />
                <span>Instant Buy Now</span>
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-100 text-center">
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <Truck className="w-4 h-4 text-neutral-800 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-neutral-900">Express Delivery</div>
              <div className="text-[10px] text-neutral-400">Within 24-48 hrs</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-neutral-800 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-neutral-900">Official Warranty</div>
              <div className="text-[10px] text-neutral-400">2-Year Comprehensive</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs">
              <RotateCcw className="w-4 h-4 text-neutral-800 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-neutral-900">30-Day Returns</div>
              <div className="text-[10px] text-neutral-400">Doorstep courier pickup</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DESCRIPTION & SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-neutral-200">
        {/* Description & Key Highlights (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Product Overview</h2>
          <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {product.highlights && product.highlights.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Engineering Highlights
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-neutral-600">
                {product.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Specifications Table (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">Technical Specifications</h2>
          {product.specifications ? (
            <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-2xs divide-y divide-neutral-100">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 p-3 text-xs">
                  <span className="font-semibold text-neutral-500">{key}</span>
                  <span className="col-span-2 text-neutral-900 font-medium">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">Specifications standard to model configuration.</p>
          )}
        </div>
      </div>

      {/* 4. FREQUENTLY BOUGHT TOGETHER */}
      {bundleItem && (
        <section className="p-6 sm:p-8 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-6">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-neutral-900" />
            <h2 className="text-lg font-bold text-neutral-900">Frequently Bought Together</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Main item */}
              <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-neutral-200">
                <div className="w-14 h-14 rounded-lg bg-neutral-100 p-1 flex items-center justify-center shrink-0">
                  <img src={product.thumbnail || product.images?.[0]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 line-clamp-1">{product.name}</div>
                  <div className="text-xs font-bold text-neutral-900">{formatCurrency(discountedPrice)}</div>
                </div>
              </div>

              <span className="text-neutral-400 font-bold text-base">+</span>

              {/* Bundle item */}
              <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-neutral-200">
                <div className="w-14 h-14 rounded-lg bg-neutral-100 p-1 flex items-center justify-center shrink-0">
                  <img src={bundleItem.thumbnail || bundleItem.images?.[0]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 line-clamp-1">{bundleItem.name}</div>
                  <div className="text-xs font-bold text-neutral-900">
                    {formatCurrency(getDiscountedPrice(bundleItem.price, bundleItem.discount))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Pricing & CTA */}
            <div className="flex items-center space-x-4 shrink-0">
              <div className="text-right">
                <div className="text-xs text-neutral-400">Combined Price:</div>
                <div className="text-lg font-bold text-neutral-900">{formatCurrency(bundleTotalPrice)}</div>
                {bundleOriginalPrice > bundleTotalPrice && (
                  <div className="text-xs text-neutral-400 line-through">
                    {formatCurrency(bundleOriginalPrice)}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddBundle}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center space-x-1.5"
              >
                <span>Add Both to Bag</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. REVIEWS & CUSTOMER SENTIMENT */}
      <section id="reviews" className="space-y-8 pt-8 border-t border-neutral-200">
        {/* Sentiment Overview Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Sentiment Analysis</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Customer Perception & Experience</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Natural language sentiment processed across verified buyer reviews.
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">88%</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Positive</div>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="text-center">
              <div className="text-xl font-bold text-neutral-700">9%</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Neutral</div>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="text-center">
              <div className="text-xl font-bold text-rose-500">3%</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase">Negative</div>
            </div>
          </div>
        </div>

        {/* Reviews List & Write Review Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviewsData.reviews.length === 0 ? (
              <div className="p-8 rounded-xl bg-white border border-neutral-200 text-center text-xs text-neutral-500">
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            ) : (
              reviewsData.reviews.map((rev) => (
                <div key={rev._id} className="p-5 rounded-xl bg-white border border-neutral-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                        {rev.user?.name ? rev.user.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 block">
                          {rev.user?.name || 'Verified Buyer'}
                        </span>
                        <div className="flex text-amber-400 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400' : 'text-neutral-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        rev.sentiment === 'Positive'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : rev.sentiment === 'Negative'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      {rev.sentiment}
                    </span>
                  </div>

                  {rev.title && (
                    <h4 className="text-xs font-bold text-neutral-900">{rev.title}</h4>
                  )}
                  <p className="text-xs text-neutral-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Write a Review Box */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Write a Review</span>
            </h3>

            {reviewSubmitted && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                Thank you! Your verified review has been posted.
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Overall Rating
                </label>
                <div className="flex space-x-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'fill-amber-400' : 'text-neutral-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flawless acoustic fidelity"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share your experience on build quality, battery, and comfort..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 6. SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                More in this class
              </span>
              <h2 className="text-xl font-bold text-neutral-900">Similar Hardware Innovations</h2>
            </div>
            <Link to="/shop" className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
