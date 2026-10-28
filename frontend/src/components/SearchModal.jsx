import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Clock, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mockData';
import { formatCurrency, getDiscountedPrice } from '../utils/format';

export const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'AeroPulse ANC Pro',
    'QuantumBook Edge',
    'Titanium Smartwatch',
    'Mechanical Keyboard 75%',
  ]);

  const popularSearches = [
    'ANC Headphones',
    'OLED Workstations',
    'Matter Ambient Lamp',
    'Cinema Camera',
    'MagSafe 3-in-1',
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchTerm('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = searchTerm.trim()
    ? MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSelectSearch = (term) => {
    if (!recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
    onClose();
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSelectSearch(searchTerm.trim());
    }
  };

  const removeRecent = (e, term) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter((t) => t !== term));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-neutral-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center px-4 py-3.5 border-b border-neutral-200">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audio, laptops, smart home, cameras..."
            className="w-full px-3.5 py-1 text-sm sm:text-base text-neutral-900 placeholder-neutral-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 px-2.5 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition"
          >
            ESC
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Live Product Suggestions */}
          {searchTerm.trim() ? (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                <span>Product Matches ({filteredProducts.length})</span>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="text-blue-600 hover:underline flex items-center space-x-1 lowercase font-normal"
                  >
                    <span>view all results</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-600 font-medium">No products found matching "{searchTerm}"</p>
                  <p className="text-xs text-neutral-400 mt-1">Try checking for typos or searching a category like "audio" or "laptops"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((p) => {
                    const discounted = getDiscountedPrice(p.price, p.discount);
                    return (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        onClick={onClose}
                        className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200 group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={p.thumbnail || p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                            {p.brand} • {p.categoryName}
                          </div>
                          <div className="text-sm font-semibold text-neutral-900 truncate group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-neutral-900">{formatCurrency(discounted)}</div>
                          {p.discount > 0 && (
                            <div className="text-[11px] text-neutral-400 line-through">
                              {formatCurrency(p.price)}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      onClick={() => setRecentSearches([])}
                      className="text-[11px] text-neutral-400 hover:text-neutral-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSearch(term)}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition"
                      >
                        <span>{term}</span>
                        <X
                          className="w-3 h-3 text-neutral-400 hover:text-neutral-700"
                          onClick={(e) => removeRecent(e, term)}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trending Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSearch(term)}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-200 hover:text-blue-600 text-neutral-700 rounded-lg text-xs font-medium transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse Collections */}
              <div>
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                  Quick Categories
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOCK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onClose();
                        navigate(`/shop?category=${cat.slug}`);
                      }}
                      className="flex items-center space-x-2.5 p-2 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-left transition"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 truncate">{cat.name}</div>
                        <div className="text-[10px] text-neutral-500">{cat.itemCount} items</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Tip: Press ESC to dismiss</span>
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>IntelliCart Smart Index</span>
          </span>
        </div>
      </div>
    </div>
  );
};
