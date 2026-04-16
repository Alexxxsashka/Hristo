import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDiscountedPrice } from '../utils/price';
import { Product, ProductVariant } from '../types';

export interface CartItem {
  id: string; // Unique ID for the cart item (e.g., timestamp + productId)
  productId: string;
  productName: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  image?: string;
  sku?: string;
  landingCost?: number;
  selectedVariant?: {
    id: string;
    name: string;
    attributes: Record<string, string>;
    price?: number;
  };
  selectedParts: {
    id: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
}

interface CartStore {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  addItem: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (item) =>
        set((state) => ({
          cartItems: [
            ...state.cartItems,
            { ...item, id: `${Date.now()}-${item.productId}` },
          ],
        })),
      addItem: (product, variant) =>
        set((state) => {
          const basePrice = variant?.price ?? product.price;
          const discountedPrice = getDiscountedPrice(basePrice, product.discount);
          return {
            cartItems: [
              ...state.cartItems,
              {
                id: `${Date.now()}-${product.id}`,
                productId: product.id,
                productName: product.name,
                price: discountedPrice,
                originalPrice: basePrice,
                discount: product.discount,
                quantity: 1,
                image: product.image,
                sku: variant?.sku || product.sku,
                landingCost: product.landingCost,
                selectedVariant: variant ? {
                  id: variant.id,
                  name: variant.name,
                  attributes: variant.attributes,
                  price: variant.price
                } : undefined,
                selectedParts: [],
                totalPrice: discountedPrice,
              },
            ],
          };
        }),
      removeFromCart: (id) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== id),
        })),
      clearCart: () => set({ cartItems: [] }),
    }),
    {
      name: 'shopping-cart-storage',
    }
  )
);
