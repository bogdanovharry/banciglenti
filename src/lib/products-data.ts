// Complete product catalog from banciglenti.com

export interface ProductData {
  name: string;
  slug: string;
  category: string;
  price: number; // EUR without VAT
  stock: number;
  featured: boolean;
  topProduct: boolean;
}

export const ALL_PRODUCTS: ProductData[] = [
  // === ХОРИЗОНТАЛНИ БАНЦИЗИ / ГАТЕРИ ===
  { name: "Банцигова лента MASTER GOLD 32x1.1", slug: "master-gold-32x1-1", category: "horizontalni-bantsizi", price: 22.09, stock: 20, featured: false, topProduct: false },
  { name: "Банцигова лента MASTER GOLD 35х1.1", slug: "master-gold-35x1-1", category: "horizontalni-bantsizi", price: 23.31, stock: 20, featured: false, topProduct: false },
  { name: "Банцигова лента MASTER GOLD 40х1.1", slug: "master-gold-40x1-1", category: "horizontalni-bantsizi", price: 24.95, stock: 20, featured: false, topProduct: false },
  { name: "Банцигова лента MASTER GOLD 40х1.0", slug: "master-gold-40x1-0", category: "horizontalni-bantsizi", price: 23.31, stock: 20, featured: false, topProduct: false },
  { name: "Банцигова лента MASTER GOLD 50х1.1", slug: "master-gold-50x1-1", category: "horizontalni-bantsizi", price: 27.81, stock: 20, featured: false, topProduct: false },
  { name: "Банцигова лента KODIAK 35х0.9", slug: "kodiak-35x0-9", category: "horizontalni-bantsizi", price: 20.45, stock: 20, featured: false, topProduct: true },
  { name: "Банцигова лента KODIAK 38 x 1.14", slug: "kodiak-38x1-14", category: "horizontalni-bantsizi", price: 21.47, stock: 20, featured: false, topProduct: true },
  { name: "Банцигова лента KODIAK 40x0.9", slug: "kodiak-40x0-9", category: "horizontalni-bantsizi", price: 20.66, stock: 20, featured: false, topProduct: true },
  { name: "Банцигова лента KODIAK 40x1.0", slug: "kodiak-40x1-0", category: "horizontalni-bantsizi", price: 21.07, stock: 20, featured: false, topProduct: true },
  { name: "Банцигова лента KODIAK 40x1.1", slug: "kodiak-40x1-1", category: "horizontalni-bantsizi", price: 21.47, stock: 20, featured: false, topProduct: true },
  { name: "Банцигова лента KODIAK 50x0.9", slug: "kodiak-50x0-9", category: "horizontalni-bantsizi", price: 21.47, stock: 20, featured: false, topProduct: true },

  // === ХОБИ БАНЦИГ ===
  { name: "Лента за банциг Einhell TC-SB 200/1 8х0.65 L=1400мм", slug: "einhell-tc-sb-200-8x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: true, topProduct: false },
  { name: "Лента за банциг Einhell TC-SB 200/1 10х0.65 L=1400мм", slug: "einhell-tc-sb-200-10x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг Einhell TC-SB 200/1 13х0.65 L=1400мм", slug: "einhell-tc-sb-200-13x065", category: "hobi-bantsig", price: 6.28, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг Parkside PBS 350 8х0.65 L=1400мм", slug: "parkside-pbs-350-8x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: true, topProduct: false },
  { name: "Лента за банциг Parkside PBS 350 10х0.65 L=1400мм", slug: "parkside-pbs-350-10x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: true, topProduct: false },
  { name: "Лента за банциг Parkside PBS 350 13х0.65 L=1400mm", slug: "parkside-pbs-350-13x065", category: "hobi-bantsig", price: 6.28, stock: 20, featured: true, topProduct: false },
  { name: "Лента за банциг RAIDER RD-BSW18 8х0.65 L=1400мм", slug: "raider-rd-bsw18-8x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг RAIDER RD-BSW18 10х0.65 L=1400мм", slug: "raider-rd-bsw18-10x065", category: "hobi-bantsig", price: 5.99, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг RAIDER RD-BSW18 13х0.65 L=1400мм", slug: "raider-rd-bsw18-13x065", category: "hobi-bantsig", price: 6.28, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг Metabо BAS 261 8х0.65 L=1712мм", slug: "metabo-bas-261-8x065", category: "hobi-bantsig", price: 6.92, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг Metabо BAS 261 10х0.65 L=1712мм", slug: "metabo-bas-261-10x065", category: "hobi-bantsig", price: 6.92, stock: 20, featured: false, topProduct: false },
  { name: "Лента за банциг Metabо BAS 261 13х0.65 L=1712мм", slug: "metabo-bas-261-13x065", category: "hobi-bantsig", price: 7.27, stock: 20, featured: false, topProduct: false },
  // Въглеродни ленти по дължини
  { name: "Въглеродна банцигова лента 8х0.65 L=1425мм", slug: "carbon-8x065-l1425", category: "hobi-bantsig", price: 6.07, stock: 20, featured: true, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1425мм", slug: "carbon-10x065-l1425", category: "hobi-bantsig", price: 6.07, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1425мм", slug: "carbon-13x065-l1425", category: "hobi-bantsig", price: 6.36, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1490мм", slug: "carbon-8x065-l1490", category: "hobi-bantsig", price: 6.26, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1490мм", slug: "carbon-10x065-l1490", category: "hobi-bantsig", price: 6.26, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1490мм", slug: "carbon-13x065-l1490", category: "hobi-bantsig", price: 6.56, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1500мм", slug: "carbon-8x065-l1500", category: "hobi-bantsig", price: 6.29, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1500мм", slug: "carbon-10x065-l1500", category: "hobi-bantsig", price: 6.29, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1500мм", slug: "carbon-13x065-l1500", category: "hobi-bantsig", price: 6.60, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1575мм", slug: "carbon-8x065-l1575", category: "hobi-bantsig", price: 6.51, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1575мм", slug: "carbon-10x065-l1575", category: "hobi-bantsig", price: 6.51, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1575мм", slug: "carbon-13x065-l1575", category: "hobi-bantsig", price: 6.84, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1600мм", slug: "carbon-8x065-l1600", category: "hobi-bantsig", price: 6.59, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1600мм", slug: "carbon-10x065-l1600", category: "hobi-bantsig", price: 6.59, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1600мм", slug: "carbon-13x065-l1600", category: "hobi-bantsig", price: 6.91, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1638мм", slug: "carbon-8x065-l1638", category: "hobi-bantsig", price: 6.70, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1638мм", slug: "carbon-10x065-l1638", category: "hobi-bantsig", price: 6.70, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 13х0.65 L=1638мм", slug: "carbon-13x065-l1638", category: "hobi-bantsig", price: 7.04, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 8х0.65 L=1790мм", slug: "carbon-8x065-l1790", category: "hobi-bantsig", price: 7.15, stock: 20, featured: false, topProduct: false },
  { name: "Въглеродна банцигова лента 10х0.65 L=1790мм", slug: "carbon-10x065-l1790", category: "hobi-bantsig", price: 7.15, stock: 20, featured: false, topProduct: false },

  // === БИМЕТАЛНИ ОТРЕЗНИ ЛЕНТИ ===
  { name: "Биметална отрезна лента М42 13х0.65 L=1140mm", slug: "bimetal-m42-13x065-l1140", category: "bimetalni-lenti", price: 9.38, stock: 20, featured: false, topProduct: false },
  { name: "Биметална отрезна лента М42 20x0.9 L=2000mm", slug: "bimetal-m42-20x09-l2000", category: "bimetalni-lenti", price: 17.38, stock: 20, featured: false, topProduct: false },
  { name: "Биметална отрезна лента М42 27x0.9 L=2360mm", slug: "bimetal-m42-27x09-l2360", category: "bimetalni-lenti", price: 22.93, stock: 20, featured: false, topProduct: false },
  { name: "Биметална отрезна лента М42 34x1.1 L=3660mm", slug: "bimetal-m42-34x11-l3660", category: "bimetalni-lenti", price: 43.04, stock: 20, featured: false, topProduct: false },

  // === ЦИРКУЛЯРНИ ТРИОНИ — ОБИКНОВЕНИ ===
  { name: "Циркулярен трион Ø100 х 1.1 х 20/22.2", slug: "circular-100x1-1", category: "tsirkulyarni-trioni", price: 5.88, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø115 х 1.1 x 20/22.2/30", slug: "circular-115x1-1", category: "tsirkulyarni-trioni", price: 6.24, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø125 х 1.2 x 20/22.2/30", slug: "circular-125x1-2", category: "tsirkulyarni-trioni", price: 6.65, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø150 х 1.2 x 20/22.2/30", slug: "circular-150x1-2", category: "tsirkulyarni-trioni", price: 8.33, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø160 х 1.2 x 20/22.2/30", slug: "circular-160x1-2", category: "tsirkulyarni-trioni", price: 9.15, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø170 х 1.2 x 20/22.2/30", slug: "circular-170x1-2", category: "tsirkulyarni-trioni", price: 10.02, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø180 x 2.15 x 22.2/30", slug: "circular-180x2-15", category: "tsirkulyarni-trioni", price: 10.02, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø200 х 1.6 x 30", slug: "circular-200x1-6", category: "tsirkulyarni-trioni", price: 10.94, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø230 х 1.8 x 22.2/30", slug: "circular-230x1-8", category: "tsirkulyarni-trioni", price: 11.71, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø250 x 1.8 x 30", slug: "circular-250x1-8", category: "tsirkulyarni-trioni", price: 14.42, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø300 x 2.24 x 30", slug: "circular-300x2-24", category: "tsirkulyarni-trioni", price: 20.40, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø350 x 2.24 x 30", slug: "circular-350x2-24", category: "tsirkulyarni-trioni", price: 25.41, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø400 x 2.55 x 30", slug: "circular-400x2-55", category: "tsirkulyarni-trioni", price: 30.68, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø450 x 2.55 x 30", slug: "circular-450x2-55", category: "tsirkulyarni-trioni", price: 38.09, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø500 x 2.55 x 30", slug: "circular-500x2-55", category: "tsirkulyarni-trioni", price: 48.99, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø550 x 3.0 x 30", slug: "circular-550x3-0", category: "tsirkulyarni-trioni", price: 60.84, stock: 20, featured: false, topProduct: false },
  { name: "Циркулярен трион Ø600 x 3.0 x 30", slug: "circular-600x3-0", category: "tsirkulyarni-trioni", price: 69.44, stock: 20, featured: false, topProduct: false },

  // === ЦИРКУЛЯРНИ ТРИОНИ — ТВЪРДОСПЛАВНИ ===
  { name: "200X3.2X30 Z64 WZ", slug: "hm-200x32x30-z64", category: "tsirkulyarni-trioni", price: 44.80, stock: 20, featured: false, topProduct: false },
  { name: "250X3.2X30 Z40", slug: "hm-250x32x30-z40", category: "tsirkulyarni-trioni", price: 47.16, stock: 20, featured: false, topProduct: false },
  { name: "300X3.2X30 Z36 WZ", slug: "hm-300x32x30-z36", category: "tsirkulyarni-trioni", price: 48.34, stock: 20, featured: false, topProduct: false },
  { name: "350X3.6X30 Z40 WZ", slug: "hm-350x36x30-z40", category: "tsirkulyarni-trioni", price: 60.11, stock: 20, featured: false, topProduct: false },
  { name: "350X3.6X30 Z56 WZ", slug: "hm-350x36x30-z56", category: "tsirkulyarni-trioni", price: 70.72, stock: 20, featured: false, topProduct: false },
  { name: "400X3.6X30 Z64 WZ", slug: "hm-400x36x30-z64", category: "tsirkulyarni-trioni", price: 89.45, stock: 20, featured: false, topProduct: false },
  { name: "500X4.0X30 Z64 WZ", slug: "hm-500x40x30-z64", category: "tsirkulyarni-trioni", price: 112.78, stock: 20, featured: false, topProduct: false },

  // === НОЖОВЕ ЗА АБРИХТ — 100Cr6 ===
  { name: "Нож за абрихт 100Cr6 260х25х2,5 1бр.", slug: "abriht-100cr6-260x25", category: "nozhove-za-abriht", price: 5.68, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 260х30х3 1бр.", slug: "abriht-100cr6-260x30", category: "nozhove-za-abriht", price: 5.47, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 320х30х3 1бр.", slug: "abriht-100cr6-320x30", category: "nozhove-za-abriht", price: 6.75, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 410х30х3 1бр.", slug: "abriht-100cr6-410x30", category: "nozhove-za-abriht", price: 8.59, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 510х30х3 1бр.", slug: "abriht-100cr6-510x30", category: "nozhove-za-abriht", price: 10.69, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 610х30х3 1бр.", slug: "abriht-100cr6-610x30", category: "nozhove-za-abriht", price: 12.78, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 640х30х3 1бр.", slug: "abriht-100cr6-640x30", category: "nozhove-za-abriht", price: 13.40, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт 100Cr6 810х30х3 1бр.", slug: "abriht-100cr6-810x30", category: "nozhove-za-abriht", price: 16.97, stock: 20, featured: false, topProduct: false },

  // === НОЖОВЕ ЗА АБРИХТ — HSS ===
  { name: "Нож за абрихт HSS 260х25х2,5 1бр.", slug: "abriht-hss-260x25", category: "nozhove-za-abriht", price: 13.19, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 260х30х3 1бр.", slug: "abriht-hss-260x30", category: "nozhove-za-abriht", price: 13.55, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 320х30х3 1бр.", slug: "abriht-hss-320x30", category: "nozhove-za-abriht", price: 16.67, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 410х30х3 1бр.", slug: "abriht-hss-410x30", category: "nozhove-za-abriht", price: 22.55, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 510х30х3 1бр.", slug: "abriht-hss-510x30", category: "nozhove-za-abriht", price: 28.02, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 610х30х3 1бр.", slug: "abriht-hss-610x30", category: "nozhove-za-abriht", price: 33.54, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 640х30х3 1бр.", slug: "abriht-hss-640x30", category: "nozhove-za-abriht", price: 35.18, stock: 20, featured: false, topProduct: false },
  { name: "Нож за абрихт HSS 810х30х3 1бр.", slug: "abriht-hss-810x30", category: "nozhove-za-abriht", price: 44.48, stock: 20, featured: false, topProduct: false },

  // === АБРАЗИВИ, ДИАМАНТ, CBN ===
  { name: "Абразивен диск за заточване ф150 8/3", slug: "abraziv-150-8-3", category: "abrazivi", price: 17.73, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф150 10/3", slug: "abraziv-150-10-3", category: "abrazivi", price: 18.53, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф150 13/3", slug: "abraziv-150-13-3", category: "abrazivi", price: 19.82, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф200 8/3", slug: "abraziv-200-8-3", category: "abrazivi", price: 22.33, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф200 10/3", slug: "abraziv-200-10-3", category: "abrazivi", price: 24.05, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф200 х13/3", slug: "abraziv-200-13-3", category: "abrazivi", price: 26.01, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф250 х10/3", slug: "abraziv-250-10-3", category: "abrazivi", price: 29.88, stock: 20, featured: false, topProduct: false },
  { name: "Абразивен диск за заточване ф250 х13/3", slug: "abraziv-250-13-3", category: "abrazivi", price: 30.92, stock: 20, featured: false, topProduct: false },
  { name: "Диамантен диск за заточване 125mm 12R4", slug: "diamond-125-12r4", category: "abrazivi", price: 26.54, stock: 20, featured: false, topProduct: false },
  { name: "Диамантен диск за заточване 125mm 12A2-20", slug: "diamond-125-12a2", category: "abrazivi", price: 26.95, stock: 20, featured: false, topProduct: false },
  { name: "Диамантен диск за заточване 150mm 12R4", slug: "diamond-150-12r4", category: "abrazivi", price: 39.37, stock: 20, featured: false, topProduct: false },
  { name: "Диамантен диск за заточване 150mm 12A2-20", slug: "diamond-150-12a2", category: "abrazivi", price: 39.37, stock: 20, featured: false, topProduct: false },
  { name: "CBN (Боразон) заточен диск", slug: "cbn-borazon-disk", category: "abrazivi", price: 171.79, stock: 20, featured: false, topProduct: false },
  { name: "Охлаждаща течност ACP - 2E", slug: "coolant-acp-2e", category: "abrazivi", price: 25.77, stock: 20, featured: false, topProduct: false },
  { name: "Охлаждаща течност ACP - 2E + CBN диск", slug: "coolant-acp-2e-cbn", category: "abrazivi", price: 192.65, stock: 20, featured: false, topProduct: false },

  // === МАШИНИ ===
  { name: "Заточна машина за банцигови ленти със CBN | ZM150", slug: "zm150", category: "mashini", price: 5742.00, stock: 20, featured: true, topProduct: true },
  { name: "Точиларка за ленти / Заточна машина ZM101", slug: "zm101", category: "mashini", price: 2474.00, stock: 20, featured: true, topProduct: true },
  { name: "Устройство за чапраз СА130", slug: "ca130", category: "mashini", price: 993.00, stock: 20, featured: true, topProduct: true },
  { name: "Автоматична машина за чапраз ASM-60", slug: "asm-60", category: "mashini", price: 5742.00, stock: 20, featured: true, topProduct: true },

  // === КОНСУМАТИВИ ===
  { name: "Комплект гърбици профил N стъпка 10mm 12,5mm", slug: "garbici-n-10-125", category: "konsumativi", price: 26.08, stock: 20, featured: false, topProduct: false },
  { name: "Комплект гърбици профил NU WoodMizer", slug: "garbici-nu-woodmizer", category: "konsumativi", price: 26.08, stock: 20, featured: false, topProduct: false },
  { name: "Комплект гърбици профил N стъпка 15mm 20mm 25mm", slug: "garbici-n-15-20-25", category: "konsumativi", price: 26.08, stock: 20, featured: false, topProduct: false },
  { name: "Уред за измерване на чапраз", slug: "ured-chapraz", category: "konsumativi", price: 171.79, stock: 20, featured: false, topProduct: false },
];
