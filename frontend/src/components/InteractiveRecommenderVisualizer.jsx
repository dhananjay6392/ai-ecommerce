import React, { useState } from 'react';
import { Sparkles, Sliders, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const InteractiveRecommenderVisualizer = () => {
  const [selectedSeed, setSelectedSeed] = useState('headphones');
  const [viewCount, setViewCount] = useState(3);
  const [cartCount, setCartCount] = useState(1);
  const [wishlistCount, setWishlistCount] = useState(1);
  const [purchaseCount, setPurchaseCount] = useState(1);

  // Preset seeds
  const seeds = [
    { id: 'headphones', name: 'AeroPulse ANC Pro', category: 'Audio' },
    { id: 'laptop', name: 'QuantumBook Edge M3', category: 'Computing' },
    { id: 'smartwatch', name: 'Vanguard Titan AI Watch', category: 'Wearables' },
  ];

  // Calculate simulated live formula scores
  const contentSimBase = selectedSeed === 'headphones' ? 0.92 : selectedSeed === 'laptop' ? 0.88 : 0.85;
  const collabRaw = (viewCount * 1.0) + (wishlistCount * 2.0) + (cartCount * 3.0) + (purchaseCount * 5.0);
  const collabNormalized = Math.min(0.99, collabRaw / 18.0);
  
  // Alpha = 0.4 (Content), Beta = 0.6 (Collaborative)
  const hybridScore = (0.4 * contentSimBase) + (0.6 * collabNormalized);
  const matchPercent = Math.round(hybridScore * 100);

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-10 shadow-stripe relative overflow-hidden">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-stripe-blue/10 via-indigo-100/40 to-transparent rounded-bl-full pointer-events-none" />

      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stripe-blue/10 border border-stripe-blue/20 text-stripe-blue text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Machine Learning Telemetry</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Live Hybrid Recommendation Vectorizer
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Adjust implicit interaction frequencies below to see how IntelliCart’s mathematical scoring formula dynamically weights candidate products in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seed selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Current Seed Product (TF-IDF Vector Center)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {seeds.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSeed(s.id)}
                  className={`p-3 rounded-2xl text-left text-xs font-bold transition-all border ${
                    selectedSeed === s.id
                      ? 'bg-stripe-blue text-white border-stripe-blue shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">{s.name}</div>
                  <div className={`text-[10px] font-normal ${selectedSeed === s.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {s.category}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interaction Sliders */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. User Interaction Frequencies & Weights
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                  <span>Views (1.0x)</span>
                  <span className="text-stripe-blue font-bold">{viewCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={viewCount}
                  onChange={(e) => setViewCount(Number(e.target.value))}
                  className="w-full accent-stripe-blue cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                  <span>Wishlists (2.0x)</span>
                  <span className="text-rose-500 font-bold">{wishlistCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={wishlistCount}
                  onChange={(e) => setWishlistCount(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                  <span>Cart Additions (3.0x)</span>
                  <span className="text-amber-500 font-bold">{cartCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={cartCount}
                  onChange={(e) => setCartCount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-700">
                  <span>Purchases (5.0x)</span>
                  <span className="text-emerald-500 font-bold">{purchaseCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={purchaseCount}
                  onChange={(e) => setPurchaseCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Vector Gauge / Result Card */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl relative">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Confidence Score
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Real-time Inferred
            </span>
          </div>

          <div className="text-center py-4">
            <div className="text-6xl font-extrabold tracking-tight text-white mb-1">
              {matchPercent}%
            </div>
            <div className="text-xs text-indigo-300 font-medium">
              Recommendation Match Probability
            </div>
          </div>

          {/* Breakdown Progress Bars */}
          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Content Vector Cosine (40%)</span>
                <span className="font-bold text-white">{Math.round(contentSimBase * 100)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${contentSimBase * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Implicit Collaborative Weight (60%)</span>
                <span className="font-bold text-white">{Math.round(collabNormalized * 100)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-stripe-blue rounded-full transition-all duration-300"
                  style={{ width: `${collabNormalized * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Formula: $S = 0.4 \cdot \text{Sim}(i, s) + 0.6 \cdot \sum w_a \mathcal{A}(u, i)$</span>
          </div>
        </div>
      </div>
    </div>
  );
};
