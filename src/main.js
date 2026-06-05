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
  await Actor.fail('At least 1 file is required.');
  await Actor.exit();
}

if (files.length > 10) {
  await Actor.fail('Maximum 10 files per run.');
  await Actor.exit();
}

console.log(`[Doc2CV] Processing ${files.length} file(s)...`);

// Step 1: Download files and split PDFs into per-page images
const pages = await downloadAndSplitFiles(files);
console.log(`[Doc2CV] Total pages/images: ${pages.length}`);

// Step 2: OCR each page
const rawResults = [];
for (const page of pages) {
  console.log(`[OCR] Processing: ${page.filename}`);
  const text = await ocrFile(page.localPath, language);
  rawResults.push({ filename: page.filename, sourceFile: page.sourceFile, text, page: page.pageNum });
}

// Step 3: Detect and crop profile photo
let profilePhotoPath = null;
for (const page of pages) {
  const cropped = await detectAndCropFace(page.localPath);
  if (cropped) {
    profilePhotoPath = cropped;
    console.log(`[FACE] Profile photo found in: ${page.filename}`);
    break;
  }
}

// Step 4: Classify documents and build per-type CSV tables
const { tables, structuredData } = await classifyAndBuildTables(rawResults);
console.log(`[TABLES] Document types detected: ${Object.keys(tables).join(', ')}`);

// Step 5: Profile Transformer via Cloudflare Workers AI (optional)
let profile = '';
if (useProfileTransformer) {
  console.log('[PROFILE] Calling Profile Transformer...');
  profile = await callProfileTransformer(structuredData);
  console.log(`[PROFILE] Generated: ${profile.substring(0, 100)}...`);
}

// Step 6: Generate DOCX and PDF
const docxBuffer = await generateDOCX(structuredData, profile, profilePhotoPath);
const pdfBuffer  = await generatePDF(structuredData, profile, profilePhotoPath);

// Step 7: Save output to Apify Key-Value Store
const docxUrl = await saveFileToKVS('CV_Output.docx', docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
const pdfUrl  = await saveFileToKVS('CV_Output.pdf',  pdfBuffer,  'application/pdf');

// Save per-type CSV tables
const csvUrls = {};
for (const [type, csvContent] of Object.entries(tables)) {
  csvUrls[type] = await saveCSVToKVS(`${type}.csv`, csvContent);
}

// Step 8: Push output dataset
await Actor.pushData({
  download_docx: docxUrl,
  download_pdf: pdfUrl,
  tables: csvUrls,
  profile: profile || '',
  pagesProcessed: pages.length,
  documentsDetected: Object.keys(tables)
});

console.log('[Doc2CV] Done.');
await Actor.exit();
