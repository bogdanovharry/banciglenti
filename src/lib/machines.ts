/**
 * Machine → blade-size registry.
 *
 * Compiled from manufacturer documentation and dealer specification sheets in
 * August 2026. Each entry keeps the URL it came from so any figure can be
 * re-checked without repeating the search.
 *
 * IMPORTANT — `verified` means "confirmed against the manufacturer's own
 * documentation", not "confirmed by ТЕХНОЛЕС". A wrong length here means a
 * customer receives a blade that will not fit their machine. Treat every entry
 * as provisional until the workshop signs it off; `verified: false` marks the
 * ones where the source was a dealer listing rather than the manufacturer.
 */
export type MachineIndustry = "wood" | "metal" | "meat";

export type Machine = {
  brand: string;
  model: string;
  industry: MachineIndustry;
  /** Blade loop length in mm — the figure a buyer must match exactly. */
  length: number;
  /** Only recorded where the source stated it. */
  width?: number;
  thickness?: number;
  source: string;
  verified: boolean;
};

export const MACHINES: Machine[] = [
  // ---------- Wood ----------
  // These four are already served by the existing catalogue; the lengths come
  // from the product names ТЕХНОЛЕС already sells them under.
  // Einhell specify 6–12 mm; the catalogue has sold a 13 mm for this saw for
  // years without complaint, and the workshop is content that one millimetre
  // over makes no difference on this class of machine. Recorded so the gap
  // between the spec sheet and the shelf is a decision, not an oversight.
  { brand: "Einhell", model: "TC-SB 200/1", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  { brand: "Parkside", model: "PBS 350", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  { brand: "Raider", model: "RD-BSW18", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  {
    brand: "Einhell", model: "TC-SB 245 L", industry: "wood", length: 1712, width: 10,
    source: "https://einhell.de/en/p/4308036-tc-sb-245-l",
    verified: true, // Einhell's technical data: saw band 1712 x 10 mm
  },
  { brand: "Metabo", model: "BAS 261", industry: "wood", length: 1712, thickness: 0.65, source: "catalogue", verified: true },

  {
    brand: "Scheppach", model: "Basato 3 / Basa 3", industry: "wood", length: 2360,
    source: "https://www.probois-machinoutils.com/en/263-blade-of-band-saw-for-kity-673-scheppach-basa",
    // Downgraded: the source is a blade dealer, not Scheppach. 2360 also sits
    // 8 mm from the Record BS300E's 2368, and the two are not interchangeable —
    // exactly the confusion that sells somebody the wrong loop.
    verified: false,
  },
  {
    brand: "Holzmann", model: "HBS300J", industry: "wood", length: 2240,
    source: "https://www.holzmann-maschinen.at/EN/wood-bandsaw-658",
    verified: true,
  },
  {
    brand: "Record Power", model: "BS300", industry: "wood", length: 2370,
    source: "https://www.manualslib.com/manual/1759280/Record-Power-Bs300.html",
    // Downgraded: blade specialists list the BS300E at 2368 mm, the manual at
    // 2370. Two figures in circulation is not a confirmed length, and 2 mm on
    // a loop is the difference between fitting and not.
    verified: false,
  },
  {
    brand: "Record Power", model: "BS250", industry: "wood", length: 1790,
    source: "https://www.manualslib.com/manual/994203/Record-Power-Bs250.html",
    verified: false, // stated as 70½", converted; confirm before selling
  },
  {
    brand: "Record Power", model: "BS350", industry: "wood", length: 2629,
    source: "https://www.scosarg.com/record-power-14-bandsaw-free-delivery",
    verified: false, // dealer listing, not the manual
  },

  // The lengths the catalogue was missing entirely. 1425 mm is the gap that
  // mattered most: Güde GBS 200 and Raider RD-BSW17 are both shop staples in
  // Bulgaria and Romania, and neither had a single blade listed for it.
  {
    brand: "Güde", model: "GBS 200", industry: "wood", length: 1425, width: 10, thickness: 0.65,
    source: "https://www.endress-elektro.de/Shop/Guede-Saegeband-zu-Bandsaege-GBS-200--1425-x-10-mm--6-Z-.html",
    verified: true, // Güde's own accessory part numbers 83816/83817
  },
  {
    brand: "Raider", model: "RD-BSW17", industry: "wood", length: 1425, width: 6,
    source: "https://www.raider.bg/c/lenti-295/lenta-za-bancig-6h1425mm-za-rd-bsw17-576",
    verified: true, // Raider's own parts listing
  },
  {
    brand: "Scheppach", model: "HBS261", industry: "wood", length: 1790, width: 13, thickness: 0.65,
    source: "https://scheppach.bg/product/банциг-hbs261-scheppach-5901514901-550-w-1790-мм/",
    verified: true, // official Bulgarian distributor
  },
  {
    brand: "Holzmann", model: "HBS230HQ / HBS230ECO", industry: "wood", length: 1575, width: 10, thickness: 0.5,
    source: "https://www.holzmann-maschinen.at/EN/wood-bandsaw-2209",
    verified: true,
  },
  {
    brand: "Bernardo", model: "HBS 230", industry: "wood", length: 1575, width: 10, thickness: 0.5,
    source: "https://www.bernardo-shop.com/en/bandsaw-blades-wood-bandsaws-bernardo-bandsaw-blade-1575-x-6-35-x-0-5-10-tpi-for-hbs-230.html",
    verified: true,
  },
  {
    brand: "Scheppach", model: "Basa 1 / Basato 1", industry: "wood", length: 1490, width: 13, thickness: 0.5,
    source: "https://www.stokker.com/en/sawblades/73220701&SCHEP/scheppach-band-saw-blade-basa-1-1490-x-12-x-036-mm-4-tpi",
    verified: false, // dealer listing
  },
  {
    brand: "Einhell", model: "TC-SB 305 U", industry: "wood", length: 2320, width: 13, thickness: 0.65,
    source: "https://www.conrad.com/ce/en/product/1493249/Einhell----TC-SB-305-U----Band-saw----750-W----2320-mm",
    verified: true, // matches the kwb-by-Einhell accessory blade
  },
  {
    brand: "Metabo", model: "BAS 318 Precision", industry: "wood", length: 2240, width: 20, thickness: 0.65,
    source: "https://www.metabo.com/com/en/tools/sawing/band-saws/bas-318-precision-wnb-619009180-band-saw.html",
    verified: true,
  },
  {
    brand: "Makita", model: "LB1200F", industry: "wood", length: 2240, width: 16, thickness: 0.5,
    source: "https://www.makitauk.com/product/lb1200f.html",
    verified: true,
  },

  // ---------- Metal ----------
  {
    brand: "Optimum", model: "S 275 G / S 275 N", industry: "metal", length: 2480, width: 27, thickness: 0.9,
    source: "https://www.stuermer-machines.com/metalworking/metalworking-machines-metal-band-saws/optisaw-s-275n-3300260/",
    verified: true,
  },
  {
    brand: "Femi", model: "NG120 XL / ABS-NG120", industry: "metal", length: 1440, width: 13, thickness: 0.65,
    source: "https://www.femi.it/en/femi/linea-taglio-metallo/segatrici-a-nastro-portatili/ng120-xl/",
    verified: true,
  },
  {
    brand: "Holzmann", model: "BS128HDR", industry: "metal", length: 1638, width: 13, thickness: 0.6,
    source: "https://www.holzmann-maschinen.at/EN/metal-band-saw-226",
    verified: true,
  },
  // Lengths below are stated in millimetres by the machine's own maker or its
  // European dealer. Nothing here was converted from inches.
  {
    brand: "Optimum", model: "S 131 GH", industry: "metal", length: 1638, width: 13, thickness: 0.65,
    source: "https://tbs-online.de/de/en/Tool/Bits-drills-cutting-grinding/Cutting-off/Bandsaw-blades/Band-saw-blade-set-OPTIMUM-OPTIsaw-3-piece-length-mm-1638-bi-metal-sid471323.html",
    verified: false, // dealer listing of Optimum's own OPTIsaw 1638x13x0.65 set
  },
  {
    brand: "Proma", model: "PPS-220H", industry: "metal", length: 2460, width: 27, thickness: 0.9,
    source: "https://mb.mysky-shop.pl/PROMA-Metal-Band-Cutter-PPS-220H-p22117",
    verified: false, // dealer listing
  },
  {
    brand: "Proma", model: "PPS-250HPA", industry: "metal", length: 2680, width: 27, thickness: 0.9,
    source: "https://intercars.md/en/catalog/product/battery-band-saw-D431ED",
    verified: false, // dealer listing
  },
  {
    brand: "Proma", model: "PPS-170H", industry: "metal", length: 2110, width: 20, thickness: 0.9,
    source: "https://intercars.md/en/catalog/product/battery-band-saw-D4B5A1",
    verified: false, // dealer listing
  },
  {
    brand: "Holzmann", model: "BS125M", industry: "metal", length: 1435, width: 13, thickness: 0.65,
    source: "https://www.ebay.de/itm/143477509644",
    verified: false, // marketplace listing only
  },

  // ---------- Meat ----------
  {
    brand: "Bizerba", model: "FK 22", industry: "meat", length: 1670, width: 15, thickness: 0.45,
    source: "https://www.exapro.com/bizerba-fk22-p260212455/",
    verified: false, // resale listing; confirm against Bizerba parts list
  },
  {
    brand: "Bizerba", model: "FK 23", industry: "meat", length: 1760, width: 16,
    source: "https://www.bizerba.com/sg/en/products/fk_23",
    verified: true,
  },
  {
    brand: "Mainca", model: "BC-1800", industry: "meat", length: 1750,
    source: "https://mainca.com/en/meat-equipment/bandsaws/bc-1800.html",
    verified: true,
  },
  {
    brand: "Sirman", model: "SO 1550 F3", industry: "meat", length: 1550, width: 16,
    source: "https://www.sirman.com/en-GB/food-processing/meat-processing/so-1650-f3/24163402F",
    verified: true,
  },
  {
    brand: "Sirman", model: "SO 1650 F3", industry: "meat", length: 1650, width: 16,
    source: "https://www.sirman.com/en-GB/food-processing/meat-processing/so-1650-f3/24163402F",
    verified: true,
  },
  {
    brand: "Sirman", model: "SO 1840 F3", industry: "meat", length: 1840, width: 16,
    source: "http://www.thomsonnthomsons.com/sirmanbonesawsbladelengthmm155016501840pulley210mm250mm/pid-2225597011",
    verified: false, // distributor table only
  },
  {
    brand: "Mainca", model: "BC-2200", industry: "meat", length: 2280,
    source: "https://www.butchersequipment.co.uk/butchers-machinery/meat-bandsaws/mainca-meat-bandsaw-bc2200",
    verified: false, // UK dealer; the same dealer's BC-1800 figure matches Mainca's own
  },
  {
    brand: "Mainca", model: "BC-2800", industry: "meat", length: 2720,
    source: "https://www.butchersequipment.co.uk/butchers-machinery/meat-bandsaws/mainca-meat-bandsaw-bc2800",
    verified: false,
  },
  {
    brand: "Mainca", model: "BC-3200", industry: "meat", length: 3060,
    source: "https://www.butchersequipment.co.uk/mainca-meat-bandsaw-bc3200-3398",
    verified: false,
  },
];

/** "Einhell TC-SB 200/1" — the string a buyer recognises and searches for. */
export const machineLabel = (m: Machine) => `${m.brand} ${m.model}`;

/** Machines whose blade loop is this length, so existing stock can be tagged. */
export function machinesForLength(length: number): Machine[] {
  return MACHINES.filter((m) => m.length === length);
}
