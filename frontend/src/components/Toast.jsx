import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Toast = () => {
  const { notification, showNotification } = useCart();

  if (!notification) return null;

  const isError = notification.type === 'error';
  const isInfo = notification.type === 'info';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-neutral-900 text-white shadow-xl border border-neutral-800 text-xs font-medium">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : isInfo ? (
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="leading-snug">{notification.message}</span>
        <button
          onClick={() => showNotification(null)}
          className="text-neutral-400 hover:text-white transition ml-2 p-0.5"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
