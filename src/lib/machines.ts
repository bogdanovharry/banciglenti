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
  { brand: "Einhell", model: "TC-SB 200/1", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  { brand: "Parkside", model: "PBS 350", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  { brand: "Raider", model: "RD-BSW18", industry: "wood", length: 1400, thickness: 0.65, source: "catalogue", verified: true },
  { brand: "Metabo", model: "BAS 261", industry: "wood", length: 1712, thickness: 0.65, source: "catalogue", verified: true },

  {
    brand: "Scheppach", model: "Basato 3 / Basa 3", industry: "wood", length: 2360,
    source: "https://www.probois-machinoutils.com/en/263-blade-of-band-saw-for-kity-673-scheppach-basa",
    verified: true,
  },
  {
    brand: "Holzmann", model: "HBS300J", industry: "wood", length: 2240,
    source: "https://www.holzmann-maschinen.at/EN/wood-bandsaw-658",
    verified: true,
  },
  {
    brand: "Record Power", model: "BS300", industry: "wood", length: 2370,
    source: "https://www.manualslib.com/manual/1759280/Record-Power-Bs300.html",
    verified: true,
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
];

/** "Einhell TC-SB 200/1" — the string a buyer recognises and searches for. */
export const machineLabel = (m: Machine) => `${m.brand} ${m.model}`;

/** Machines whose blade loop is this length, so existing stock can be tagged. */
export function machinesForLength(length: number): Machine[] {
  return MACHINES.filter((m) => m.length === length);
}
