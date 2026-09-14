"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

import type { CustomSpecs } from "./order-pricing";
import { computeOrderTotals, type OrderTotals } from "./order-totals";
import { carriageTerms, vatRateFor } from "./market";
import { useMarket } from "./market-context";

type ShippingMethod = "courier" | "pickup";

export interface CartItem {
  id: string; // unique key: sku + custom specs hash
  sku: string;
  name: string;
  dim: string;
  price: number; // EUR per unit
  quantity: number;
  image?: string;
  /**
   * Present only on made-to-order lines. Must be complete enough for the server
   * to re-derive the price from the same table — see priceCustomItem. A custom
   * line without these is rejected at checkout rather than trusted.
   */
  customSpecs?: CustomSpecs;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  /** The rate the totals below were taken at — the current market's. */
  vatRate: number;
  /** Totals assuming courier delivery, for the cart page. */
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  /** Totals for a chosen delivery method, for checkout. */
  totalsFor: (shippingMethod: ShippingMethod) => OrderTotals;
}

const CartContext = createContext<CartContextType | null>(null);

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

  // The same function the order route charges through, fed the same market
  // terms, so the preview is the bill. It used to add courier carriage even
  // when pickup was chosen, and always at Bulgarian VAT.
  const market = useMarket();
  const vatRate = vatRateFor(market);
  const totalsFor = useCallback(
    (shippingMethod: ShippingMethod) =>
      computeOrderTotals({
        lines: items,
        shippingMethod,
        vatRate,
        ...carriageTerms(market),
      }),
    [items, vatRate, market],
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const { subtotal, shippingCost: shipping, tax, total } = totalsFor("courier");

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, vatRate, subtotal, shipping, tax, total, totalsFor }}
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

