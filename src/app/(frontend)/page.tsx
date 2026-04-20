import Link from "next/link";

const trustBadges = [
  { icon: "🏭", title: "Най-голям избор", desc: "Най-голямото разнообразие в България" },
  { icon: "🎯", title: "Персонални решения", desc: "Индивидуален проект и консултация" },
  { icon: "🛡️", title: "Гаранция за качество", desc: "TÜV NORD сертифицирани" },
  { icon: "🚚", title: "Бърза доставка", desc: "Сигурни плащания" },
];

const categories = [
  { name: "Дърво", icon: "🪵", href: "/category/dyrvo", desc: "Банцигови ленти, циркулярни триони, абрихт ножове" },
  { name: "Метал", icon: "⚙️", href: "/category/metal", desc: "Биметални и въглеродни отрезни ленти" },
  { name: "Хоби банциг", icon: "🔧", href: "/category/hobi-bantsig", desc: "Ленти за Einhell, Parkside, Scheppach" },
  { name: "Храни", icon: "🥩", href: "/category/hrani", desc: "Ленти за месо, риба, хляб, слайсъри" },
  { name: "Машини", icon: "🏗️", href: "/category/mashini", desc: "Заточни машини, резервни части" },
  { name: "Абразиви", icon: "💎", href: "/category/abrazivi", desc: "Диаманти, CBN, заточни дискове" },
];

const brands = ["MasterGold", "Sandvik", "Hermes", "Tyrolit", "Böhler", "Kodiak", "Flamme", "Tehnoles"];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            Банцигови ленти и режещи
            <br />
            инструменти с гарантирано качество
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Най-голямото разнообразие от лентови триони, циркулярни триони и абразиви в България.
            Индивидуални решения за дърво, метал и хранителна промишленост.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-secondary hover:bg-secondary-light text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
            >
              Разгледайте продуктите
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
            >
              Свържете се с нас
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-neutral-100 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="text-center">
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-semibold text-neutral-900 mb-1">{badge.title}</h3>
                <p className="text-sm text-neutral-500">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Категории продукти</h2>
          <p className="text-neutral-500 text-center mb-12">Изберете категория за вашата индустрия</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group bg-neutral-100 rounded-lg p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-light mb-2">
                  {cat.name}
                </h3>
                <p className="text-sm text-neutral-500">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="bg-neutral-100 py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Марки</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {brands.map((brand) => (
              <span
                key={brand}
                className="text-lg font-semibold text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Имате въпроси?</h2>
          <p className="text-lg text-white/80 mb-8">
            Свържете се с нашия екип за техническа консултация и поръчки по индивидуални размери
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:066800822"
              className="inline-flex items-center justify-center bg-secondary hover:bg-secondary-light text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              📞 066 800 822
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              Контактна форма
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
