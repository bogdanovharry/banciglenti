import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
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

export default withPayload(nextConfig);
