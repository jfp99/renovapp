/**
 * Generate a thumbnail from an image by resizing it to max 300px wide
 * Returns a base64 data URL
 */
export async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas at max 300px width, maintain aspect ratio
        const maxWidth = 300;
        const ratio = maxWidth / img.width;
        const height = img.height * ratio;

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, maxWidth, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert file to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get base filename without extension
 */
export function getBaseFilename(filename: string): string {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}
