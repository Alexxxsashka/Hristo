import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDiscountedPrice } from '../utils/price';
import { Product, ProductVariant } from '../types';
import { useToastStore } from './toastStore';

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
  category?: string;
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
  updateQuantity: (id: string, delta: number) => void;
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartItems: [],
      addToCart: (item) =>
        set((state) => {
          // Check if identical item already exists in cart
          const existingItemIndex = state.cartItems.findIndex(i => 
            i.productId === item.productId && 
            JSON.stringify(i.selectedVariant) === JSON.stringify(item.selectedVariant) &&
            JSON.stringify(i.selectedParts) === JSON.stringify(item.selectedParts)
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.cartItems];
            newItems[existingItemIndex].quantity += item.quantity;
            newItems[existingItemIndex].totalPrice = newItems[existingItemIndex].price * newItems[existingItemIndex].quantity;
            return { cartItems: newItems };
          }

          return {
            cartItems: [
              ...state.cartItems,
              { ...item, id: `${Date.now()}-${item.productId}` },
            ],
          };
        }),
      addItem: (product, variant, quantity = 1) =>
        set((state) => {
          const basePrice = variant?.price ?? product.price;
          const discountedPrice = getDiscountedPrice(basePrice, product.discount);
          
          // Check for existing
          const existingItemIndex = state.cartItems.findIndex(i => 
            i.productId === product.id && 
            i.selectedVariant?.id === variant?.id &&
            i.selectedParts.length === 0 // Basic add item has no parts
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.cartItems];
            newItems[existingItemIndex].quantity += quantity;
            newItems[existingItemIndex].totalPrice = newItems[existingItemIndex].price * newItems[existingItemIndex].quantity;
            useToastStore.getState().addToast(`Updated ${product.name} quantity`, 'success');
            return { cartItems: newItems };
          }

          const result = {
            cartItems: [
              ...state.cartItems,
              {
                id: `${Date.now()}-${product.id}`,
                productId: product.id,
                productName: product.name,
                price: discountedPrice,
                originalPrice: basePrice,
                discount: product.discount,
                quantity: quantity,
                image: product.image,
                sku: variant?.sku || product.sku,
                category: product.category,
                landingCost: product.landingCost,
                selectedVariant: variant ? {
                  id: variant.id,
                  name: variant.name,
                  attributes: variant.attributes,
                  price: variant.price
                } : undefined,
                selectedParts: [],
                totalPrice: discountedPrice * quantity,
              },
            ],
          };

          useToastStore.getState().addToast(`${product.name} added to cart`, 'success');
          return result;
        }),
      updateQuantity: (id, delta) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) => {
            if (item.id === id) {
              const newQuantity = Math.max(1, item.quantity + delta);
              return {
                ...item,
                quantity: newQuantity,
                totalPrice: item.price * newQuantity,
              };
            }
            return item;
          }),
        })),
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
