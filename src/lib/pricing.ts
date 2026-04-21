// Real pricing data from banciglenti.com admin panel
// Format: { width, thickness, pitch, brand, pricePerMeter, welding, sharpening, heatTreatment, setting }

export interface BladeConfig {
  width: number;
  thickness: number;
  pitch: string;
  brand: string;
  pricePerMeter: number; // EUR/m
  welding: number; // EUR/piece (fixed per weld)
  sharpening: number; // EUR/m
  heatTreatment: number; // EUR/m
  setting: number; // EUR/m (чапраз)
}

// Vertical bandsaw blades for wood
export const VERTICAL_WOOD_BLADES: BladeConfig[] = [
  // Kodiak
  { width: 20, thickness: 0.60, pitch: "6", brand: "Kodiak", pricePerMeter: 1.18, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.10 },
  { width: 20, thickness: 0.60, pitch: "8", brand: "Kodiak", pricePerMeter: 1.18, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.10 },
  { width: 25, thickness: 0.60, pitch: "6", brand: "Kodiak", pricePerMeter: 1.38, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.20 },
  { width: 25, thickness: 0.60, pitch: "8", brand: "Kodiak", pricePerMeter: 1.38, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.20 },
  { width: 25, thickness: 0.60, pitch: "10", brand: "Kodiak", pricePerMeter: 1.38, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.20 },
  { width: 30, thickness: 0.70, pitch: "10", brand: "Kodiak", pricePerMeter: 1.53, welding: 1.84, sharpening: 0.41, heatTreatment: 0.26, setting: 0.20 },
  { width: 40, thickness: 0.80, pitch: "10", brand: "Kodiak", pricePerMeter: 2.25, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 40, thickness: 0.80, pitch: "12.5", brand: "Kodiak", pricePerMeter: 2.25, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 50, thickness: 0.90, pitch: "12.5", brand: "Kodiak", pricePerMeter: 2.91, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 50, thickness: 0.90, pitch: "15", brand: "Kodiak", pricePerMeter: 2.91, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },

  // Böhler
  { width: 15, thickness: 0.50, pitch: "6", brand: "Böhler", pricePerMeter: 1.28, welding: 1.84, sharpening: 0.41, heatTreatment: 0.00, setting: 0.10 },
  { width: 30, thickness: 0.70, pitch: "8", brand: "Böhler", pricePerMeter: 1.74, welding: 1.84, sharpening: 0.41, heatTreatment: 0.26, setting: 0.20 },
  { width: 30, thickness: 0.70, pitch: "10", brand: "Böhler", pricePerMeter: 1.74, welding: 1.84, sharpening: 0.41, heatTreatment: 0.26, setting: 0.20 },
  { width: 40, thickness: 0.80, pitch: "10", brand: "Böhler", pricePerMeter: 2.45, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 40, thickness: 0.80, pitch: "12.5", brand: "Böhler", pricePerMeter: 2.45, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 50, thickness: 0.90, pitch: "10", brand: "Böhler", pricePerMeter: 3.48, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 50, thickness: 0.90, pitch: "12.5", brand: "Böhler", pricePerMeter: 3.48, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 50, thickness: 0.90, pitch: "15", brand: "Böhler", pricePerMeter: 3.48, welding: 3.07, sharpening: 0.41, heatTreatment: 0.31, setting: 0.26 },
  { width: 60, thickness: 0.90, pitch: "12.5", brand: "Böhler", pricePerMeter: 4.45, welding: 3.68, sharpening: 0.46, heatTreatment: 0.31, setting: 0.26 },
  { width: 60, thickness: 0.90, pitch: "15", brand: "Böhler", pricePerMeter: 4.45, welding: 3.68, sharpening: 0.46, heatTreatment: 0.31, setting: 0.26 },
  { width: 60, thickness: 0.90, pitch: "20", brand: "Böhler", pricePerMeter: 4.45, welding: 3.68, sharpening: 0.46, heatTreatment: 0.31, setting: 0.26 },
  { width: 70, thickness: 0.90, pitch: "12.5", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.51, heatTreatment: 0.31, setting: 0.31 },
  { width: 70, thickness: 0.90, pitch: "15", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.51, heatTreatment: 0.31, setting: 0.31 },
  { width: 70, thickness: 0.90, pitch: "20", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.51, heatTreatment: 0.31, setting: 0.31 },
  { width: 70, thickness: 0.90, pitch: "25", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.51, heatTreatment: 0.31, setting: 0.31 },
  { width: 80, thickness: 1.00, pitch: "15", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.56, heatTreatment: 0.61, setting: 0.36 },
  { width: 80, thickness: 1.00, pitch: "20", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.56, heatTreatment: 0.61, setting: 0.36 },
  { width: 80, thickness: 1.00, pitch: "25", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.56, heatTreatment: 0.61, setting: 0.36 },
  { width: 80, thickness: 1.00, pitch: "31", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.56, heatTreatment: 0.61, setting: 0.36 },

  // MasterGold
  { width: 50, thickness: 1.10, pitch: "12.5", brand: "MasterGold", pricePerMeter: 4.81, welding: 4.29, sharpening: 0.56, heatTreatment: 0.00, setting: 0.51 },
  { width: 50, thickness: 1.10, pitch: "22.22", brand: "MasterGold", pricePerMeter: 4.81, welding: 4.29, sharpening: 0.56, heatTreatment: 0.00, setting: 0.51 },

  // Flexback Carbon
  { width: 6, thickness: 0.65, pitch: "6 TPI", brand: "Flexback Carbon", pricePerMeter: 2.66, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 8, thickness: 0.65, pitch: "4 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 8, thickness: 0.65, pitch: "8 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 8, thickness: 0.65, pitch: "14 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 10, thickness: 0.65, pitch: "4 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 10, thickness: 0.65, pitch: "8 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 10, thickness: 0.65, pitch: "14 TPI", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 13, thickness: 0.65, pitch: "4 TPI", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 13, thickness: 0.65, pitch: "8 TPI", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 13, thickness: 0.65, pitch: "14 TPI", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 20, thickness: 0.80, pitch: "4 TPI", brand: "Flexback Carbon", pricePerMeter: 4.09, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
  { width: 20, thickness: 0.80, pitch: "8 TPI", brand: "Flexback Carbon", pricePerMeter: 4.09, welding: 1.84, sharpening: 0.00, heatTreatment: 0.00, setting: 0.00 },
];

/**
 * Calculate blade price
 * Formula: (pricePerMeter × lengthInMeters) + welding + (sharpening × length) + (heatTreat × length) + (setting × length)
 */
export function calculateBladePrice(
  blade: BladeConfig,
  lengthMm: number,
  options: { welding: boolean; sharpening: boolean; heatTreatment: boolean; setting: boolean }
) {
  const lengthM = lengthMm / 1000;

  const bladePrice = blade.pricePerMeter * lengthM;
  const weldingPrice = options.welding ? blade.welding : 0;
  const sharpeningPrice = options.sharpening ? blade.sharpening * lengthM : 0;
  const heatPrice = options.heatTreatment ? blade.heatTreatment * lengthM : 0;
  const settingPrice = options.setting ? blade.setting * lengthM : 0;

  const totalWithoutVat = bladePrice + weldingPrice + sharpeningPrice + heatPrice + settingPrice;
  const totalWithVat = totalWithoutVat * 1.2;

  return {
    bladePrice: Math.round(bladePrice * 100) / 100,
    weldingPrice: Math.round(weldingPrice * 100) / 100,
    sharpeningPrice: Math.round(sharpeningPrice * 100) / 100,
    heatPrice: Math.round(heatPrice * 100) / 100,
    settingPrice: Math.round(settingPrice * 100) / 100,
    totalWithoutVat: Math.round(totalWithoutVat * 100) / 100,
    totalWithVat: Math.round(totalWithVat * 100) / 100,
  };
}

/**
 * Get unique values from blade configs for dropdowns
 */
export function getUniqueValues(blades: BladeConfig[]) {
  const widths = [...new Set(blades.map((b) => b.width))].sort((a, b) => a - b);
  const brands = [...new Set(blades.map((b) => b.brand))];

  return { widths, brands };
}

/**
 * Get available options after selecting a width
 */
export function getOptionsForWidth(blades: BladeConfig[], width: number) {
  const filtered = blades.filter((b) => b.width === width);
  const thicknesses = [...new Set(filtered.map((b) => b.thickness))].sort((a, b) => a - b);
  const brands = [...new Set(filtered.map((b) => b.brand))];
  return { thicknesses, brands };
}

/**
 * Get available pitches after selecting width + thickness + brand
 */
export function getAvailablePitches(blades: BladeConfig[], width: number, thickness: number, brand: string) {
  return blades
    .filter((b) => b.width === width && b.thickness === thickness && b.brand === brand)
    .map((b) => b.pitch);
}

/**
 * Find exact blade config
 */
export function findBlade(blades: BladeConfig[], width: number, thickness: number, pitch: string, brand: string) {
  return blades.find(
    (b) => b.width === width && b.thickness === thickness && b.pitch === pitch && b.brand === brand
  );
}

// Horizontal bandsaw blades for wood
export const HORIZONTAL_WOOD_BLADES: BladeConfig[] = [
  // Kodiak
  { width: 35, thickness: 0.90, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.71, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 35, thickness: 0.90, pitch: "25", brand: "Kodiak", pricePerMeter: 2.71, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 38, thickness: 1.14, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.97, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 40, thickness: 0.90, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.76, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 40, thickness: 0.90, pitch: "25", brand: "Kodiak", pricePerMeter: 2.76, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 40, thickness: 1.00, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.86, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 40, thickness: 1.10, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.97, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 50, thickness: 0.90, pitch: "22.2", brand: "Kodiak", pricePerMeter: 2.97, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  { width: 50, thickness: 0.90, pitch: "25", brand: "Kodiak", pricePerMeter: 2.97, welding: 4.29, sharpening: 0.56, heatTreatment: 0.26, setting: 0.51 },
  // Böhler
  { width: 60, thickness: 0.90, pitch: "22.2", brand: "Böhler", pricePerMeter: 4.45, welding: 4.29, sharpening: 0.56, heatTreatment: 0.31, setting: 0.51 },
  { width: 60, thickness: 0.90, pitch: "25", brand: "Böhler", pricePerMeter: 4.45, welding: 4.29, sharpening: 0.56, heatTreatment: 0.31, setting: 0.51 },
  { width: 70, thickness: 0.90, pitch: "22.2", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.56, heatTreatment: 0.31, setting: 0.51 },
  { width: 70, thickness: 0.90, pitch: "25", brand: "Böhler", pricePerMeter: 6.03, welding: 4.91, sharpening: 0.56, heatTreatment: 0.31, setting: 0.51 },
  { width: 80, thickness: 1.00, pitch: "22.2", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.72, heatTreatment: 0.61, setting: 0.51 },
  { width: 80, thickness: 1.00, pitch: "25", brand: "Böhler", pricePerMeter: 7.26, welding: 4.91, sharpening: 0.72, heatTreatment: 0.61, setting: 0.51 },
  { width: 100, thickness: 1.10, pitch: "22.2", brand: "Böhler", pricePerMeter: 9.41, welding: 6.75, sharpening: 0.72, heatTreatment: 0.61, setting: 0.51 },
  { width: 100, thickness: 1.10, pitch: "25", brand: "Böhler", pricePerMeter: 9.41, welding: 6.75, sharpening: 0.72, heatTreatment: 0.61, setting: 0.51 },
  // BiMetal
  { width: 34, thickness: 0.90, pitch: "22", brand: "BiMetal", pricePerMeter: 9.82, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 41, thickness: 1.10, pitch: "22", brand: "BiMetal", pricePerMeter: 12.27, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  // MasterGold
  { width: 32, thickness: 1.10, pitch: "22.2", brand: "MasterGold", pricePerMeter: 3.37, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 32, thickness: 1.10, pitch: "25", brand: "MasterGold", pricePerMeter: 3.37, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 35, thickness: 1.10, pitch: "22.2", brand: "MasterGold", pricePerMeter: 3.68, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 35, thickness: 1.10, pitch: "25", brand: "MasterGold", pricePerMeter: 3.68, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 40, thickness: 1.10, pitch: "22.2", brand: "MasterGold", pricePerMeter: 4.09, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 40, thickness: 1.10, pitch: "25", brand: "MasterGold", pricePerMeter: 4.09, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 40, thickness: 1.00, pitch: "22.2", brand: "MasterGold", pricePerMeter: 3.68, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
  { width: 50, thickness: 1.10, pitch: "22.2", brand: "MasterGold", pricePerMeter: 4.81, welding: 4.29, sharpening: 0.56, heatTreatment: 0, setting: 0.51 },
];

// Bimetal M42 metal blades
export const METAL_BIMETAL_BLADES: BladeConfig[] = [
  { width: 13, thickness: 0.65, pitch: "6/10", brand: "Håkansson M42", pricePerMeter: 8.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 13, thickness: 0.65, pitch: "10/14", brand: "Håkansson M42", pricePerMeter: 8.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 13, thickness: 0.65, pitch: "8/12", brand: "Håkansson M42", pricePerMeter: 8.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.90, pitch: "8/12", brand: "Håkansson M42", pricePerMeter: 8.69, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.90, pitch: "4/6", brand: "Håkansson M42", pricePerMeter: 8.69, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.90, pitch: "10/14", brand: "Håkansson M42", pricePerMeter: 8.69, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.90, pitch: "5/8", brand: "Håkansson M42", pricePerMeter: 8.69, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.90, pitch: "12/16", brand: "Håkansson M42", pricePerMeter: 8.69, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "3/4", brand: "Håkansson M42", pricePerMeter: 9.71, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "8/12", brand: "Håkansson M42", pricePerMeter: 9.71, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "4/6", brand: "Håkansson M42", pricePerMeter: 9.71, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "2/3", brand: "Håkansson M42", pricePerMeter: 9.71, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "5/8", brand: "Håkansson M42", pricePerMeter: 9.71, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "4/6", brand: "Håkansson M90", pricePerMeter: 11.25, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 27, thickness: 0.90, pitch: "3/4", brand: "Håkansson M90", pricePerMeter: 11.25, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "8/12", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "3/4", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "1.4/2", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "5/8", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "4/6", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "2/3", brand: "Håkansson M42", pricePerMeter: 11.76, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "3/4", brand: "Håkansson M90", pricePerMeter: 14.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 34, thickness: 1.10, pitch: "2/3", brand: "Håkansson M90", pricePerMeter: 14.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 41, thickness: 1.30, pitch: "3/4", brand: "Håkansson M42", pricePerMeter: 16.51, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 41, thickness: 1.30, pitch: "1.4/2", brand: "Håkansson M42", pricePerMeter: 16.51, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 41, thickness: 1.30, pitch: "4/6", brand: "Håkansson M42", pricePerMeter: 16.51, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 41, thickness: 1.30, pitch: "2/3", brand: "Håkansson M42", pricePerMeter: 16.51, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 54, thickness: 1.60, pitch: "3/4", brand: "Håkansson M42", pricePerMeter: 23.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 54, thickness: 1.60, pitch: "2/3", brand: "Håkansson M42", pricePerMeter: 23.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 54, thickness: 1.60, pitch: "4/6", brand: "Håkansson M42", pricePerMeter: 23.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
];

// Carbon steel metal blades
export const METAL_CARBON_BLADES: BladeConfig[] = [
  { width: 6, thickness: 0.65, pitch: "6", brand: "Flexback Carbon", pricePerMeter: 2.66, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 6, thickness: 0.65, pitch: "4", brand: "Flexback Carbon", pricePerMeter: 2.66, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 8, thickness: 0.65, pitch: "4", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 8, thickness: 0.65, pitch: "8", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 8, thickness: 0.65, pitch: "14", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 10, thickness: 0.65, pitch: "4", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 10, thickness: 0.65, pitch: "8", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 10, thickness: 0.65, pitch: "14", brand: "Flexback Carbon", pricePerMeter: 2.97, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 13, thickness: 0.65, pitch: "4", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 13, thickness: 0.65, pitch: "8", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 13, thickness: 0.65, pitch: "14", brand: "Flexback Carbon", pricePerMeter: 3.17, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.80, pitch: "4", brand: "Flexback Carbon", pricePerMeter: 4.09, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.80, pitch: "8", brand: "Flexback Carbon", pricePerMeter: 4.09, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.80, pitch: "14", brand: "Flexback Carbon", pricePerMeter: 4.09, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
];

// Meat blades
export const MEAT_BLADES: BladeConfig[] = [
  { width: 16, thickness: 0.50, pitch: "3 TPI", brand: "Tehnoles", pricePerMeter: 4.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 16, thickness: 0.50, pitch: "4 TPI", brand: "Tehnoles", pricePerMeter: 4.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 16, thickness: 0.50, pitch: "Зъб чистач", brand: "Tehnoles", pricePerMeter: 4.85, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 16, thickness: 0.50, pitch: "Вдлъбната вълна", brand: "Tehnoles", pricePerMeter: 6.75, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 16, thickness: 0.50, pitch: "Изпъкнала вълна", brand: "Tehnoles", pricePerMeter: 6.75, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 16, thickness: 0.50, pitch: "Гладко заточен", brand: "Tehnoles", pricePerMeter: 3.93, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "4 TPI", brand: "Tehnoles", pricePerMeter: 4.60, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "3 TPI", brand: "Tehnoles", pricePerMeter: 4.60, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "Зъб чистач", brand: "Tehnoles", pricePerMeter: 5.09, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "Вдлъбната вълна", brand: "Tehnoles", pricePerMeter: 7.79, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "Изпъкнала вълна", brand: "Tehnoles", pricePerMeter: 7.79, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.50, pitch: "Гладко заточен", brand: "Tehnoles", pricePerMeter: 4.42, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
];

// Bread blades
export const BREAD_BLADES: BladeConfig[] = [
  { width: 10, thickness: 0.50, pitch: "Вълна", brand: "Tehnoles", pricePerMeter: 4.23, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 12, thickness: 0.45, pitch: "Вдлъбната вълна", brand: "Tehnoles", pricePerMeter: 5.09, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 },
];

// Textile/paper blades
export const TEXTILE_BLADES: BladeConfig[] = [
  { width: 10, thickness: 0.45, pitch: "—", brand: "Tehnoles", pricePerMeter: 2.09, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 15, thickness: 0.50, pitch: "—", brand: "Tehnoles", pricePerMeter: 1.53, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 20, thickness: 0.60, pitch: "—", brand: "Tehnoles", pricePerMeter: 1.64, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 25, thickness: 0.60, pitch: "—", brand: "Tehnoles", pricePerMeter: 1.84, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
  { width: 30, thickness: 0.70, pitch: "—", brand: "Tehnoles", pricePerMeter: 1.99, welding: 1.84, sharpening: 0, heatTreatment: 0, setting: 0 },
];

// BGN conversion rate (fixed)
export const BGN_RATE = 1.95583;
