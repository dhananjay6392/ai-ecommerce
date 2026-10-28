import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Check,
  Globe,
} from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-neutral-200">
          {/* Brand & Newsletter (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter">
                IC
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-neutral-900 tracking-tight font-display">
                  IntelliCart
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>
            </Link>

            <p className="text-neutral-500 max-w-sm leading-relaxed text-xs">
              A premium commerce destination for engineered acoustics, computational hardware, and intelligent lifestyle devices.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <span className="block text-xs font-semibold text-neutral-900 mb-2">
                Join the IntelliCart Dispatch
              </span>
              {subscribed ? (
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-xs font-medium">
                  <Check className="w-4 h-4" />
                  <span>Thank you for subscribing. Check your inbox soon.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center space-x-1.5 shrink-0"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3.5">
              Shop Collections
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/shop?category=audio" className="hover:text-neutral-950 transition">
                  Audio & Acoustics
                </Link>
              </li>
              <li>
                <Link to="/shop?category=computing" className="hover:text-neutral-950 transition">
                  Laptops & Workstations
                </Link>
              </li>
              <li>
                <Link to="/shop?category=wearables" className="hover:text-neutral-950 transition">
                  Wearables & Health
                </Link>
              </li>
              <li>
                <Link to="/shop?category=smart-home" className="hover:text-neutral-950 transition">
                  Smart Living & IoT
                </Link>
              </li>
              <li>
                <Link to="/shop?category=cameras" className="hover:text-neutral-950 transition">
                  Cameras & Optics
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-blue-600 hover:underline font-medium">
                  Deals & Special Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3.5">
              Customer Support
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/orders" className="hover:text-neutral-950 transition">
                  Order Tracking & History
                </Link>
              </li>
              <li>
                <a href="#shipping" className="hover:text-neutral-950 transition">
                  Shipping & Express Delivery
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-neutral-950 transition">
                  30-Day Hassle-Free Returns
                </a>
              </li>
              <li>
                <a href="#warranty" className="hover:text-neutral-950 transition">
                  Manufacturer Warranty
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-neutral-950 transition">
                  Contact Concierge Support
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-3.5">
              About IntelliCart
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#story" className="hover:text-neutral-950 transition">
                  Our Engineering Story
                </a>
              </li>
              <li>
                <a href="#sustainability" className="hover:text-neutral-950 transition">
                  Carbon-Neutral Logistics
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-neutral-950 transition">
                  Privacy & Data Stewardship
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-neutral-950 transition flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin Intelligence</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Security */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-[11px]">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5" />
            <span>India / English (INR ₹)</span>
            <span className="text-neutral-300">•</span>
            <span>© {new Date().getFullYear()} IntelliCart Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-neutral-400 font-medium">Verified Payment Gateways:</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold text-neutral-700 text-[10px]">
                UPI
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold text-neutral-700 text-[10px]">
                VISA
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold text-neutral-700 text-[10px]">
                MASTERCARD
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold text-neutral-700 text-[10px]">
                RAZORPAY
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
