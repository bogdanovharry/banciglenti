// Complete product catalog from banciglenti.com

import { MACHINES } from './machines'
import { BLADE_SETS, PACK_TIERS } from './packs'
import { HORIZONTAL_WOOD_BLADES, METAL_CARBON_BLADES } from './pricing'

export interface ProductData {
  name: string;
  slug: string;
  category: string;
  price: number; // EUR without VAT
  stock: number;
  featured: boolean;
  topProduct: boolean;

  /**
   * Set only on generated rows, where the values are known exactly.
   *
   * The original catalogue rows carry their dimensions inside the name and are
   * parsed back out at seed time. Generated blades do not need guessing at —
   * they were built from a price-table row, so the numbers are carried instead
   * of re-derived from a string.
   */
  series?: string;
  width?: number;
  thickness?: number;
  length?: number;
  /** Blades per box. Absent or 1 means a single blade. */
  packQty?: number;
  /** Mills this loop length fits — drives the "Пасва на машина" filter. */
  machines?: string[];
  /** Teeth per inch, bare — matches METAL_CARBON_BLADES' key format. */
  pitch?: string;
  /** One line per blade in a mixed set; absent on singles and boxes. */
  setContents?: string[];
}

export const CATALOGUE_PRODUCTS: ProductData[] = [
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

// ---------------------------------------------------------------------------
// Ready-made sawmill blades — ProCut and SoftCut, welded to length
// ---------------------------------------------------------------------------

/**
 * The mills these are cut for.
 *
 * Wood-Mizer first because it is the machine actually in the yards: it runs its
 * own Bulgarian and Romanian subsidiaries (woodmizer.bg, woodmizer.ro), which
 * no other mill brand in either market does. The rest are the mills whose loop
 * length is published and checkable.
 *
 * Metabo is deliberately not here, though it was asked for. A BAS 261 is a
 * 1712 mm workshop bandsaw taking an 8–13 mm blade; ProCut starts at 32 mm and
 * physically will not go on it. The catalogue already carries the right blade
 * for that machine under Хоби банциг.
 *
 * IMPORTANT — a wrong loop length is a blade the customer cannot fit. Every
 * figure below carries its source. Confirm against the customer's own machine
 * before a first order, exactly as src/lib/machines.ts warns.
 */
export type SawmillFit = {
  /** Goes in the product name, so the buyer recognises their machine. */
  label: string
  /** Loop length in mm. */
  length: number
  source: string
  /** Confirmed against the manufacturer's own documentation. */
  verified: boolean
}

export const SAWMILL_FITS: SawmillFit[] = [
  {
    label: 'Wood-Mizer LT15 / LT20 / LT40',
    length: 4013, // 158" exactly = 4013.2 mm
    source: 'https://thebandsawshop.com/products/wood-mizer-lt15-classic-4013mm-158-wood-cutting-bandsaw-blade/',
    verified: false, // dealer listing; Logosol sells the same fit rounded to 4000
  },
  {
    label: 'Norwood LM Pro / HD36',
    length: 4246, // 167"
    source: 'https://www.logosol.com/us/accessories/bandsaw-blades/5-bandsaw-blades-standard-4246-x-33-x-1-1-mm.html',
    verified: false,
  },
  {
    label: 'Logosol B701 / B751',
    length: 3843, // 151"
    source: 'https://www.logosol.com/us/sawmills/band-sawmills/b751-band-sawmill',
    verified: false,
  },
  {
    label: 'Serra / Jonsered',
    length: 3570, // 140"
    source: 'https://www.logosol.com/us/accessories/bandsaw-blades/',
    verified: false,
  },
]

/**
 * Which price-table row backs each ready-made blade.
 *
 * Not a new price list. Every figure is computed from HORIZONTAL_WOOD_BLADES —
 * the same table the configurator quotes from and the same one the order route
 * re-prices against — so a shelf product and the same blade configured by hand
 * cannot drift apart. Change the price per metre in one place and both move.
 */
const READY_BLADES = [
  { series: 'ProCut', brand: 'MasterGold', width: 32, thickness: 1.1, pitch: '22.2' },
  { series: 'ProCut', brand: 'MasterGold', width: 35, thickness: 1.1, pitch: '22.2' },
  { series: 'SoftCut', brand: 'Kodiak', width: 35, thickness: 0.9, pitch: '22.2' },
  { series: 'SoftCut', brand: 'Kodiak', width: 38, thickness: 1.14, pitch: '22.2' },
] as const

const round2 = (n: number) => Math.round(n * 100) / 100
const slugPart = (n: number) => String(n).replace('.', '-')

function buildReadyBlades(): ProductData[] {
  const out: ProductData[] = []

  for (const spec of READY_BLADES) {
    const row = HORIZONTAL_WOOD_BLADES.find(
      (b) =>
        b.brand === spec.brand &&
        b.width === spec.width &&
        b.thickness === spec.thickness &&
        b.pitch === spec.pitch,
    )
    // A spec with no row would silently become a zero-priced product, so it is
    // dropped instead. Loudly, because it means the two files disagree.
    if (!row) {
      console.warn(`[products] no price row for ${spec.brand} ${spec.width}×${spec.thickness} ${spec.pitch}`)
      continue
    }

    for (const fit of SAWMILL_FITS) {
      const unit = round2(row.pricePerMeter * (fit.length / 1000) + row.welding)
      const dims = `${spec.width}×${spec.thickness}`
      const base = `saw-meister-${spec.series.toLowerCase()}-${slugPart(spec.width)}x${slugPart(spec.thickness)}-l${fit.length}`

      for (const { qty, discount } of PACK_TIERS) {
        const price = round2(unit * qty * (1 - discount))
        const isBox = qty > 1
        const pct = Math.round(discount * 100)

        out.push({
          name: isBox
            ? `Saw-Meister ${spec.series} ${dims} L=${fit.length}мм — кутия ${qty} бр.${pct ? ` (−${pct}%)` : ''}`
            : `Saw-Meister ${spec.series} ${dims} L=${fit.length}мм — ${fit.label}`,
          slug: isBox ? `${base}-x${qty}` : base,
          category: 'horizontalni-bantsizi',
          price,
          stock: isBox ? 10 : 20,
          // One flagship on the shelf, not sixty-four. ProCut 32×1.1 at the
          // Wood-Mizer length is the single most likely thing a yard needs.
          featured: !isBox && spec.series === 'ProCut' && spec.width === 32 && fit.length === 4013,
          topProduct: !isBox && spec.series === 'ProCut',
          series: spec.series.toLowerCase(),
          width: spec.width,
          thickness: spec.thickness,
          length: fit.length,
          packQty: qty,
          // Boxes carry it too — a yard filtering by its mill wants the box.
          machines: [fit.label],
        })
      }
    }
  }

  return out
}

export const READY_SAWMILL_BLADES: ProductData[] = buildReadyBlades()

// ---------------------------------------------------------------------------
// Hobby bandsaw blades — by machine, by tooth pitch, plus mixed sets
// ---------------------------------------------------------------------------

/**
 * Widths with a real price row behind them. 16 and 19 mm appear in the
 * configurator's placeholder list but exist in no price table, so they are not
 * sold here — an option that cannot be priced is not an option.
 */
const HOBBY_WIDTHS = [6, 8, 10, 13, 20] as const

/**
 * The range is 0.65 mm and stays 0.65 mm.
 *
 * Machines with Ø200–250 mm wheels are usually specified for 0.35–0.5 mm, and
 * 0.65 fatigue-cracks sooner on them. That is a known and accepted trade: the
 * workshop does not stock 0.5 mm strip, so the alternative is not a thinner
 * blade, it is no blade. Do not "fix" this by adding a 0.5 mm row without a
 * price behind it — a size that cannot be made is worse than a compromise that
 * can. Revisit if 0.5 mm ever enters the price list.
 */
const HOBBY_THICKNESS = 0.65

/** The three pitches stocked across the range. 6 mm also exists at 6 TPI. */
const HOBBY_PITCHES = ['4', '8', '14'] as const

/** The pitch a blade is assumed to be when the product predates pitch. */
const LEGACY_PITCH = '8'

/**
 * Loop lengths worth stocking, taken from the machine registry rather than
 * from a second hand-kept list.
 *
 * Sawmill blades needed their own SAWMILL_FITS because no mill was in
 * machines.ts. Hobby machines are all there, so the lengths are derived: add a
 * machine to the registry and its length is stocked, with no change here.
 * Anything above 2400 mm is a floor-standing saw, not hobby.
 */
function hobbyLengths(): { length: number; machines: string[] }[] {
  const byLength = new Map<number, { machines: string[]; verified: boolean }>()

  for (const m of MACHINES) {
    // Meat saws share the length range and nothing else. A carbon wood blade
    // on a Bizerba is the wrong steel for food contact and the wrong tooth for
    // bone, so industry has to be filtered, not just the length.
    if (m.industry === 'meat') continue
    if (m.length > 2400) continue

    const entry = byLength.get(m.length) ?? { machines: [], verified: false }
    entry.machines.push(`${m.brand} ${m.model}`)
    entry.verified = entry.verified || m.verified
    byLength.set(m.length, entry)
  }

  return (
    [...byLength.entries()]
      /**
       * A length nobody has confirmed does not get stocked.
       *
       * The three the workshop could not vouch for all had two figures in
       * circulation — Record BS300E at 2368 or 2370, Scheppach Basato 3 at
       * 2360, Ryobi RBS904 at 1505 or 1575 — and the difference between them
       * is a blade that will not go on the machine. Everything here needs at
       * least one entry confirmed against the manufacturer's own documentation;
       * `verified: false` means "found on a dealer listing", which is exactly
       * the standard of evidence that produces the wrong length.
       *
       * Add the source to machines.ts and flip the flag, and the size appears
       * here on the next run with no change to this file.
       */
      .filter(([, e]) => e.verified)
      .map(([length, e]) => ({ length, machines: e.machines }))
      .sort((a, b) => a.length - b.length)
  )
}

/**
 * Which width/length pairs the catalogue already sells.
 *
 * Those rows predate tooth pitch, so they are treated as the 8 TPI general
 * blade — see enrichLegacyHobby below. Generating an 8 TPI SKU for the same
 * size would put the identical blade on the shelf twice under two slugs, so
 * those combinations are skipped.
 */
function legacyHobbyCoverage(): Set<string> {
  const seen = new Set<string>()
  for (const p of CATALOGUE_PRODUCTS) {
    if (p.category !== 'hobi-bantsig') continue
    const size = /(\d+)\s*[хx]\s*0[.,]65/.exec(p.name)
    const len = /L=(\d+)/.exec(p.name)
    if (size && len) seen.add(`${size[1]}x${len[1]}`)
  }
  return seen
}

const priceOf = (width: number, pitch: string, length: number) => {
  const row = METAL_CARBON_BLADES.find(
    (b) => b.width === width && b.pitch === pitch,
  )
  return row ? round2(row.pricePerMeter * (length / 1000) + row.welding) : null
}

/** What each pitch is for, in the words a hobby buyer uses. */
const PITCH_JOB: Record<string, string> = {
  '4': 'разбичване и дебел материал',
  '6': 'бърз рез в мек материал',
  '8': 'универсална',
  '14': 'завои и чист срез',
}

function buildHobbyBlades(): ProductData[] {
  const out: ProductData[] = []
  const legacy = legacyHobbyCoverage()

  for (const { length, machines } of hobbyLengths()) {
    for (const width of HOBBY_WIDTHS) {
      for (const pitch of HOBBY_PITCHES) {
        // Already on the shelf without a stated pitch — do not duplicate it.
        if (pitch === LEGACY_PITCH && legacy.has(`${width}x${length}`)) continue

        const price = priceOf(width, pitch, length)
        if (price === null) continue // no price row for this width/pitch

        out.push({
          name: `Saw-Meister FlexCut ${width}×0.65 ${pitch} TPI L=${length}мм — ${PITCH_JOB[pitch]}`,
          slug: `flexcut-${width}x0-65-${pitch}t-l${length}`,
          category: 'hobi-bantsig',
          price,
          stock: 20,
          featured: false,
          topProduct: false,
          series: 'flexcut',
          width,
          thickness: HOBBY_THICKNESS,
          length,
          pitch,
          machines,
        })
      }
    }
  }
  return out
}

/**
 * The mixed sets, one per stocked length.
 *
 * Priced as the sum of their members, so a set can never quietly cost more
 * than buying the blades separately — which is the failure mode that makes a
 * customer stop trusting bundles.
 */
function buildHobbySets(): ProductData[] {
  const out: ProductData[] = []

  for (const { length, machines } of hobbyLengths()) {
    for (const set of BLADE_SETS) {
      const prices = set.members.map((m) => priceOf(m.width, m.pitch, length))
      // A set is all-or-nothing: one unpriceable member and it is not offered.
      if (prices.some((p) => p === null)) continue

      const full = round2((prices as number[]).reduce((s, p) => s + p, 0))
      const contents = set.members.map((m) => `${m.width} мм · ${m.pitch} TPI — ${m.job}`)

      out.push({
        name: `Saw-Meister FlexCut — комплект „${set.name}" ${set.members.length} бр. L=${length}мм`,
        slug: `flexcut-l${length}-set-${set.key}`,
        category: 'hobi-bantsig',
        price: round2(full * (1 - set.discount)),
        stock: 10,
        featured: set.key === 'start' && length === 1400,
        topProduct: set.key === 'start',
        series: 'flexcut',
        thickness: HOBBY_THICKNESS,
        length,
        packQty: set.members.length,
        setContents: contents,
        machines,
      })
    }
  }
  return out
}

/**
 * Gives the pre-existing hobby rows the metadata the new ones carry.
 *
 * They keep their slug and their price — the URLs are indexed and the figures
 * are the ones actually being charged. What they gain is the pitch they always
 * were, plus the series, dimensions and machine list that make them filterable
 * alongside everything else.
 */
function enrichLegacyHobby(rows: ProductData[]): ProductData[] {
  const machinesFor = new Map(hobbyLengths().map((l) => [l.length, l.machines]))

  return rows.map((p) => {
    if (p.category !== 'hobi-bantsig' || p.pitch) return p

    const size = /(\d+)\s*[хx]\s*0[.,]65/.exec(p.name)
    const len = /L=(\d+)/.exec(p.name)
    if (!size || !len) return p

    const width = Number(size[1])
    const length = Number(len[1])
    return {
      ...p,
      series: 'flexcut',
      width,
      thickness: HOBBY_THICKNESS,
      length,
      pitch: LEGACY_PITCH,
      machines: machinesFor.get(length) ?? p.machines,
    }
  })
}

export const HOBBY_BLADES: ProductData[] = buildHobbyBlades()
export const HOBBY_SETS: ProductData[] = buildHobbySets()

/** Legacy hobby rows, now carrying a pitch. Same slugs, same prices. */
export const CATALOGUE_ENRICHED: ProductData[] = enrichLegacyHobby(CATALOGUE_PRODUCTS)

export const ALL_PRODUCTS: ProductData[] = [
  ...CATALOGUE_ENRICHED,
  ...READY_SAWMILL_BLADES,
  ...HOBBY_BLADES,
  ...HOBBY_SETS,
]
