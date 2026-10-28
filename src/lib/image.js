/**
 * Compresses an image in the browser and converts it to WebP (food photos must be under 2 MB).
 * Falls back to the original file as a data URL where canvas is unavailable (e.g. tests).
 * @param {File} file
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function compressImage(file, { maxWidth = 1600, quality = 0.82 } = {}) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/webp',
        quality,
      ),
    );
    return { blob, dataUrl: await readAsDataUrl(blob) };
  } catch {
    return { blob: file, dataUrl: await readAsDataUrl(file) };
  }
}

export function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
