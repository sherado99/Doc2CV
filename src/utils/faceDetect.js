// src/utils/faceDetect.js
// Deteksi wajah sederhana: cari region persegi panjang dominan (potret)
// Menggunakan Jimp untuk cropping tanpa OpenCV (kompatibel di Apify)
import Jimp from 'jimp';
import { join, basename } from 'path';
import { existsSync } from 'fs';

const TMP = '/tmp/doc2cv';

export async function detectAndCropFace(imagePath) {
  try {
    const img = await Jimp.read(imagePath);
    const { width, height } = img.bitmap;

    // Heuristik: pas foto biasanya portrait, rasio 3:4, di area tertentu
    // Kita coba crop region kanan atas (KTP) atau tengah (foto langsung)
    const isPortrait = height > width;

    let cropX, cropY, cropW, cropH;

    if (isPortrait && width < 600) {
      // Kemungkinan ini sudah foto portrait/pas foto langsung
      cropX = 0; cropY = 0; cropW = width; cropH = height;
    } else {
      // Asumsi KTP: pas foto ada di kiri, sekitar 30% lebar
      cropW = Math.floor(width * 0.28);
      cropH = Math.floor(cropW * 1.35);
      cropX = Math.floor(width * 0.03);
      cropY = Math.floor(height * 0.15);
    }

    const outPath = join(TMP, `pas_foto_${basename(imagePath)}.png`);
    await img.crop(cropX, cropY, cropW, cropH).writeAsync(outPath);
    return outPath;
  } catch (err) {
    console.warn(`[FACE] Gagal deteksi wajah: ${err.message}`);
    return null;
  }
}
