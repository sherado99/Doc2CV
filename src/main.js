// src/main.js – Doc2CV Actor Entry Point
import { Actor } from 'apify';
import { downloadAndSplitFiles } from './utils/fileHandler.js';
import { ocrFile } from './utils/ocr.js';
import { detectAndCropFace } from './utils/faceDetect.js';
import { classifyAndBuildTables } from './parsers/tableBuilder.js';
import { callProfileTransformer } from './utils/profileTransformer.js';
import { generateDOCX } from './reporters/docx.js';
import { generatePDF } from './reporters/pdf.js';
import { saveFileToKVS, saveCSVToKVS } from './reporters/storage.js';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
  files = [],
  language = 'ind',
  useProfileTransformer = true
} = input;

if (!files || files.length === 0) {
  await Actor.fail('Minimal 1 file harus di-upload.');
  await Actor.exit();
}

if (files.length > 10) {
  await Actor.fail('Maksimal 10 file per run.');
  await Actor.exit();
}

console.log(`[Doc2CV] Memproses ${files.length} file...`);

// Step 1: Download & split PDF jadi gambar per halaman
const pages = await downloadAndSplitFiles(files);
console.log(`[Doc2CV] Total halaman/gambar: ${pages.length}`);

// Step 2: OCR setiap halaman
const rawResults = [];
for (const page of pages) {
  console.log(`[OCR] Memproses: ${page.filename}`);
  const text = await ocrFile(page.localPath, language);
  rawResults.push({ filename: page.filename, sourceFile: page.sourceFile, text, page: page.pageNum });
}

// Step 3: Deteksi & crop pas foto
let pasFotoPath = null;
for (const page of pages) {
  const cropped = await detectAndCropFace(page.localPath);
  if (cropped) {
    pasFotoPath = cropped;
    console.log(`[FACE] Pas foto ditemukan di: ${page.filename}`);
    break;
  }
}

// Step 4: Klasifikasi dokumen & bangun tabel CSV per jenis
const { tables, structuredData } = await classifyAndBuildTables(rawResults);
console.log(`[TABLES] Jenis dokumen terdeteksi: ${Object.keys(tables).join(', ')}`);

// Step 5: Profile Transformer via Cloudflare Workers AI (opsional)
let profile = '';
if (useProfileTransformer) {
  console.log('[PROFILE] Memanggil Profile Transformer...');
  profile = await callProfileTransformer(structuredData);
  console.log(`[PROFILE] Profile: ${profile.substring(0, 100)}...`);
}

// Step 6: Generate DOCX & PDF
const docxBuffer = await generateDOCX(structuredData, profile, pasFotoPath);
const pdfBuffer  = await generatePDF(structuredData, profile, pasFotoPath);

// Step 7: Simpan output ke KVS
const docxUrl = await saveFileToKVS('CV_Output.docx', docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
const pdfUrl  = await saveFileToKVS('CV_Output.pdf',  pdfBuffer,  'application/pdf');

// Simpan CSV per jenis dokumen
const csvUrls = {};
for (const [type, csvContent] of Object.entries(tables)) {
  csvUrls[type] = await saveCSVToKVS(`${type}.csv`, csvContent);
}

// Step 8: Push output
await Actor.pushData({
  download_docx: docxUrl,
  download_pdf: pdfUrl,
  tables: csvUrls,
  profile: profile || '',
  pagesProcessed: pages.length,
  documentsDetected: Object.keys(tables)
});

console.log('[Doc2CV] Selesai!');
await Actor.exit();
