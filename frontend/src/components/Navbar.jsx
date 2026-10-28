import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SearchModal } from './SearchModal';

export const Navbar = () => {
  const location = useLocation();
  const { user, openAuthModal, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const wishlistCount = user?.wishlist?.length || 0;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'Deals', path: '/deals' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-all">
        {/* Top subtle utility strip */}
        <div className="bg-neutral-900 text-neutral-300 text-[11px] py-1.5 px-4 text-center tracking-wide font-medium flex items-center justify-center space-x-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Complimentary express shipping on orders over ₹5,000</span>
          <span className="text-neutral-500">•</span>
          <Link to="/deals" className="underline hover:text-white transition">
            Explore Autumn Releases
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Desktop Left: Logo */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter group-hover:bg-blue-600 transition-colors">
                  IC
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-neutral-900 tracking-tight font-display">
                    IntelliCart
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
              </Link>
            </div>

            {/* Desktop Center: Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    isActive(link.path)
                      ? 'text-neutral-950 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Right: Actions */}
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
              {/* Search Icon / Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition"
                title="Search products (Cmd+K)"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs text-neutral-400 font-normal">Search...</span>
              </button>

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition"
                title="Shopping Bag"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* User / Account Icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (user) {
                      setIsUserMenuOpen(!isUserMenuOpen);
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="p-2.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition flex items-center space-x-1.5"
                  title={user ? user.name : 'Account'}
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                  {user && (
                    <span className="text-xs font-medium text-neutral-700 max-w-[80px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  )}
                </button>

                {/* Account dropdown */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <User className="w-4 h-4 text-neutral-400" />
                      <span>Account & Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-neutral-400" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <Heart className="w-4 h-4 text-neutral-400" />
                      <span>My Wishlist ({wishlistCount})</span>
                    </Link>
                    {(user.role || '').toUpperCase() === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 font-medium transition"
                      >
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition mt-1 border-t border-neutral-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Actions: Search, Cart, Hamburger */}
            <div className="flex md:hidden items-center space-x-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive(link.path)
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
              ))}
              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <span className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Wishlist</span>
                </span>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </nav>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">{user.name}</p>
                      <p className="text-[11px] text-neutral-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 font-medium hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-neutral-900 text-white text-center hover:bg-neutral-800 transition"
                >
                  Sign In / Create Account
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
