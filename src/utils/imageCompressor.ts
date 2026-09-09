/**
 * DEVER Image Compressor Utility
 * High-performance client-side image compression using HTML5 Canvas & WebP/JPEG encoding.
 * Eliminates large payload overhead and ensures fast uploads to Cloudflare R2.
 */

export interface CompressImageOptions {
  /**
   * Maximum file size in MB. Default: 1.0 MB
   */
  maxSizeMB?: number;
  /**
   * Maximum width or height in pixels. Default: 1920px
   */
  maxWidthOrHeight?: number;
  /**
   * Compression quality (0.0 to 1.0). Default: 0.82
   */
  quality?: number;
  /**
   * Preferred output MIME type. Default: 'image/webp'
   */
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Checks whether the browser supports WebP encoding via canvas.
 */
function isWebPSupported(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Loads a File/Blob into an HTMLImageElement safely.
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể giải mã tệp hình ảnh.'));
    };

    img.src = url;
  });
}

/**
 * Compresses an image File or Blob in the browser.
 * - Scales down dimensions proportionally if exceeding maxWidthOrHeight
 * - Encodes as WebP (or JPEG if WebP is unsupported)
 * - Iteratively adjusts quality if file size exceeds target maxSizeMB
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  if (typeof window === 'undefined') {
    return file; // Server-side safety guard
  }

  // Bypass non-image files
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Preserve vector SVGs and animated GIFs
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const {
    maxSizeMB = 1.0,
    maxWidthOrHeight = 1920,
    quality = 0.82,
    mimeType = isWebPSupported() ? 'image/webp' : 'image/jpeg',
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  try {
    const img = await loadImage(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    // If file is already small enough and dimensions are within bounds, skip re-encoding
    if (file.size <= maxSizeBytes && origWidth <= maxWidthOrHeight && origHeight <= maxWidthOrHeight) {
      return file;
    }

    // Calculate proportional dimensions
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (origWidth > origHeight) {
      if (origWidth > maxWidthOrHeight) {
        targetWidth = maxWidthOrHeight;
        targetHeight = Math.round((origHeight * maxWidthOrHeight) / origWidth);
      }
    } else {
      if (origHeight > maxWidthOrHeight) {
        targetHeight = maxWidthOrHeight;
        targetWidth = Math.round((origWidth * maxWidthOrHeight) / origHeight);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: mimeType !== 'image/jpeg' });

    if (!ctx) {
      return file;
    }

    // If exporting to JPEG, draw solid white background for transparent areas
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // High quality canvas rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Encode to Blob with quality adjustment
    let currentQuality = quality;
    let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mimeType, currentQuality));

    // Multi-pass adjustment if still exceeding maxSizeBytes
    let attempts = 0;
    while (blob && blob.size > maxSizeBytes && currentQuality > 0.4 && attempts < 3) {
      attempts++;
      currentQuality -= 0.15;
      blob = await new Promise((res) => canvas.toBlob(res, mimeType, currentQuality));
    }

    if (!blob) {
      return file;
    }

    // Build new File object with appropriate extension
    const ext = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/jpeg' ? '.jpg' : '.png';
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const newFileName = `${cleanBaseName}${ext}`;

    return new File([blob], newFileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Image compression fallback to original file:', error);
    return file;
  }
}

export default compressImage;
