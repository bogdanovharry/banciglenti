import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";

import { getAccount } from "@/lib/account";
import { AccountClient, type OrderRow } from "./AccountClient";

/**
 * The shopper's profile: a login form for a visitor, the profile and the order
 * history for someone logged in. Read per request — it depends on a cookie — and
 * kept out of search results: there is nothing here to find.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false, follow: false } };
}

type StoredOrder = {
  orderNumber: string
  status?: string | null
  total?: number | null
  createdAt: string
  items?: { name?: string | null; quantity?: number | null }[] | null
}

export default async function AccountPage() {
  const account = await getAccount();
  let orders: OrderRow[] = [];

  if (account) {
    const payload = await getPayload({ config });
    // By the account on the order, never by e-mail: see Accounts.ts.
    const found = await payload.find({
      collection: "orders",
      where: { account: { equals: account.id } },
      sort: "-createdAt",
      limit: 50,
      depth: 0,
      overrideAccess: true,
    });
    orders = (found.docs as unknown as StoredOrder[]).map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status ?? "pending",
      total: o.total ?? 0,
      createdAt: o.createdAt,
      items: (o.items ?? []).map((i) => ({ name: i.name ?? "", quantity: i.quantity ?? 1 })),
    }));
  }

  return <AccountClient account={account} orders={orders} />;
}
