import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';

export const CartIcon: React.FC = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const { t } = useTranslation();
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Link 
      to="/cart" 
      className="flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/50 rounded-lg transition-all text-zinc-400 hover:text-white group"
    >
      <div className="relative">
        <ShoppingCart size={18} className="group-hover:text-red-500 transition-colors" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-in zoom-in">
            {itemCount}
          </span>
        )}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline-block w-[70px] text-center">
        {t('cart')}
      </span>
    </Link>
  );
};
