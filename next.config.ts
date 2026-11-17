import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

import { legacyRedirects } from "./src/lib/legacy-redirects";

// Locale comes from the domain, not a path segment — see src/i18n/locale.ts.
// That is why the /bg/... redirects below are safe: they are old PHP URLs, not
// a locale prefix, and nothing routes on /bg.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Headers every response carries.
 *
 * HSTS tells browsers to use https for the domain from then on (browsers ignore
 * it over plain http, so localhost is unaffected). nosniff and the referrer
 * policy are the cheap defaults. The admin and the order book are the screens
 * with buttons worth clickjacking — a page framed invisibly under a cursor that
 * clicks "cancel order" — so they may not be framed at all; the storefront may
 * be framed only by itself.
 *
 * No Content-Security-Policy yet, deliberately: Next and Payload both inline
 * scripts, so a policy strict enough to matter needs nonces threaded through
 * both and testing against the real admin. It is the next hardening step, not
 * something to switch on blind.
 */
const baseHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // No need to tell every visitor which framework answered.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: [...baseHeaders, { key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      {
        source: "/(admin|manage)/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  async redirects() {
    // 301s from the old banciglenti.com addresses to their new places — see legacy-redirects.ts.
    return legacyRedirects();
  },
};

export default withNextIntl(withPayload(nextConfig));
