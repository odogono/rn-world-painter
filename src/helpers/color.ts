// Convert hex to RGB
export const hexToRGB = (hex: string): { r: number; g: number; b: number } => {
  // Remove # if present
  const cleanHex = hex.charAt(0) === '#' ? hex.substring(1) : hex;

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b };
};

// Calculate relative luminance
export const getLuminance = (r: number, g: number, b: number): number => {
  // Convert RGB values to sRGB
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;

  // Convert to linear RGB
  const getRGB = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = getRGB(sR);
  const gLinear = getRGB(sG);
  const bLinear = getRGB(sB);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Get contrasting color (black or white)
export const getContrastColor = (backgroundColor: string): string => {
  const { r, g, b } = hexToRGB(backgroundColor);
  const luminance = getLuminance(r, g, b);

  // Using WCAG contrast ratio threshold
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
};
