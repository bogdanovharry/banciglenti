/**
 * Root layout for every route, storefront and admin alike.
 *
 * It must NOT import globals.css. That file begins with `@import "tailwindcss"`,
 * and Tailwind's preflight reset strips margins, list styles, borders and font
 * sizes from every element — which flattened the whole Payload admin UI into
 * unstyled text.
 *
 * The storefront pulls in globals.css from (frontend)/layout.tsx, so Tailwind
 * applies there and nowhere else. The admin gets Payload's own stylesheet
 * through RootLayout in (payload)/layout.tsx.
 *
 * This stays a pass-through: each route group renders its own <html> and <body>.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
