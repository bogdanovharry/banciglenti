import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">ТЕХНОЛЕС ООД</h3>
            <p className="text-white/80 text-sm mb-4">
              гр. Габрово, ул. Негенска 2<br />
              България
            </p>
            <div className="space-y-2 text-sm">
              <a href="tel:066800822" className="block text-white/80 hover:text-white">
                📞 066 800 822
              </a>
              <a href="tel:066800823" className="block text-white/80 hover:text-white">
                📞 066 800 823
              </a>
              <a href="tel:0878800162" className="block text-white/80 hover:text-white">
                📱 0878 800 162
              </a>
              <a href="mailto:tehnoles@tehnoles.com" className="block text-white/80 hover:text-white">
                ✉️ tehnoles@tehnoles.com
              </a>
            </div>
            {/* Social */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.facebook.com/tehnoles"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://www.youtube.com/@Tehnolesltd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Продукти</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/horizontalni-bantsizi" className="text-white/70 hover:text-white">Хоризонтални банцизи</Link></li>
              <li><Link href="/category/vertikalni-bantsizi" className="text-white/70 hover:text-white">Вертикални банцизи</Link></li>
              <li><Link href="/category/tsirkulyarni-trioni" className="text-white/70 hover:text-white">Циркулярни триони</Link></li>
              <li><Link href="/category/bimetalni-lenti" className="text-white/70 hover:text-white">Биметални ленти</Link></li>
              <li><Link href="/category/hobi-bantsig" className="text-white/70 hover:text-white">Хоби банцизи</Link></li>
              <li><Link href="/category/mashini" className="text-white/70 hover:text-white">Машини</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="text-white/70 hover:text-white">Блог</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white">Контакти</Link></li>
              <li><Link href="/about" className="text-white/70 hover:text-white">За нас</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Правна информация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-white/70 hover:text-white">Условия за ползване</Link></li>
              <li><Link href="/delivery" className="text-white/70 hover:text-white">Доставка и плащане</Link></li>
              <li><Link href="/privacy" className="text-white/70 hover:text-white">Политика за поверителност</Link></li>
            </ul>

            <h4 className="font-semibold mt-6 mb-3">Начини на плащане</h4>
            <div className="flex gap-2 text-sm text-white/60">
              <span className="border border-white/20 rounded px-2 py-1">Visa</span>
              <span className="border border-white/20 rounded px-2 py-1">MC</span>
              <span className="border border-white/20 rounded px-2 py-1">COD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-white/50">
          © 2024–{new Date().getFullYear()} ТЕХНОЛЕС ООД. Всички права запазени. | www.banciglenti.com
        </div>
      </div>
    </footer>
  );
}
