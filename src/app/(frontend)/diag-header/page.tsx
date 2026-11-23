import type { Metadata } from "next";

import { DiagClient } from "./DiagClient";

export const metadata: Metadata = { title: "Diag", robots: { index: false, follow: false } };

/** A measuring page for the phone-header strip. Not linked from anywhere, not indexed. Remove once the cause is known. */
export default function DiagHeaderPage() {
  return <DiagClient />;
}
