import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import config from "@payload-config";

import { getAccount } from "@/lib/account";
import { customSku, parseCustomSpecs } from "@/lib/order-pricing";
import { pitchFromName } from "@/lib/product-pitch";
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
  items?:
    | {
        name?: string | null
        quantity?: number | null
        price?: number | null
        product?: number | { id: number } | null
        customSpecs?: unknown
      }[]
    | null
}

type ProductLite = { id: number; slug?: string | null; name?: string | null; basePrice?: number | null; status?: string | null; stock?: number | null; madeToOrder?: boolean | null }

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
    const docs = found.docs as unknown as StoredOrder[];

    // Catalogue lines are looked up again, so "repeat" offers today's name and
    // price, and leaves out what is no longer sold. Made-to-order lines carry
    // their own specs; the price is worked out again from the tables.
    const ids = new Set<number>();
    for (const o of docs) for (const i of o.items ?? []) {
      const id = typeof i.product === "object" && i.product ? i.product.id : i.product;
      if (typeof id === "number") ids.add(id);
    }
    const products = new Map<number, ProductLite>();
    if (ids.size > 0) {
      const res = await payload.find({
        collection: "products",
        where: { id: { in: [...ids] } },
        limit: ids.size,
        depth: 0,
        pagination: false,
        overrideAccess: true,
      });
      for (const p of res.docs as unknown as ProductLite[]) products.set(p.id, p);
    }

    orders = docs.map((o) => {
      const lines: OrderRow["lines"] = [];
      let skipped = 0;
      for (const i of o.items ?? []) {
        const quantity = Math.max(1, Math.min(999, i.quantity ?? 1));
        const specs = parseCustomSpecs(i.customSpecs);
        if (specs) {
          lines.push({
            sku: customSku(specs),
            name: i.name ?? "",
            dim: `${specs.length} × ${specs.width} × ${specs.thickness}`,
            price: i.price ?? 0,
            quantity,
            customSpecs: specs,
          });
          continue;
        }
        const id = typeof i.product === "object" && i.product ? i.product.id : i.product;
        const product = typeof id === "number" ? products.get(id) : undefined;
        const sellable =
          product?.slug && product.status !== "inactive" && (product.madeToOrder || (product.status !== "out_of_stock" && (product.stock ?? 0) > 0));
        if (!product || !sellable) {
          skipped += 1;
          continue;
        }
        const pitch = pitchFromName(i.name ?? "");
        lines.push({
          sku: product.slug as string,
          name: product.name ?? i.name ?? "",
          dim: "",
          // A pitch can change the price; checkout works out the real one.
          price: pitch ? (i.price ?? product.basePrice ?? 0) : (product.basePrice ?? i.price ?? 0),
          quantity,
          ...(pitch ? { pitch } : {}),
        });
      }
      return {
        orderNumber: o.orderNumber,
        status: o.status ?? "pending",
        total: o.total ?? 0,
        createdAt: o.createdAt,
        items: (o.items ?? []).map((i) => ({ name: i.name ?? "", quantity: i.quantity ?? 1 })),
        lines,
        skipped,
      };
    });
  }

  return <AccountClient account={account} orders={orders} />;
}
