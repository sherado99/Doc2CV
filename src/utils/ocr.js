// src/utils/ocr.js
import tesseract from 'node-tesseract-ocr';

const baseConfig = { lang: 'ind+eng', oem: 1, psm: 3 };

export async function ocrFile(imagePath, language = 'ind') {
  try {
    const config = { ...baseConfig, lang: language === 'eng' ? 'eng' : 'ind+eng' };
    const text = await tesseract.recognize(imagePath, config);
    return text.trim();
  } catch (err) {
    console.warn(`[OCR] Failed to process ${imagePath}: ${err.message}`);
    return '';
  }
}
