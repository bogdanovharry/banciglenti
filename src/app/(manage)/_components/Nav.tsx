'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { LOGOUT_PATH, NAV_ITEMS, PAYLOAD_ADMIN, type NavItem } from '@/lib/manage/routes'

/**
 * The one piece of chrome.
 *
 * On a desk it is a fixed left rail rather than a top bar, because the screens
 * beneath it are wide tables and vertical space is the scarce thing. On a phone
 * that rail took 210 of 390 pixels and left an order number wrapping over three
 * lines, so below `lg` it folds into a bar with a menu button — the owner in the
 * workshop with a phone is a real user of this, not an edge case.
 *
 * A Client Component for the active row and the menu toggle; it receives no
 * data beyond the name and email below.
 */

function Row({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-2.5 text-[13.5px] border-l-2 transition-colors ${
        active
          ? 'border-orange bg-white text-ink font-semibold'
          : 'border-transparent text-ink-70 hover:bg-white hover:text-ink'
      }`}
    >
      <span
        className={`font-mono text-[10px] tracking-[0.12em] ${active ? 'text-orange' : 'text-ink-30'}`}
      >
        {item.n}
      </span>
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}

export function Nav({ user }: { user: { name: string | null; email: string } }) {
  const pathname = usePathname()

  // Remembers where the menu was opened rather than a plain boolean, so it
  // closes itself on navigation without an effect watching the pathname.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  const current = NAV_ITEMS.find(isActive)

  return (
    <nav
      aria-label="Управление"
      className="tl-no-print shrink-0 bg-paper border-b border-ink-15 lg:border-b-0 lg:border-r lg:w-[210px] lg:h-screen lg:sticky lg:top-0 lg:flex lg:flex-col"
    >
      <div className="px-4 py-3 lg:py-4 lg:border-b border-ink-15 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            ТЕХНОЛЕС
          </div>
          <div className="text-[15px] font-semibold tracking-tight text-ink mt-0.5 truncate">
            Управление
            {current && <span className="lg:hidden text-ink-50 font-normal"> · {current.label}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenAt(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="manage-nav"
          className="lg:hidden h-9 px-3 border border-ink-15 bg-white text-[13px] font-semibold cursor-pointer"
        >
          {open ? 'Затвори' : 'Меню'}
        </button>
      </div>

      <div
        id="manage-nav"
        className={`${open ? 'block' : 'hidden'} border-t border-ink-15 lg:border-t-0 lg:flex lg:flex-col lg:flex-1 lg:min-h-0`}
      >
        <div className="py-2 lg:flex-1">
          {NAV_ITEMS.map((item) => (
            <Row key={item.href} item={item} active={isActive(item)} />
          ))}
        </div>

        <div className="border-t border-ink-15 px-4 py-3">
          <Link
            href={PAYLOAD_ADMIN}
            className="block font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-blue"
          >
            Съдържание →
          </Link>

          <div className="mt-3 pt-3 border-t border-ink-08">
            <div className="text-[12.5px] text-ink truncate" title={user.email}>
              {user.name ?? user.email}
            </div>
            <Link
              href={LOGOUT_PATH}
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-danger"
            >
              Изход
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
