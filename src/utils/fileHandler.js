// src/utils/fileHandler.js
import { execSync } from 'child_process';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import fetch from 'node-fetch';

const TMP = '/tmp/doc2cv';
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true });

export async function downloadAndSplitFiles(fileUrls) {
  const pages = [];

  for (const url of fileUrls) {
    const filename = basename(new URL(url).pathname) || 'file';
    const ext = extname(filename).toLowerCase();
    const localPath = join(TMP, filename);

    // Download file
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal download: ${url}`);
    const buffer = await res.arrayBuffer();
    const { writeFileSync } = await import('fs');
    writeFileSync(localPath, Buffer.from(buffer));

    if (ext === '.pdf') {
      // Split PDF jadi gambar per halaman (poppler)
      const outDir = join(TMP, filename.replace('.pdf', ''));
      mkdirSync(outDir, { recursive: true });
      execSync(`pdftoppm -jpeg -r 200 "${localPath}" "${join(outDir, 'page')}"`);
      const { readdirSync } = await import('fs');
      const imgFiles = readdirSync(outDir).filter(f => f.endsWith('.jpg')).sort();
      imgFiles.forEach((img, i) => {
        pages.push({ filename: img, localPath: join(outDir, img), sourceFile: filename, pageNum: i + 1 });
      });
    } else {
      // Gambar langsung
      pages.push({ filename, localPath, sourceFile: filename, pageNum: 1 });
    }
  }

  return pages;
}
