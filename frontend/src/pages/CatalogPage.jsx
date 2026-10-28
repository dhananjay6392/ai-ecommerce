import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Check,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import {
  queryProducts,
  getCategories,
  getBrands,
} from '../services/productService';

export const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters from URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'featured';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getBrands()]).then(([cats, bnds]) => {
      setCategories(cats);
      setBrands(bnds);
    });
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await queryProducts({
          search,
          category,
          brand,
          sort,
          minPrice,
          maxPrice,
          minRating,
          inStock,
          page,
          limit: 9,
        });

        setProducts(res.products);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value.toString());
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleBrandToggle = (selectedBrand) => {
    const existing = brand ? brand.split(',') : [];
    const index = existing.indexOf(selectedBrand);
    if (index > -1) {
      existing.splice(index, 1);
    } else {
      existing.push(selectedBrand);
    }
    updateFilter('brand', existing.join(','));
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = [
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock ? 'true' : '',
  ].filter(Boolean).length;

  const currentCategoryObj = categories.find((c) => c.slug === category);

  // Reusable Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
          Categories
        </label>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('category', '')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !category
                ? 'bg-neutral-900 text-white font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateFilter('category', c.slug)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                category === c.slug
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>{c.name}</span>
              <span className={`text-[10px] ${category === c.slug ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {c.itemCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
          Brands
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {brands.map((b) => {
            const isChecked = brand.split(',').includes(b);
            return (
              <label
                key={b}
                className="flex items-center space-x-2 text-xs text-neutral-600 hover:text-neutral-950 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleBrandToggle(b)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                />
                <span>{b}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <label className="block text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
          Customer Rating
        </label>
        <div className="space-y-1">
          {[4, 3].map((stars) => (
            <button
              key={stars}
              onClick={() => updateFilter('minRating', minRating === stars.toString() ? '' : stars)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                minRating === stars.toString()
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <div className="flex items-center text-amber-400 space-x-1">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
                <span className="text-neutral-700 ml-1 font-medium">& Up</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* In-Stock Toggle */}
      <div className="pt-2 border-t border-neutral-200">
        <label className="flex items-center space-x-2.5 text-xs text-neutral-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateFilter('inStock', e.target.checked)}
            className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
          />
          <span className="font-medium">In Stock Items Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="pb-6 mb-8 border-b border-neutral-200">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-neutral-400 mb-3">
          <Link to="/" className="hover:text-neutral-900 transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-neutral-900 transition">
            Shop
          </Link>
          {currentCategoryObj && (
            <>
              <span>/</span>
              <span className="text-neutral-900 font-medium">{currentCategoryObj.name}</span>
            </>
          )}
          {search && (
            <>
              <span>/</span>
              <span className="text-neutral-900 font-medium">Search: "{search}"</span>
            </>
          )}
        </nav>

        {/* Title, Result Count & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              {currentCategoryObj ? currentCategoryObj.name : search ? `Search: ${search}` : 'Catalog & Collections'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Showing <strong className="text-neutral-900">{totalCount}</strong> curated devices & systems
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-lg bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 flex items-center space-x-2 shadow-2xs hover:bg-neutral-50 transition"
            >
              <Filter className="w-4 h-4 text-neutral-600" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500 hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-900 shadow-2xs transition"
              >
                <option value="featured">Featured Innovations</option>
                <option value="sales">Best Selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rating</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Desktop Sidebar */}
        <aside className="hidden lg:block space-y-6 sticky top-24">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <FilterContent />
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <main className="lg:col-span-3 space-y-8">
          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
              <span className="text-xs font-semibold text-neutral-500 mr-1">Active filters:</span>
              {category && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-800">
                  <span>Category: {currentCategoryObj?.name || category}</span>
                  <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-neutral-700" onClick={() => updateFilter('category', '')} />
                </span>
              )}
              {brand && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-800">
                  <span>Brand: {brand}</span>
                  <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-neutral-700" onClick={() => updateFilter('brand', '')} />
                </span>
              )}
              {search && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-800">
                  <span>Search: "{search}"</span>
                  <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-neutral-700" onClick={() => updateFilter('search', '')} />
                </span>
              )}
              {minRating && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-800">
                  <span>Rating: {minRating}★+</span>
                  <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-neutral-700" onClick={() => updateFilter('minRating', '')} />
                </span>
              )}
              {inStock && (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-800">
                  <span>In Stock Only</span>
                  <X className="w-3 h-3 cursor-pointer text-neutral-400 hover:text-neutral-700" onClick={() => updateFilter('inStock', false)} />
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-600 hover:underline font-medium ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Skeletons or Grid or Empty State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-4 animate-pulse"
                >
                  <div className="w-full aspect-square bg-neutral-100 rounded-xl" />
                  <div className="w-2/3 h-4 bg-neutral-100 rounded" />
                  <div className="w-1/2 h-3 bg-neutral-100 rounded" />
                  <div className="w-1/3 h-5 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">No Products Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No items match your active filters. Try clearing criteria or searching with another term.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-8 border-t border-neutral-200 flex items-center justify-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => updateFilter('page', page - 1)}
                className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 shadow-2xs"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const num = i + 1;
                return (
                  <button
                    key={num}
                    onClick={() => updateFilter('page', num)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${
                      page === num
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', page + 1)}
                className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 shadow-2xs"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 3. MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in lg:hidden">
          <div
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-6">
              <span className="text-sm font-bold text-neutral-900">Filters & Facets</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterContent />

            <div className="pt-6 mt-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
