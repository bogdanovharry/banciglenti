"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  id: string; // unique key: sku + custom specs hash
  sku: string;
  name: string;
  dim: string;
  price: number; // EUR per unit
  quantity: number;
  image?: string;
  customSpecs?: {
    type?: string;
    length?: number;
    width?: string;
    thickness?: string;
    pitch?: string;
    brand?: string;
    material?: string;
    welding?: boolean;
    setting?: boolean;
    sharpening?: boolean;
    heatTreatment?: boolean;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

const BGN_RATE = 1.95583;
const FREE_SHIPPING_THRESHOLD = 200; // EUR
const SHIPPING_COST = 6; // EUR
const TAX_RATE = 0.2;

function generateId(item: Omit<CartItem, "id">): string {
  const specsKey = item.customSpecs
    ? JSON.stringify(item.customSpecs)
    : "";
  return `${item.sku}-${specsKey}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tl-cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("tl-cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = generateId(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, shipping, tax, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// Helper: format price in dual currency
export function formatDualPrice(eur: number) {
  return {
    eur: eur.toFixed(2),
    bgn: (eur * BGN_RATE).toFixed(2),
    eurVat: (eur * 1.2).toFixed(2),
    bgnVat: (eur * 1.2 * BGN_RATE).toFixed(2),
  };
}
