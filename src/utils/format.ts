/**
 * Formats an enum-like string by replacing underscores with spaces and capitalizing each word.
 * Example: 'pending_approval' -> 'Pending Approval'
 */
export const formatEnum = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Formats a 3D model filename or URL for display.
 * If it's a Firebase Storage URL, it extracts the filename.
 */
export const formatModelName = (nameOrUrl: string | undefined): string => {
  if (!nameOrUrl) return 'Upload GLB Model';
  if (!nameOrUrl.startsWith('http')) return nameOrUrl;
  
  try {
    // Extract filename from Firebase Storage URL
    // Format: .../o/products%2F3d%2Ffilename.glb?alt=media...
    const decoded = decodeURIComponent(nameOrUrl);
    const parts = decoded.split('/');
    const lastPart = parts[parts.length - 1];
    const filename = lastPart.split('?')[0];
    return filename || 'Model Attached';
  } catch (e) {
    return 'Model Attached';
  }
};
