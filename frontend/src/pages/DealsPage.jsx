import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Sparkles, Clock, ArrowRight, Zap } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getDealsProducts } from '../services/productService';

export const DealsPage = () => {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    getDealsProducts().then((deals) => {
      setDealProducts(deals);
      setLoading(false);
    });
  }, []);

  const categories = [
    { id: 'all', label: 'All Deals' },
    { id: 'audio', label: 'Audio & Acoustics' },
    { id: 'computing', label: 'Computing' },
    { id: 'wearables', label: 'Wearables' },
    { id: 'accessories', label: 'Accessories' },
  ];

  const filteredDeals =
    selectedCategory === 'all'
      ? dealProducts
      : dealProducts.filter((p) => p.categorySlug === selectedCategory || p.category?._id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-neutral-900 text-white p-8 sm:p-12 overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Autumn Hardware Showcase • Up to 25% Off</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Special Value & Promotional Releases
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Exclusive pricing on benchmark studio monitors, titanium smartwatches, and mechanical keyboards with complimentary express dispatch.
          </p>
        </div>

        {/* Countdown Pill */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center shrink-0">
          <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
            Limited Time Offers
          </span>
          <div className="flex items-center space-x-3 text-white font-mono text-xl sm:text-2xl font-bold">
            <div>
              <span>02</span>
              <span className="text-[10px] block font-sans text-neutral-400 font-normal">DAYS</span>
            </div>
            <span>:</span>
            <div>
              <span>14</span>
              <span className="text-[10px] block font-sans text-neutral-400 font-normal">HOURS</span>
            </div>
            <span>:</span>
            <div>
              <span>45</span>
              <span className="text-[10px] block font-sans text-neutral-400 font-normal">MINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-neutral-200">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
              selectedCategory === c.id
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-4 animate-pulse">
              <div className="w-full aspect-square bg-neutral-100 rounded-xl" />
              <div className="w-2/3 h-4 bg-neutral-100 rounded" />
              <div className="w-1/3 h-4 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs">
          <p className="text-sm font-semibold text-neutral-900">No active promotions in this category</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-3 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg"
          >
            View All Deals
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((prod) => (
            <ProductCard key={prod._id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};
