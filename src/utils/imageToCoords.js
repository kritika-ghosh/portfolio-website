/**
 * Loads an image, draws it to an offscreen canvas, samples dark pixels,
 * and returns a Float32Array of [x, y, 0, ...] coordinates in world space.
 *
 * @param {string} imageSrc  - URL / path of the logo image
 * @param {object} options
 * @param {number} options.sampleSize   - Resolution of the offscreen canvas (default 300)
 * @param {number} options.stride       - Sample every N pixels (default 3)
 * @param {number} options.threshold    - Pixels darker than this brightness (0-255) are kept (default 110)
 * @param {number} options.scale        - World-space scale for coordinates (default 2.8)
 * @param {number} options.maxPoints    - Maximum number of coordinate points (default 5000)
 * @returns {Promise<Float32Array>}
 */
export async function extractLogoCoords(imageSrc, options = {}) {
  const {
    sampleSize = 300,
    stride = 3,
    threshold = 110,
    scale = 2.8,
    maxPoints = 5000,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d');

      // White background so transparent regions count as "empty"
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sampleSize, sampleSize);

      // Draw the image centered and scaled, preserving aspect ratio
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW = sampleSize;
      let drawH = sampleSize;
      if (aspect > 1) {
        drawH = sampleSize / aspect;
      } else {
        drawW = sampleSize * aspect;
      }
      const offsetX = (sampleSize - drawW) / 2;
      const offsetY = (sampleSize - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

      const rawCoords = [];

      for (let py = 0; py < sampleSize; py += stride) {
        for (let px = 0; px < sampleSize; px += stride) {
          const idx = (py * sampleSize + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;

          if (brightness < threshold) {
            // Normalize pixel to [-1, 1], flip Y for WebGL convention
            const nx = ((px / sampleSize) - 0.5) * 2.0 * scale;
            const ny = -(((py / sampleSize) - 0.5) * 2.0 * scale);
            rawCoords.push(nx, ny, 0.0);
          }
        }
      }

      if (rawCoords.length === 0) {
        console.warn('[imageToCoords] No dark pixels found. Check threshold / image.');
        // Return a fallback cross pattern
        for (let i = -5; i <= 5; i++) {
          rawCoords.push(i * 0.4, 0, 0);
          rawCoords.push(0, i * 0.4, 0);
        }
      }

      const totalPoints = rawCoords.length / 3;

      if (totalPoints <= maxPoints) {
        resolve(new Float32Array(rawCoords));
        return;
      }

      // Random subsample down to maxPoints
      const indices = Array.from({ length: totalPoints }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      indices.splice(maxPoints);

      const result = new Float32Array(maxPoints * 3);
      indices.forEach((srcIdx, dstIdx) => {
        result[dstIdx * 3]     = rawCoords[srcIdx * 3];
        result[dstIdx * 3 + 1] = rawCoords[srcIdx * 3 + 1];
        result[dstIdx * 3 + 2] = rawCoords[srcIdx * 3 + 2];
      });
      resolve(result);
    };

    img.onerror = () => reject(new Error(`[imageToCoords] Failed to load image: ${imageSrc}`));
    img.src = imageSrc;
  });
}
