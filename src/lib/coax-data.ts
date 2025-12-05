/**
 * Coaxial Cable Specifications Database
 * Loss values in dB per 100 meters at various frequencies
 */

export type CoaxCable = {
  id: string;
  name: string;
  impedance: number; // Ohms
  velocityFactor: number; // 0-1
  outerDiameter: number; // mm
  // Loss in dB per 100 meters at specific frequencies
  lossPerHundredMeters: {
    1: number;    // 1 MHz
    10: number;   // 10 MHz
    50: number;   // 50 MHz
    100: number;  // 100 MHz
    200: number;  // 200 MHz
    400: number;  // 400 MHz
    1000: number; // 1000 MHz
  };
};

export const COAX_CABLES: CoaxCable[] = [
  {
    id: "rg58",
    name: "RG-58",
    impedance: 50,
    velocityFactor: 0.66,
    outerDiameter: 4.95,
    lossPerHundredMeters: {
      1: 1.6,
      10: 5.2,
      50: 12.1,
      100: 17.7,
      200: 26.2,
      400: 39.4,
      1000: 68.9,
    },
  },
  {
    id: "rg8x",
    name: "RG-8X",
    impedance: 50,
    velocityFactor: 0.78,
    outerDiameter: 6.1,
    lossPerHundredMeters: {
      1: 1.3,
      10: 4.3,
      50: 9.8,
      100: 14.1,
      200: 20.7,
      400: 31.2,
      1000: 54.1,
    },
  },
  {
    id: "rg213",
    name: "RG-213",
    impedance: 50,
    velocityFactor: 0.66,
    outerDiameter: 10.3,
    lossPerHundredMeters: {
      1: 0.7,
      10: 2.3,
      50: 5.2,
      100: 7.5,
      200: 10.8,
      400: 16.1,
      1000: 28.5,
    },
  },
  {
    id: "rg8",
    name: "RG-8/U",
    impedance: 50,
    velocityFactor: 0.66,
    outerDiameter: 10.3,
    lossPerHundredMeters: {
      1: 0.7,
      10: 2.3,
      50: 5.6,
      100: 8.2,
      200: 12.1,
      400: 18.0,
      1000: 31.8,
    },
  },
  {
    id: "lmr240",
    name: "LMR-240",
    impedance: 50,
    velocityFactor: 0.84,
    outerDiameter: 6.1,
    lossPerHundredMeters: {
      1: 1.0,
      10: 3.3,
      50: 7.2,
      100: 10.2,
      200: 14.8,
      400: 21.7,
      1000: 36.7,
    },
  },
  {
    id: "lmr400",
    name: "LMR-400",
    impedance: 50,
    velocityFactor: 0.85,
    outerDiameter: 10.3,
    lossPerHundredMeters: {
      1: 0.5,
      10: 1.5,
      50: 3.6,
      100: 5.2,
      200: 7.5,
      400: 10.8,
      1000: 18.0,
    },
  },
  {
    id: "lmr600",
    name: "LMR-600",
    impedance: 50,
    velocityFactor: 0.87,
    outerDiameter: 15.0,
    lossPerHundredMeters: {
      1: 0.3,
      10: 1.0,
      50: 2.3,
      100: 3.3,
      200: 4.9,
      400: 7.2,
      1000: 12.1,
    },
  },
  {
    id: "aircell7",
    name: "Aircell 7",
    impedance: 50,
    velocityFactor: 0.85,
    outerDiameter: 7.3,
    lossPerHundredMeters: {
      1: 0.8,
      10: 2.6,
      50: 5.9,
      100: 8.5,
      200: 12.5,
      400: 18.4,
      1000: 31.5,
    },
  },
  {
    id: "ecoflex10",
    name: "Ecoflex 10",
    impedance: 50,
    velocityFactor: 0.86,
    outerDiameter: 10.2,
    lossPerHundredMeters: {
      1: 0.5,
      10: 1.6,
      50: 3.8,
      100: 5.5,
      200: 8.1,
      400: 11.8,
      1000: 20.0,
    },
  },
  {
    id: "ecoflex15",
    name: "Ecoflex 15",
    impedance: 50,
    velocityFactor: 0.86,
    outerDiameter: 14.6,
    lossPerHundredMeters: {
      1: 0.3,
      10: 1.1,
      50: 2.5,
      100: 3.6,
      200: 5.3,
      400: 7.8,
      1000: 13.5,
    },
  },
  {
    id: "rg174",
    name: "RG-174",
    impedance: 50,
    velocityFactor: 0.66,
    outerDiameter: 2.8,
    lossPerHundredMeters: {
      1: 3.3,
      10: 10.5,
      50: 24.6,
      100: 36.1,
      200: 55.1,
      400: 85.3,
      1000: 154.2,
    },
  },
  {
    id: "rg59",
    name: "RG-59 (75Ω)",
    impedance: 75,
    velocityFactor: 0.66,
    outerDiameter: 6.1,
    lossPerHundredMeters: {
      1: 1.3,
      10: 4.3,
      50: 9.8,
      100: 14.1,
      200: 20.7,
      400: 31.2,
      1000: 54.1,
    },
  },
  {
    id: "rg6",
    name: "RG-6 (75Ω)",
    impedance: 75,
    velocityFactor: 0.83,
    outerDiameter: 6.9,
    lossPerHundredMeters: {
      1: 0.7,
      10: 2.0,
      50: 4.6,
      100: 6.6,
      200: 9.5,
      400: 13.8,
      1000: 23.0,
    },
  },
];

// Reference frequencies for display
export const REFERENCE_FREQUENCIES = [
  { mhz: 1, label: "1 MHz" },
  { mhz: 3.5, label: "3.5 MHz (80m)" },
  { mhz: 7, label: "7 MHz (40m)" },
  { mhz: 14, label: "14 MHz (20m)" },
  { mhz: 21, label: "21 MHz (15m)" },
  { mhz: 28, label: "28 MHz (10m)" },
  { mhz: 50, label: "50 MHz (6m)" },
  { mhz: 144, label: "144 MHz (2m)" },
  { mhz: 432, label: "432 MHz (70cm)" },
  { mhz: 1296, label: "1296 MHz (23cm)" },
];

/**
 * Calculate cable loss using interpolation
 * @param cable The cable type
 * @param frequencyMhz Frequency in MHz
 * @param lengthMeters Cable length in meters
 * @returns Loss in dB
 */
export function calculateCableLoss(
  cable: CoaxCable,
  frequencyMhz: number,
  lengthMeters: number
): number {
  const lossData = cable.lossPerHundredMeters;
  const frequencies = [1, 10, 50, 100, 200, 400, 1000];

  // Find surrounding frequencies for interpolation
  let lowerFreq = 1;
  let upperFreq = 1000;

  for (let i = 0; i < frequencies.length - 1; i++) {
    if (frequencyMhz >= frequencies[i] && frequencyMhz <= frequencies[i + 1]) {
      lowerFreq = frequencies[i];
      upperFreq = frequencies[i + 1];
      break;
    }
  }

  if (frequencyMhz <= 1) {
    lowerFreq = 1;
    upperFreq = 1;
  } else if (frequencyMhz >= 1000) {
    lowerFreq = 1000;
    upperFreq = 1000;
  }

  const lowerLoss = lossData[lowerFreq as keyof typeof lossData];
  const upperLoss = lossData[upperFreq as keyof typeof lossData];

  // Logarithmic interpolation (cable loss follows sqrt of frequency approximately)
  let lossPer100m: number;
  if (lowerFreq === upperFreq) {
    lossPer100m = lowerLoss;
  } else {
    const logFreq = Math.log10(frequencyMhz);
    const logLower = Math.log10(lowerFreq);
    const logUpper = Math.log10(upperFreq);
    const ratio = (logFreq - logLower) / (logUpper - logLower);
    lossPer100m = lowerLoss + ratio * (upperLoss - lowerLoss);
  }

  // Scale to actual length
  return (lossPer100m * lengthMeters) / 100;
}

/**
 * Get cable by ID
 */
export function getCableById(id: string): CoaxCable | undefined {
  return COAX_CABLES.find((c) => c.id === id);
}
