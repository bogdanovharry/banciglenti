import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

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
    // 301 redirects from old banciglenti.com URLs to new ones
    return [
      { source: "/bg/horizontalni-bantsizi", destination: "/category/horizontalni-bantsizi", permanent: true },
      { source: "/bg/horizontalni-bantsizi/:slug", destination: "/product/:slug", permanent: true },
      { source: "/bg/tsirkulyarni-trioni", destination: "/category/tsirkulyarni-trioni", permanent: true },
      { source: "/bg/bimetalni-lenti", destination: "/category/bimetalni-lenti", permanent: true },
      { source: "/bg/hobi-bantsig-1", destination: "/category/hobi-bantsig", permanent: true },
      { source: "/bg/hobi-bantsig-1/:slug", destination: "/product/:slug", permanent: true },
      { source: "/bg/mashini", destination: "/category/mashini", permanent: true },
      { source: "/bg/news", destination: "/blog", permanent: true },
      { source: "/bg/news/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/bg/tehnicheska-informatsiya", destination: "/blog", permanent: true },
      { source: "/bg/main/contact-us", destination: "/contact", permanent: true },
      { source: "/bg/login", destination: "/", permanent: true },
      { source: "/bg/main/about-us", destination: "/about", permanent: true },
      { source: "/bg/main/terms-of-use", destination: "/terms", permanent: true },
      { source: "/bg/main/delivery-terms", destination: "/delivery", permanent: true },
      { source: "/bg/main/privacy-policy", destination: "/privacy", permanent: true },
    ];
  },
};

export default withNextIntl(withPayload(nextConfig));
