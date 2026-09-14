import type { Metadata } from 'next'
import localFont from 'next/font/local'

import '../globals.css'
import { Nav } from './_components/Nav'
import { currentUser } from '@/lib/manage/session'

/**
 * Root layout for /manage — a second root, alongside the storefront's.
 *
 * src/app/layout.tsx is a pass-through, so each route group renders its own
 * <html> and <body>. That is what lets this group import globals.css and get
 * Tailwind and the brand tokens, while Payload's admin next door keeps its own
 * stylesheet untouched.
 *
 * The layout does not send a logged-out visitor to the login screen; the page
 * does. A layout cannot know which page it is wrapping, so its redirect always
 * returned people to the order list — a link to one order, opened after the
 * session expired, landed on the list after logging in. Every page calls
 * `requireUser()` with its own path next to its data (see
 * src/lib/manage/session.ts for why a layout cannot be the security boundary
 * anyway), so without a user this renders the bare frame for the instant before
 * that redirect lands.
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
  const user = await currentUser()

  return (
    <html lang="bg" className={inter.variable}>
      <body className="font-sans antialiased text-ink bg-white">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {user && <Nav user={{ name: user.name, email: user.email }} />}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  )
}
