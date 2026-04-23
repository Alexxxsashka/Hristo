/**
 * Formats a technical string (like category_id or attribute_name) for display.
 * Replaces underscores with spaces and capitalizes each word.
 * Example: 'airsoft_rifles' -> 'Airsoft Rifles'
 */
export const formatLabel = (text: string): string => {
  if (!text) return '';
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatSKU = (sku: string): string => {
  if (!sku) return 'N/A';
  // SKUs often have underscores but maybe they should be clean for display if requested
  // However, usually SKUs are technical. Let's keep them technical but clean them if they look like snake_case words.
  return sku;
};
