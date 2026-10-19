"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from "react";

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
  /** False until the stored cart has been read — render a skeleton, not "empty". */
  loaded: boolean;
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

/**
 * The cart lives in localStorage, read through useSyncExternalStore rather than
 * an effect: the server renders no snapshot (null), the browser renders the
 * stored one with no extra pass, and `loaded` tells a page which of the two it
 * is looking at — so /cart and /checkout show a skeleton, not "cart is empty",
 * until the real contents are known.
 */
const STORAGE_KEY = "tl-cart";
const NO_ITEMS: CartItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = NO_ITEMS;

function parseItems(raw: string | null): CartItem[] {
  if (!raw) return NO_ITEMS;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : NO_ITEMS;
  } catch {
    return NO_ITEMS;
  }
}

function getSnapshot(): CartItem[] {
  let raw: string | null = cachedRaw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: fall back to what this tab already holds in memory.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parseItems(raw);
  }
  return cachedItems;
}

const getServerSnapshot = (): CartItem[] | null => null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function writeItems(next: CartItem[]) {
  const raw = JSON.stringify(next);
  cachedRaw = raw;
  cachedItems = next;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {}
  listeners.forEach((l) => l());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore<CartItem[] | null>(subscribe, getSnapshot, getServerSnapshot);
  const loaded = snapshot !== null;
  const items = snapshot ?? NO_ITEMS;

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = generateId(item);
    const prev = getSnapshot();
    const existing = prev.find((i) => i.id === id);
    writeItems(
      existing
        ? prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...prev, { ...item, id }],
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    writeItems(getSnapshot().filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const prev = getSnapshot();
    writeItems(
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    writeItems([]);
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
      value={{ items, loaded, addItem, removeItem, updateQuantity, clearCart, itemCount, vatRate, subtotal, shipping, tax, total, totalsFor }}
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

