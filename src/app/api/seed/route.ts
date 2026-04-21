import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET() {
  try {
    const payload = await getPayload({ config });

    // Check if already seeded
    const existingProducts = await payload.find({ collection: "products", limit: 1 });
    if (existingProducts.totalDocs > 0) {
      return NextResponse.json({ message: "Already seeded", products: existingProducts.totalDocs });
    }

    // Create categories
    const catMap: Record<string, number> = {};
    const categories = [
      { name: "Дърво", slug: "dyrvo", sortOrder: 1 },
      { name: "Хоризонтални банцизи", slug: "horizontalni-bantsizi", sortOrder: 2 },
      { name: "Вертикални банцизи", slug: "vertikalni-bantsizi", sortOrder: 3 },
      { name: "Циркулярни триони", slug: "tsirkulyarni-trioni", sortOrder: 4 },
      { name: "Ножове за абрихт", slug: "nozhove-za-abriht", sortOrder: 5 },
      { name: "Абразиви", slug: "abrazivi", sortOrder: 6 },
      { name: "Метал", slug: "metal", sortOrder: 7 },
      { name: "Биметални ленти", slug: "bimetalni-lenti", sortOrder: 8 },
      { name: "Въглеродна стомана CS", slug: "vyglerodna-lenti-cs", sortOrder: 9 },
      { name: "Хоби банциг", slug: "hobi-bantsig", sortOrder: 10 },
      { name: "Храни", slug: "hrani", sortOrder: 11 },
      { name: "Месо и риба", slug: "meso-i-riba", sortOrder: 12 },
      { name: "Хлебни изделия", slug: "hlebni-izdeliya", sortOrder: 13 },
      { name: "Слайсъри", slug: "slicers", sortOrder: 14 },
      { name: "Машини", slug: "mashini", sortOrder: 15 },
    ];

    for (const cat of categories) {
      const created = await payload.create({
        collection: "categories",
        data: {
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          parent: cat.slug === "horizontalni-bantsizi" || cat.slug === "vertikalni-bantsizi" || cat.slug === "tsirkulyarni-trioni" || cat.slug === "nozhove-za-abriht"
            ? catMap["dyrvo"]
            : cat.slug === "bimetalni-lenti" || cat.slug === "vyglerodna-lenti-cs"
            ? catMap["metal"]
            : cat.slug === "meso-i-riba" || cat.slug === "hlebni-izdeliya" || cat.slug === "slicers"
            ? catMap["hrani"]
            : undefined,
        },
      });
      catMap[cat.slug] = created.id as number;
    }

    // Create brands
    const brandMap: Record<string, number> = {};
    const brands = ["MasterGold", "MasterBlade", "Kodiak", "Sandvik", "Hermes", "Tyrolit", "Flamme", "Böhler", "Tehnoles", "Bahco", "Starrett", "Bizerba"];
    for (const brand of brands) {
      const created = await payload.create({
        collection: "brands",
        data: { name: brand, slug: brand.toLowerCase().replace(/ö/g, "o") },
      });
      brandMap[brand] = created.id as number;
    }

    // Create products
    const products = [
      { name: "Биметална лента M42 HSS 3810×27×0.9", slug: "bimetalna-lenta-m42-hss", shortDescription: "Висококачествена биметална лента с HSS зъб и пружинен въглероден гръб. За рязане на въглеродна, легирана стомана до 68 HRC.", basePrice: 48.90, brand: "Tehnoles", categories: ["bimetalni-lenti", "metal"], status: "active" as const, featured: true, specs: { width: 27, thickness: 0.9, material: "M42 HSS" } },
      { name: "Въглеродна CS Hardback 2240×13×0.65", slug: "vyglerodna-cs-hardback", shortDescription: "Надеждна въглеродна лента за обща употреба.", basePrice: 18.40, brand: "Tehnoles", categories: ["vyglerodna-lenti-cs", "metal"], status: "active" as const, featured: false, specs: { width: 13, thickness: 0.65, material: "CS Hardback" } },
      { name: "Лента за слайсър Bizerba 2455×16×0.5", slug: "lenta-za-slaysyr-bizerba", shortDescription: "Специализирана лента за слайсъри Bizerba.", basePrice: 32.00, brand: "Bizerba", categories: ["slicers", "hrani"], status: "active" as const, featured: true, specs: { width: 16, thickness: 0.5, material: "Неръждаема стомана" } },
      { name: "CBN заточен диск Ø200×3×10", slug: "cbn-zatochen-disk", shortDescription: "Професионален CBN диск за заточване на банцигови ленти.", basePrice: 188.00, brand: "Tyrolit", categories: ["abrazivi"], status: "active" as const, featured: false, specs: { width: 200, thickness: 3, material: "CBN" } },
      { name: "Циркулярен трион HM Ø350×3.2 72Z", slug: "tsirkulyaren-trion-hm-350", shortDescription: "Циркулярен трион с твърдосплавни пластини. 72 зъба за прецизно рязане.", basePrice: 96.40, brand: "MasterGold", categories: ["tsirkulyarni-trioni", "dyrvo"], status: "active" as const, featured: true, specs: { width: 350, thickness: 3.2, material: "HM Carbide" } },
      { name: "Биметална лента M51 Cobalt 5280×41×1.3", slug: "bimetalna-lenta-m51-cobalt", shortDescription: "Премиум биметална лента с кобалтов зъб за тежки условия.", basePrice: 112.50, brand: "Sandvik", categories: ["bimetalni-lenti", "metal"], status: "active" as const, featured: false, specs: { width: 41, thickness: 1.3, material: "M51 Cobalt" } },
      { name: "Банцигова лента MasterGold 40×1.1", slug: "bantsigova-lenta-master-gold-40", shortDescription: "Премиум клас решение за хоризонтални/гатерни банцизи. Германска стомана.", basePrice: 24.95, brand: "MasterGold", categories: ["horizontalni-bantsizi", "dyrvo"], status: "active" as const, featured: true, specs: { width: 40, thickness: 1.1, material: "C75 Spring Steel" } },
      { name: "Банцигова лента KODIAK 35×0.9", slug: "bantsigova-lenta-kodiak-35", shortDescription: "Надеждна лента за хоризонтални банцизи и гатери.", basePrice: 20.45, brand: "Kodiak", categories: ["horizontalni-bantsizi", "dyrvo"], status: "active" as const, featured: false, specs: { width: 35, thickness: 0.9, material: "C75 Spring Steel" } },
      { name: "Лента за банциг Einhell TC-SB 200/1", slug: "lenta-bantsig-einhell-tc-sb-200", shortDescription: "Съвместима лента за хоби банциг Einhell TC-SB 200/1.", basePrice: 5.99, brand: "Tehnoles", categories: ["hobi-bantsig"], status: "active" as const, featured: false, specs: { width: 8, thickness: 0.65, material: "Carbon Steel" } },
      { name: "Заточна машина ZM150 CBN", slug: "zatochna-mashina-zm150", shortDescription: "Професионална заточна машина за банцигови ленти с CBN диск.", basePrice: 5742.00, brand: "Tehnoles", categories: ["mashini"], status: "active" as const, featured: true, specs: { width: 0, thickness: 0, material: "" } },
    ];

    for (const prod of products) {
      await payload.create({
        collection: "products",
        data: {
          name: prod.name,
          slug: prod.slug,
          shortDescription: prod.shortDescription,
          basePrice: prod.basePrice,
          brand: brandMap[prod.brand],
          categories: prod.categories.map((c) => catMap[c]).filter(Boolean),
          status: prod.status,
          featured: prod.featured,
          specs: prod.specs,
        },
      });
    }

    // Create admin user if not exists
    const existingUsers = await payload.find({ collection: "users", limit: 1 });
    if (existingUsers.totalDocs === 0) {
      await payload.create({
        collection: "users",
        data: {
          email: "admin@tehnoles.com",
          password: "Tehnoles2026!",
          name: "Admin",
          role: "admin",
        },
      });
    }

    return NextResponse.json({
      message: "Seeded successfully!",
      categories: Object.keys(catMap).length,
      brands: Object.keys(brandMap).length,
      products: products.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
