import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ isAdminMode = false }) => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoNotice, setDemoNotice] = useState('');

  // Target redirect destination
  const from = location.state?.from?.pathname || (isAdminMode ? '/admin' : '/account');

  // If already authenticated and matches requested access, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isAdminMode && isAdmin) {
        navigate('/admin', { replace: true });
      } else if (!isAdminMode) {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isAdminMode, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDemoNotice('');
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (isAdminMode && (res.user.role || '').toUpperCase() !== 'ADMIN') {
        setError('This portal requires Administrator credentials. You are signed in as a customer.');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPw, label) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setDemoNotice(`Loaded ${label} credentials.`);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-neutral-900/5 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-semibold">
            {isAdminMode ? (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin Management Portal</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>IntelliCart Membership</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {isAdminMode ? 'Administrator Sign In' : 'Sign In to IntelliCart'}
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {isAdminMode
              ? 'Authorized access to ML pipelines, user roles, catalog, and store operations.'
              : 'Access your saved wishlist, personalized recommendations, and orders.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2 animate-in fade-in duration-150">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo notice */}
        {demoNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{demoNotice}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminMode ? 'admin@intellicart.com' : 'name@example.com'}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('Password recovery is enabled. Please contact support or use a verified recovery code.')}
                className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-neutral-400 hover:text-neutral-700 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-neutral-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-3.5 h-3.5"
              />
              <span>Remember me for 7 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Development Demo Accounts */}
        <div className="pt-4 border-t border-neutral-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
            <span>Quick Demo Access (Dev Mode)</span>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">Dev Only</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('alex@example.com', 'Customer@123456', 'Customer')}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition text-left"
            >
              <div className="font-semibold text-neutral-900 flex items-center justify-between">
                <span>Customer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono truncate">alex@example.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@intellicart.com', 'Admin@123456', 'Admin')}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition text-left"
            >
              <div className="font-semibold text-neutral-900 flex items-center justify-between">
                <span>Administrator</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono truncate">admin@intellicart.com</p>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2 text-xs text-neutral-500">
          {isAdminMode ? (
            <Link to="/login" className="text-neutral-900 font-semibold hover:underline">
              Switch to Customer Sign In
            </Link>
          ) : (
            <span>
              Don't have an account?{' '}
              <Link to="/register" className="text-neutral-900 font-semibold hover:underline">
                Create one now
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
