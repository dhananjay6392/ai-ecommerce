import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Heart,
  ShieldCheck,
  LogOut,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  KeyRound,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

export const AccountPage = () => {
  const { currentUser, logout, updateProfile, refreshUser } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // profile, addresses, orders, wishlist, security
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', message: '' });

  // Profile Form state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Address Management state
  const [addresses, setAddresses] = useState(currentUser?.addresses || []);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Wishlist state
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Keep state synced with currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
      setAddresses(currentUser.addresses || []);
    }
  }, [currentUser]);

  // Fetch orders when tab is clicked
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await api.get('/orders/myorders').catch(() => null);
          if (res?.orders) {
            setOrders(res.orders);
          } else {
            // fallback attempt /api/orders
            const generalRes = await api.get('/orders').catch(() => null);
            setOrders(generalRes?.orders || generalRes?.data || []);
          }
        } catch (err) {
          console.error('Failed to load orders', err);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  // Fetch wishlist products when tab is clicked
  useEffect(() => {
    if (activeTab === 'wishlist') {
      const fetchWishlist = async () => {
        setWishlistLoading(true);
        try {
          const userWishlist = currentUser?.wishlist || [];
          if (userWishlist.length > 0) {
            const res = await api.get('/products?limit=50').catch(() => null);
            const allProducts = res?.products || [];
            const filtered = allProducts.filter((p) =>
              userWishlist.includes(p._id) || userWishlist.some((w) => w._id === p._id || w === p._id)
            );
            setWishlistProducts(filtered);
          } else {
            setWishlistProducts([]);
          }
        } catch (err) {
          console.error('Failed to load wishlist products', err);
        } finally {
          setWishlistLoading(false);
        }
      };
      fetchWishlist();
    }
  }, [activeTab, currentUser]);

  const showNotification = (type, message) => {
    setNotice({ type, message });
    setTimeout(() => {
      setNotice({ type: '', message: '' });
    }, 4000);
  };

  // 1. Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, phone, avatar });
      showNotification('success', 'Profile details updated successfully.');
    } catch (err) {
      showNotification('error', err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Address Management
  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({
        fullName: addr.fullName || '',
        phone: addr.phone || '',
        addressLine1: addr.addressLine1 || addr.street || '',
        addressLine2: addr.addressLine2 || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || '',
        country: addr.country || 'India',
        isDefault: addr.isDefault || false,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        fullName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddressId) {
        const res = await api.put(`/users/addresses/${editingAddressId}`, addressForm);
        setAddresses(res.addresses);
        showNotification('success', 'Address updated successfully.');
      } else {
        const res = await api.post('/users/addresses', addressForm);
        setAddresses(res.addresses);
        showNotification('success', 'New address added.');
      }
      await refreshUser();
      setIsAddressModalOpen(false);
    } catch (err) {
      showNotification('error', err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      setAddresses(res.addresses);
      await refreshUser();
      showNotification('success', 'Address removed.');
    } catch (err) {
      showNotification('error', err.message || 'Failed to remove address.');
    }
  };

  // 3. Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showNotification('error', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('error', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      showNotification('success', 'Password updated successfully. Please use it on your next login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification('error', err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, count: currentUser?.wishlist?.length || 0 },
    { id: 'security', label: 'Security & Password', icon: KeyRound },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 sm:space-x-5">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={currentUser?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-neutral-200 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 text-white font-black text-2xl flex items-center justify-center shadow-xs">
                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {currentUser?.name || 'Customer Profile'}
              </h1>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                (currentUser?.role || '').toUpperCase() === 'ADMIN'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}>
                {currentUser?.role || 'CUSTOMER'}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{currentUser?.email}</p>
            {currentUser?.phone && (
              <p className="text-[11px] text-neutral-400">{currentUser.phone}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {(currentUser?.role || '').toUpperCase() === 'ADMIN' && (
            <Link
              to="/admin"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 text-xs font-semibold border border-neutral-200 hover:border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Notice Alert */}
      {notice.message && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium flex items-center space-x-2.5 animate-in fade-in duration-150 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Main Grid: Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-3 shadow-xs space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-bold text-neutral-900">Personal Information</h2>
                <p className="text-xs text-neutral-500">
                  Update your contact details, name, and profile picture avatar.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Email address is tied to your account identity and cannot be edited directly.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Saved Delivery Addresses</h2>
                  <p className="text-xs text-neutral-500">
                    Manage multi-location shipping destinations for streamlined checkout.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddressModal()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800">No saved addresses yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Add your residential or office shipping address to enable rapid dispatch.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 relative ${
                        addr.isDefault
                          ? 'border-neutral-900 bg-neutral-50/50 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900">
                          {addr.fullName || currentUser?.name}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white uppercase tracking-wider">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-neutral-600 space-y-0.5">
                        <p>{addr.addressLine1 || addr.street}</p>
                        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                        <p>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-neutral-400">{addr.country || 'India'}</p>
                        {addr.phone && (
                          <p className="text-neutral-500 pt-1 font-mono text-[11px]">
                            Phone: {addr.phone}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenAddressModal(addr)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-bold text-neutral-900">Order History</h2>
                <p className="text-xs text-neutral-500">
                  Track delivery progress, review purchase receipts, and manage dispatches.
                </p>
              </div>

              {ordersLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                  <p className="text-xs text-neutral-400">Loading order records...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800">No orders placed yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    When you purchase through IntelliCart, your verified invoices and dispatch timelines will appear here.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-xs"
                  >
                    <span>Explore Products</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-neutral-200 rounded-2xl p-5 space-y-4 hover:border-neutral-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
                        <div>
                          <p className="text-xs font-bold text-neutral-900">
                            Order #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-extrabold text-neutral-900">
                            ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.orderStatus === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.orderStatus || 'PROCESSING'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(order.orderItems || order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-800">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-neutral-500 font-mono">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-bold text-neutral-900">Curated Wishlist</h2>
                <p className="text-xs text-neutral-500">
                  Products you've saved for future dispatch.
                </p>
              </div>

              {wishlistLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
                  <p className="text-xs text-neutral-400">Loading wishlist items...</p>
                </div>
              ) : wishlistProducts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800">Your wishlist is empty</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Browse our premium catalogue and tap the heart icon on any product to save it here.
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-xs"
                  >
                    <span>Browse Catalog</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((product) => (
                    <div
                      key={product._id}
                      className="border border-neutral-200 rounded-2xl p-4 flex space-x-4 items-center hover:border-neutral-300 transition"
                    >
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80'}
                        alt={product.name}
                        className="w-20 h-20 rounded-xl object-cover border border-neutral-100"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          to={`/product/${product._id}`}
                          className="text-xs font-bold text-neutral-900 hover:underline block truncate"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs font-extrabold text-neutral-900">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            setIsCartOpen(true);
                          }}
                          className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold transition"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-lg font-bold text-neutral-900">Security & Authentication</h2>
                <p className="text-xs text-neutral-500">
                  Update your access password and review active authentication settings.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-2.5 p-1 text-neutral-400 hover:text-neutral-700 transition"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    New Password (Minimum 8 Characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 p-1 text-neutral-400 hover:text-neutral-700 transition"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Address Edit/Add Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Fill in the location details for automated checkout calculation.
            </p>

            <form onSubmit={handleAddressSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Address Line 1 (Flat, House, Building)
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Address Line 2 (Area, Street, Landmark)
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 w-3.5 h-3.5"
                  />
                  <span>Set as default delivery address</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition"
                >
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
