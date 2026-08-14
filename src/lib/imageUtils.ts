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

/** File types the Blueprint vault accepts. */
export function detectFileType(file: File): 'image' | 'pdf' {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name) ? 'pdf' : 'image';
}

/**
 * Thumbnail for a PDF.
 *
 * Rendering page 1 would mean pulling in pdf.js (~1 MB plus a worker), which is
 * a lot of weight for a grid tile in an app that must work offline. Instead we
 * draw a legible card in the project's own palette: sheet, folded corner, the
 * file name and a PDF badge. The real document opens full-size on click.
 */
export function generatePdfThumbnail(fileName: string): string {
  const W = 300;
  const H = 300;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background — matches --bg-app so tiles sit flat in the grid.
  ctx.fillStyle = '#f4eee2';
  ctx.fillRect(0, 0, W, H);

  // Sheet with a folded corner.
  const x = 90;
  const y = 58;
  const w = 120;
  const h = 150;
  const fold = 30;

  ctx.fillStyle = '#fbf7ef';
  ctx.strokeStyle = '#d8c9b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - fold, y);
  ctx.lineTo(x + w - fold, y + fold);
  ctx.lineTo(x + w, y + fold);
  ctx.strokeStyle = '#d8c9b0';
  ctx.stroke();

  // Suggested drawing lines — reads as a technical document, not a text file.
  ctx.strokeStyle = '#e3d8c4';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const ly = y + fold + 22 + i * 16;
    ctx.beginPath();
    ctx.moveTo(x + 16, ly);
    ctx.lineTo(x + w - (i % 2 === 0 ? 20 : 42), ly);
    ctx.stroke();
  }

  // PDF badge. roundRect is recent; fall back to a plain rect if it is missing.
  ctx.fillStyle = '#B4552F';
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x + 14, y + h - 34, 48, 22, 5);
    ctx.fill();
  } else {
    ctx.fillRect(x + 14, y + h - 34, 48, 22);
  }
  ctx.fillStyle = '#FBF1EA';
  ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PDF', x + 38, y + h - 18);

  // File name, truncated to fit.
  const label = fileName.replace(/\.pdf$/i, '');
  ctx.fillStyle = '#6B5E49';
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  const maxWidth = W - 32;
  let text = label;
  while (ctx.measureText(text).width > maxWidth && text.length > 4) {
    text = text.slice(0, -1);
  }
  ctx.fillText(text === label ? text : `${text}\u2026`, W / 2, y + h + 32);

  return canvas.toDataURL('image/jpeg', 0.85);
}
