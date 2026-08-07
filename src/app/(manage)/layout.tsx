import type { Metadata } from 'next'
import localFont from 'next/font/local'

import '../globals.css'
import { Nav } from './_components/Nav'
import { requireUser } from '@/lib/manage/session'

/**
 * Root layout for /manage — a second root, alongside the storefront's.
 *
 * src/app/layout.tsx is a pass-through, so each route group renders its own
 * <html> and <body>. That is what lets this group import globals.css and get
 * Tailwind and the brand tokens, while Payload's admin next door keeps its own
 * stylesheet untouched.
 *
 * The guard here is for the chrome, not for the data: the nav needs a name to
 * show, and an unauthenticated visitor should meet the login screen rather than
 * an empty frame. Every read enforces it again next to the query — see
 * src/lib/manage/session.ts for why a layout cannot be the security boundary.
 */

const inter = localFont({
  src: [{ path: '../../fonts/inter-latin-cyrillic.woff2', weight: '300 800' }],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: { default: 'Управление', template: '%s · Управление' },
  // An order book has no business in a search index.
  robots: { index: false, follow: false },
}

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <html lang="bg" className={inter.variable}>
      <body className="font-sans antialiased text-ink bg-white">
        <div className="flex min-h-screen">
          <Nav user={{ name: user.name, email: user.email }} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  )
}
