// src/utils/faceDetect.js
// Heuristic face/photo detection using Jimp (no native OpenCV required).
// Crops the portrait region based on image dimensions or KTP layout assumptions.
import Jimp from 'jimp';
import { join, basename } from 'path';

const TMP = '/tmp/doc2cv';

export async function detectAndCropFace(imagePath) {
  try {
    const img = await Jimp.read(imagePath);
    const { width, height } = img.bitmap;
    let cropX, cropY, cropW, cropH;

    if (height > width && width < 600) {
      // Likely a standalone portrait — use full image
      cropX = 0; cropY = 0; cropW = width; cropH = height;
    } else {
      // Assume KTP layout: photo is on the left, ~28% of width
      cropW = Math.floor(width * 0.28);
      cropH = Math.floor(cropW * 1.35);
      cropX = Math.floor(width * 0.03);
      cropY = Math.floor(height * 0.15);
    }

    const outPath = join(TMP, `photo_${basename(imagePath)}.png`);
    await img.crop(cropX, cropY, cropW, cropH).writeAsync(outPath);
    return outPath;
  } catch (err) {
    console.warn(`[FACE] Detection failed: ${err.message}`);
    return null;
  }
}
