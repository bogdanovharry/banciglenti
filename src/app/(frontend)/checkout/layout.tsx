import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";

// The page below is a Client Component and cannot export metadata, so its title
// and indexing live here — see src/lib/page-metadata.ts.
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("checkout", "/checkout", { index: false });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
