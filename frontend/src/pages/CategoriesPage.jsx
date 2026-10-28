import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles } from 'lucide-react';
import { getCategories } from '../services/productService';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800">
          <Layers className="w-3.5 h-3.5" />
          <span>Curated Disciplines</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Product Categories & Collections
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          Explore precision-engineered hardware, spatial acoustics, studio optics, and intelligent IoT systems organized by functional category.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${cat.slug}`}
            className="group relative rounded-2xl bg-white border border-neutral-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all duration-300 flex flex-col"
          >
            {/* Visual Photography Container */}
            <div className="aspect-[16/10] bg-neutral-100 overflow-hidden relative">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-neutral-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  {cat.itemCount} Curated Models
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">
                  {cat.name}
                </h3>
              </div>
            </div>

            {/* Description & Action */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-neutral-600 leading-relaxed">
                {cat.description}
              </p>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                <span>Browse {cat.name}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
