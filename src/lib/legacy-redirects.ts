/**
 * Old banciglenti.com URLs (the shop this platform replaces) and where each one
 * goes. Taken from that shop's own sitemap, 157 addresses: the category pages,
 * the product pages, the brand pages, the configurators and the information pages.
 *
 * A category goes to its new category. A product page goes to its new category
 * too — the old product addresses (…/350x3-6x30-z40-wz) are not the new ones, and
 * a visitor who lands on the right shelf is better served than one who lands on a
 * 404. Anything with no counterpart (brands, news, services) goes to the nearest
 * useful page.
 */
type Redirect = { source: string; destination: string; permanent: true }

/** Old category slug -> new path. */
const CATEGORIES: Record<string, string> = {
  'horizontalni-bantsizi': '/category/horizontalni-bantsizi',
  'vertikalni-bantsizi': '/category/vertikalni-bantsizi',
  'bantsigovi-lenti-za-dyrvo': '/category/dyrvo',
  'bantsigovi-lenti-za-metal': '/category/metal',
  'bantsigovi-lenti-za-meso': '/category/meso-i-riba',
  'bantsigovi-lenti-za-tekstil': '/category/slicers',
  'bantsigovi-lenti-za-hartiya': '/category/slicers',
  'bantsigovi-lenti-za-pyana-dunapren': '/category/slicers',
  'bantsigovi-lenti-za-dr-materii': '/category/slicers',
  'hobi-bantsig-1': '/category/hobi-bantsig',
  'tsirkulyarni-trioni': '/category/tsirkulyarni-trioni',
  'tsirkulyarni-trioni-obiknoveni': '/category/tsirkulyarni-trioni',
  'tsirkulyarni-trioni-sus-smenyaemi-tvurdosplavni-plastini': '/category/tsirkulyarni-trioni',
  'tsirkulyarni-trioni-s-diamant-pkd': '/category/tsirkulyarni-trioni',
  'nozhove-za-abriht': '/category/nozhove-za-abriht',
  'nozhove-za-abriht-1': '/category/nozhove-za-abriht',
  abrazivi: '/category/abrazivi',
  shkurtki: '/category/abrazivi',
  konsumativi: '/category/konsumativi',
  mashini: '/category/mashini',
}

/** Brand and other listing pages: the catalogue is the nearest thing. */
const TO_SHOP = ['promo', 'products', 'brands.html', 'mastergold', 'masterblade', 'hermes', 'tyrolit', 'sandvik', 'flamme', 'tehnoles-1', 'bohler', 'kodiak']

const PAGES: Record<string, string> = {
  'main/contact-us': '/contact',
  'main/about-us': '/about',
  'main/abou-us': '/about',
  'main/terms-of-use': '/terms',
  'main/delivery-terms': '/delivery',
  'main/privacy-policy': '/privacy',
  'main/products-payout': '/delivery',
  'main/technical-info': '/blog?category=technical',
  'main/certificates': '/about',
  'main/promo': '/shop',
  'main/custom-price': '/configurator',
  'main/konfigurator-shkurtki': '/category/abrazivi',
  'main/configurator-bantsig-lenti-za-metal': '/configurator?type=metal-bi',
  'main/configurator-bantsig-lenti-za-dyrvo-vertikalen-bantsig': '/configurator?type=wood-v',
  'main/configurator-bantsig-lenti-za-dyrvo-horizontalen-bantsig': '/configurator?type=wood-h',
  'main/configurator-bantsig-lenti-za-meso': '/configurator?type=meat',
  'main/configurator-bantsig-lenti-za-pyana-dunapren': '/configurator?type=slicer',
  'main/konfigurator-bantsig-lenti-za-tekstil-i-hartiya': '/configurator?type=slicer',
  'tehnicheska-informatsiya': '/blog?category=technical',
  login: '/account',
  news: '/blog',
}

export function legacyRedirects(): Redirect[] {
  const out: Redirect[] = []
  const add = (source: string, destination: string) => out.push({ source, destination, permanent: true })

  for (const [from, to] of Object.entries(PAGES)) add(`/bg/${from}`, to)
  for (const slug of TO_SHOP) add(`/bg/${slug}`, '/shop')
  for (const [from, to] of Object.entries(CATEGORIES)) {
    add(`/bg/${from}`, to)
    // …/<category>/<product>: the product pages of that shelf.
    add(`/bg/${from}/:product`, to)
  }
  add('/bg/news/:slug', '/blog')
  add('/bg/services', '/configurator')
  add('/bg/services/:slug*', '/configurator')
  add('/bg', '/')
  return out
}
