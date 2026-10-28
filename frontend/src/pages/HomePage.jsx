import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  Star,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import {
  getFeaturedProducts,
  getTrendingProducts,
  getRecommendedProducts,
  getCategories,
} from '../services/productService';
import { formatCurrency, getDiscountedPrice } from '../utils/format';

export const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hero showcase items
  const heroItems = [
    {
      _id: 'prod-001',
      title: 'AeroPulse ANC Pro',
      tagline: 'Custom 40mm Beryllium Drivers & Adaptive Hybrid Noise Cancellation',
      category: 'Audio & Acoustics',
      price: 24999,
      discount: 15,
      rating: 4.9,
      reviewCount: 184,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
      badge: 'Flagship Audio',
    },
    {
      _id: 'prod-002',
      title: 'QuantumBook Edge 16',
      tagline: '3.2K OLED 120Hz Display with 16-Core Neural Engine',
      category: 'Laptops & Workstations',
      price: 149999,
      discount: 10,
      rating: 4.8,
      reviewCount: 92,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
      badge: 'Flagship M3',
    },
    {
      _id: 'prod-003',
      title: 'Vanguard Titan GPS',
      tagline: 'Dual-Frequency GNSS & Medical-Grade ECG Telemetry',
      category: 'Wearables & Health',
      price: 32999,
      discount: 18,
      rating: 4.7,
      reviewCount: 230,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
      badge: 'Titanium Grade 5',
    },
  ];

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const currentHero = heroItems[activeHeroIdx];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [featured, trending, recs, cats] = await Promise.all([
          getFeaturedProducts(6),
          getTrendingProducts(4),
          getRecommendedProducts(null, 4),
          getCategories(),
        ]);
        setFeaturedProducts(featured);
        setTrendingProducts(trending);
        setRecommendedProducts(recs);
        setCategories(cats);
      } catch (err) {
        console.error('Home page loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="border-b border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/50 pt-8 pb-16 sm:pt-14 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Headline Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="uppercase tracking-wider text-[11px] font-bold">IntelliCart Hardware Release 2026</span>
              </div>

              {/* Strong Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.1]">
                Intelligent design,{' '}
                <span className="text-neutral-500 font-medium">engineered for how you live & create.</span>
              </h1>

              {/* Short Supporting Text */}
              <p className="text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed">
                Discover next-generation acoustics, precision workstations, and connected devices curated for purity, tactile satisfaction, and effortless performance.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/categories"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Explore Collections</span>
                </Link>
              </div>

              {/* Micro Trust Stats */}
              <div className="pt-6 border-t border-neutral-200/80 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-lg font-bold text-neutral-900">48-Hr</div>
                  <div className="text-xs text-neutral-500">Express Delivery</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900">100%</div>
                  <div className="text-xs text-neutral-500">Authentic Warranty</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900">30-Day</div>
                  <div className="text-xs text-neutral-500">Hassle-Free Returns</div>
                </div>
              </div>
            </div>

            {/* Right Large Premium Product Visual Area */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm transition-all">
                {/* Visual Area Top Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-800">
                    {currentHero.badge}
                  </span>
                  <div className="flex items-center space-x-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-xs font-bold text-neutral-900 ml-1">{currentHero.rating}</span>
                    <span className="text-[11px] text-neutral-400">({currentHero.reviewCount})</span>
                  </div>
                </div>

                {/* Main Product Photography */}
                <div className="aspect-[4/3] rounded-xl bg-neutral-50 p-6 flex items-center justify-center overflow-hidden mb-5 relative group">
                  <img
                    src={currentHero.image}
                    alt={currentHero.title}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                  {currentHero.discount > 0 && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-neutral-900 text-white">
                      -{currentHero.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 mb-4">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {currentHero.category}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
                    {currentHero.title}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2">
                    {currentHero.tagline}
                  </p>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <div>
                    <div className="text-xl font-bold text-neutral-900">
                      {formatCurrency(getDiscountedPrice(currentHero.price, currentHero.discount))}
                    </div>
                    {currentHero.discount > 0 && (
                      <div className="text-xs text-neutral-400 line-through">
                        {formatCurrency(currentHero.price)}
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/product/${currentHero._id}`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center space-x-1.5"
                  >
                    <span>View Product</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Showcase Switcher Tabs */}
                <div className="flex items-center justify-center space-x-2 pt-5 border-t border-neutral-100 mt-4">
                  {heroItems.map((item, idx) => (
                    <button
                      key={item._id}
                      onClick={() => setActiveHeroIdx(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeHeroIdx === idx ? 'w-8 bg-neutral-900' : 'w-2 bg-neutral-200 hover:bg-neutral-300'
                      }`}
                      aria-label={`Showcase item ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4 text-neutral-700" />
              <span>Curated Collections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Explore by Category
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1 transition"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group p-4 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all flex flex-col items-center text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-xl bg-neutral-50 p-1.5 overflow-hidden flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors block">
                  {cat.name}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {cat.itemCount} items
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Handpicked Performance
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Featured Innovations
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1 transition"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. PROMOTIONAL SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-neutral-900 text-white overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Ambient subtle glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-neutral-800 blur-3xl pointer-events-none opacity-60" />

          <div className="relative z-10 max-w-xl space-y-4 text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 inline-block">
              Limited Edition Release
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              The Obsidian Acoustic Series.
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Crafted with aircraft-grade milled titanium hardware and custom beryllium acoustic chambers. Experience spatial sound tuned to the millihertz.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/product/prod-001"
                className="px-6 py-3 rounded-xl bg-white text-neutral-950 font-semibold text-xs tracking-wide hover:bg-neutral-100 transition shadow-sm"
              >
                Shop the AeroPulse Pro
              </Link>
              <Link
                to="/deals"
                className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-200 font-medium text-xs hover:border-neutral-500 hover:text-white transition"
              >
                View Autumn Deals
              </Link>
            </div>
          </div>

          <div className="relative z-10 w-full lg:w-1/2 max-w-md aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800/80 p-6 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
              alt="Obsidian Series AeroPulse Pro"
              className="w-full h-full object-contain mix-blend-screen hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* 5. "RECOMMENDED FOR YOU" SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Intelligent RecSys Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Recommended For You
              </h2>
              <p className="text-xs text-neutral-500">
                Personalized hardware selections curated from browsing preferences and acoustic telemetry.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1 transition self-start sm:self-auto"
            >
              <span>Explore All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendedProducts.map((product) => (
              <ProductCard key={product._id} product={product} showRecommendationBadge={true} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Highest Demand</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Trending Devices & Peripherals
            </h2>
          </div>
          <Link
            to="/shop?sort=sales"
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center space-x-1 transition"
          >
            <span>View Most Popular</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trendingProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. CUSTOMER TRUST SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Secure Payments */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Secure Payments</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              256-bit SSL encryption with Razorpay, UPI, RuPay, and major global credit cards.
            </p>
          </div>

          {/* Fast Delivery */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Fast Express Delivery</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Priority dispatch within 24 hours. Complimentary air courier on orders over ₹5,000.
            </p>
          </div>

          {/* Easy Returns */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Easy 30-Day Returns</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Zero hassle return policy with free doorstep pickup and immediate refund processing.
            </p>
          </div>

          {/* Verified Products */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Verified Products</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              100% authentic inventory directly sourced from brand manufacturers with warranty.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
