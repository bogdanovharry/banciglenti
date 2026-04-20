"use client";

import Link from "next/link";
import { useState } from "react";

const categories = [
  { name: "Дърво", href: "/category/dyrvo", children: [
    { name: "Хоризонтални банцизи", href: "/category/horizontalni-bantsizi" },
    { name: "Вертикални банцизи", href: "/category/vertikalni-bantsizi" },
    { name: "Циркулярни триони", href: "/category/tsirkulyarni-trioni" },
    { name: "Ножове за абрихт", href: "/category/nozhove-za-abriht" },
    { name: "Абразиви, диаманти, CBN", href: "/category/abrazivi" },
  ]},
  { name: "Метал", href: "/category/metal", children: [
    { name: "Биметални ленти", href: "/category/bimetalni-lenti" },
    { name: "Въглеродна стомана CS", href: "/category/vyglerodna-lenti-cs" },
  ]},
  { name: "Хоби банциг", href: "/category/hobi-bantsig" },
  { name: "Храни", href: "/category/hrani", children: [
    { name: "Месо и риба", href: "/category/meso-i-riba" },
    { name: "Хлебни изделия", href: "/category/hlebni-izdeliya" },
    { name: "Слайсъри", href: "/category/slicers" },
  ]},
  { name: "Машини", href: "/category/mashini", children: [
    { name: "Резервни части", href: "/category/rezervni-chasti" },
    { name: "Консумативи", href: "/category/konsumativi" },
  ]},
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="relative z-50">
      {/* Top Bar */}
      <div className="bg-primary text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex gap-4">
            <a href="tel:066800822" className="hover:underline">📞 066 800 822</a>
            <a href="tel:0878800162" className="hover:underline hidden sm:inline">📱 0878 800 162</a>
          </div>
          <a href="mailto:tehnoles@tehnoles.com" className="hover:underline">
            ✉️ tehnoles@tehnoles.com
          </a>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-neutral-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-primary">ТЕХНОЛЕС</span>
            <span className="block text-xs text-neutral-500">Band Saw Blade Expert</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Търсете продукти по име, марка, размер..."
                className="w-full border-2 border-neutral-300 rounded-full py-2.5 px-5 pr-12 text-sm focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20"
              />
              <button
                className="absolute right-1 top-1 bg-secondary text-white rounded-full p-2 hover:bg-secondary-light transition-colors"
                aria-label="Търси"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative text-neutral-700 hover:text-primary-light">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Затвори менюто" : "Отвори менюто"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block bg-primary" aria-label="Основна навигация">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex">
            <li>
              <Link href="/" className="block px-4 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                Начало
              </Link>
            </li>
            {categories.map((cat) => (
              <li
                key={cat.name}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(cat.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={cat.href}
                  className="flex items-center gap-1 px-4 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  {cat.name}
                  {cat.children && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
                {cat.children && openDropdown === cat.name && (
                  <ul className="absolute top-full left-0 bg-white shadow-lg border border-neutral-300 rounded-b-md min-w-[220px] z-50">
                    {cat.children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-primary transition-colors"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li>
              <Link href="/shop" className="block px-4 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                Магазин
              </Link>
            </li>
            <li>
              <Link href="/blog" className="block px-4 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                Блог
              </Link>
            </li>
            <li>
              <Link href="/contact" className="block px-4 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                Контакти
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Navigation - Mobile */}
      {mobileOpen && (
        <nav className="md:hidden bg-white border-b shadow-lg" aria-label="Мобилна навигация">
          {/* Mobile search */}
          <div className="p-4 border-b border-neutral-100">
            <input
              type="search"
              placeholder="Търсете продукти..."
              className="w-full border-2 border-neutral-300 rounded-lg py-2 px-4 text-sm focus:border-primary-light focus:outline-none"
            />
          </div>
          <ul className="py-2">
            <li>
              <Link href="/" className="block px-4 py-3 text-neutral-900 font-medium" onClick={() => setMobileOpen(false)}>
                Начало
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link href={cat.href} className="block px-4 py-3 text-neutral-900 font-medium" onClick={() => setMobileOpen(false)}>
                  {cat.name}
                </Link>
                {cat.children && (
                  <ul className="bg-neutral-50">
                    {cat.children.map((child) => (
                      <li key={child.name}>
                        <Link href={child.href} className="block px-8 py-2 text-sm text-neutral-700" onClick={() => setMobileOpen(false)}>
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li>
              <Link href="/shop" className="block px-4 py-3 text-neutral-900 font-medium" onClick={() => setMobileOpen(false)}>
                Магазин
              </Link>
            </li>
            <li>
              <Link href="/blog" className="block px-4 py-3 text-neutral-900 font-medium" onClick={() => setMobileOpen(false)}>
                Блог
              </Link>
            </li>
            <li>
              <Link href="/contact" className="block px-4 py-3 text-neutral-900 font-medium" onClick={() => setMobileOpen(false)}>
                Контакти
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
