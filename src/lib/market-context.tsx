"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  DEFAULT_MARKET,
  MARKETS,
  currencySymbol,
  formatAmount,
  formatPrice,
  vatRateFor,
  withVat,
  type Market,
  type MarketCode,
} from "./market";

/**
 * The market a request belongs to, for client components.
 *
 * Resolved once on the server from the domain (src/i18n/locale.ts) and handed
 * down by code, because a client component cannot read the Host header — and
 * every price it renders has to use the VAT rate the order route will charge.
 * Reading DEFAULT_MARKET directly, as the cart used to, quoted Bulgarian VAT on
 * every domain.
 */
const MarketContext = createContext<Market>(DEFAULT_MARKET);

export function MarketProvider({ code, cardPayments = false, children }: { code: MarketCode; cardPayments?: boolean; children: ReactNode }) {
  // Card payment is a property of the deployment (a provider is connected), not of the
  // market registry: the server says whether it is on and it is added here, first.
  const market = useMemo<Market>(
    () => (cardPayments ? { ...MARKETS[code], paymentMethods: ["card", ...MARKETS[code].paymentMethods] } : MARKETS[code]),
    [code, cardPayments],
  );
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export const useMarket = (): Market => useContext(MarketContext);

/** Formatting and VAT for the current market, so no component picks its own. */
export function usePrices() {
  const market = useMarket();
  const vatRate = vatRateFor(market);

  return {
    market,
    vatRate,
    /** Net EUR → gross EUR at the consumer rate. Still EUR — format it to display. */
    gross: (net: number) => withVat(net, vatRate),
    /** "22,09 €" — number and symbol. */
    price: (eur: number) => formatPrice(eur, market),
    /** "22,09" — for layouts that set the symbol separately. */
    amount: (eur: number) => formatAmount(eur, market),
    symbol: currencySymbol(market),
  };
}
