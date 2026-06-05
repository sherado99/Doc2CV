// src/main.js – Doc2CV Actor Entry Point
import { Actor } from 'apify';
import crypto from 'crypto';
import { downloadAndSplitFiles } from './utils/fileHandler.js';
import { ocrFile } from './utils/ocr.js';
import { detectAndCropFace } from './utils/faceDetect.js';
import { classifyAndBuildTables } from './parsers/tableBuilder.js';
import { callProfileTransformer } from './utils/profileTransformer.js';
import { generateDOCX } from './reporters/docx.js';
import { generatePDF } from './reporters/pdf.js';
import { saveFileToKVS, saveCSVToKVS } from './reporters/storage.js';

await Actor.init();

// ========== INPUT ==========

const input = await Actor.getInput();
const {
  files = [],
  language = 'ind',
  useProfileTransformer = true,
  timeout = 60,
} = input;

if (!files || files.length === 0) {
  await Actor.fail('At least 1 file URL is required.');
  await Actor.exit();
}

if (files.length > 10) {
  await Actor.fail('Maximum 10 files per run.');
  await Actor.exit();
}

console.log(`[Doc2CV] Processing ${files.length} file(s)...`);

// ========== STEP 1: DOWNLOAD & SPLIT ==========

const pages = await downloadAndSplitFiles(files);
console.log(`[Doc2CV] Total pages/images to OCR: ${pages.length}`);

// ========== STEP 2: OCR EACH PAGE ==========

const rawResults = [];
for (const page of pages) {
  console.log(`[OCR] Processing: ${page.filename}`);
  const text = await ocrFile(page.localPath, language);
  rawResults.push({
    filename: page.filename,
    sourceFile: page.sourceFile,
    text,
    page: page.pageNum,
  });
}

// ========== STEP 3: DETECT & CROP PROFILE PHOTO ==========

let profilePhotoPath = null;
for (const page of pages) {
  const cropped = await detectAndCropFace(page.localPath);
  if (cropped) {
    profilePhotoPath = cropped;
    console.log(`[FACE] Profile photo found in: ${page.filename}`);
    break;
  }
}

// ========== STEP 4: CLASSIFY & BUILD CSV TABLES ==========

const { tables, structuredData } = await classifyAndBuildTables(rawResults);
console.log(`[TABLES] Document types detected: ${Object.keys(tables).join(', ') || 'none'}`);

// ========== STEP 5: PROFILE TRANSFORMER (optional) ==========

let profile = '';
if (useProfileTransformer) {
  console.log('[PROFILE] Calling Profile Transformer via stech-api...');
  profile = await callProfileTransformer(structuredData, timeout);
  if (profile) {
    console.log(`[PROFILE] Generated (${profile.length} chars).`);
  } else {
    console.log('[PROFILE] No profile returned (API may have failed or returned empty).');
  }
}

// ========== STEP 6: GENERATE DOCX & PDF ==========

const docxBuffer = await generateDOCX(structuredData, profile, profilePhotoPath);
const pdfBuffer  = await generatePDF(structuredData, profile, profilePhotoPath);

// ========== STEP 7: SAVE TO KEY-VALUE STORE ==========

const docxUrl = await saveFileToKVS(
  'CV_Output.docx',
  docxBuffer,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
);
const pdfUrl = await saveFileToKVS('CV_Output.pdf', pdfBuffer, 'application/pdf');

const csvUrls = {};
for (const [type, csvContent] of Object.entries(tables)) {
  csvUrls[type] = await saveCSVToKVS(`${type}.csv`, csvContent);
}

// ========== STEP 8: AUDIT HASH & OUTPUT ==========

const timestamp = new Date().toISOString();
const allText  = rawResults.map(r => r.text).join('|');
const auditHash = crypto.createHash('sha256').update(`${allText}|${timestamp}`).digest('hex');

await Actor.pushData({
  download_docx:      docxUrl,
  download_pdf:       pdfUrl,
  tables:             csvUrls,
  profile:            profile || '',
  pagesProcessed:     pages.length,
  documentsDetected:  Object.keys(tables),
  status:             'success',
  timestamp,
  auditHash,
});

console.log(`[Doc2CV] Done. ${pages.length} pages processed. Audit hash: ${auditHash.substring(0, 16)}...`);
await Actor.exit();
