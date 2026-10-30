import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPw) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPw);
    } catch (err) {
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>IntelliCart Membership</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {authModalTab === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {authModalTab === 'login'
              ? 'Access saved wishlist, express order dispatch, and recommendations'
              : 'Join to experience intelligent, personalized commerce'}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('login');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('register');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalTab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {authModalTab === 'register' ? 'Password (Min. 8 Characters)' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                minLength={authModalTab === 'register' ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition mt-2"
          >
            {authModalTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-6 pt-5 border-t border-neutral-100">
          <p className="text-center text-[10px] font-semibold text-neutral-400 mb-2.5 uppercase tracking-wider">
            Quick One-Click Demo Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('alex@example.com', 'Customer@123456')}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <User className="w-3.5 h-3.5 text-neutral-600" />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('admin@intellicart.com', 'Admin@123456')}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5 text-neutral-600" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
