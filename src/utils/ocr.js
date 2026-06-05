// src/utils/ocr.js
import tesseract from 'node-tesseract-ocr';

const config = {
  lang: 'ind+eng',
  oem: 1,
  psm: 3,
};

export async function ocrFile(imagePath, language = 'ind') {
  try {
    const cfg = { ...config, lang: language === 'eng' ? 'eng' : 'ind+eng' };
    const text = await tesseract.recognize(imagePath, cfg);
    return text.trim();
  } catch (err) {
    console.warn(`[OCR] Gagal memproses ${imagePath}: ${err.message}`);
    return '';
  }
}
