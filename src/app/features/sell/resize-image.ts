/**
 * Downscales a photo to `maxSize` px on its longest side and re-encodes it as
 * JPEG, like the app does (1920px @ 80%). Falls back to the original file
 * where canvas/createImageBitmap aren't available (SSR, old browsers).
 */
export async function resizeImage(file: Blob, maxSize: number, quality: number): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality),
  );
}
