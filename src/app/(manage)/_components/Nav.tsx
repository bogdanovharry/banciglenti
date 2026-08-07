'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LOGOUT_PATH, NAV_ITEMS, PAYLOAD_ADMIN, type NavItem } from '@/lib/manage/routes'

/**
 * The one piece of chrome. A fixed left rail rather than a top bar, because the
 * screens beneath it are wide tables and vertical space is the scarce thing.
 *
 * A Client Component only so the active row can be read from the pathname; it
 * receives no data beyond the two strings below. Items for screens that do not
 * exist yet are rendered inert and marked, not hidden — the shape of the
 * finished panel is worth showing from day one, and a greyed row that says
 * "скоро" is honest where a link to a 404 is not.
 */

function Row({ item, active }: { item: NavItem; active: boolean }) {
  const inner = (
    <>
      <span
        className={`font-mono text-[10px] tracking-[0.12em] ${active ? 'text-orange' : 'text-ink-30'}`}
      >
        {item.n}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.soon && (
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-ink-30">скоро</span>
      )}
    </>
  )

  if (item.soon) {
    return (
      <span
        aria-disabled="true"
        className="flex items-center gap-3 px-4 py-2.5 text-[13.5px] text-ink-30 cursor-default select-none"
      >
        {inner}
      </span>
    )
  }

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
      {inner}
    </Link>
  )
}

export function Nav({ user }: { user: { name: string | null; email: string } }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Управление"
      className="w-[210px] shrink-0 border-r border-ink-15 bg-paper flex flex-col"
    >
      <div className="px-4 py-4 border-b border-ink-15">
        <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
          ТЕХНОЛЕС
        </div>
        <div className="text-[15px] font-semibold tracking-tight text-ink mt-0.5">Управление</div>
      </div>

      <div className="py-2 flex-1">
        {NAV_ITEMS.map((item) => (
          <Row key={item.href} item={item} active={pathname.startsWith(item.href)} />
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
    </nav>
  )
}
