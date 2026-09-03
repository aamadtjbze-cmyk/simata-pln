/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compress an image file in-browser (resize + re-encode as JPEG) before upload.
 * Keeps KTP photos small (typically 100-300KB) without a server round-trip.
 */
export async function compressImageToJpeg(
  file: File,
  maxDimension = 1280,
  quality = 0.75
): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  let { width, height } = imageBitmap;

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context tidak tersedia di browser ini.');
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengompres foto KTP.'));
      },
      'image/jpeg',
      quality
    );
  });
}
