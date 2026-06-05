// src/utils/fileHandler.js
import { execSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, readdirSync } from 'fs';
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

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download: ${url}`);
    writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));

    if (ext === '.pdf') {
      const outDir = join(TMP, filename.replace('.pdf', ''));
      mkdirSync(outDir, { recursive: true });
      execSync(`pdftoppm -jpeg -r 200 "${localPath}" "${join(outDir, 'page')}"`);
      readdirSync(outDir).filter(f => f.endsWith('.jpg')).sort().forEach((img, i) => {
        pages.push({ filename: img, localPath: join(outDir, img), sourceFile: filename, pageNum: i + 1 });
      });
    } else {
      pages.push({ filename, localPath, sourceFile: filename, pageNum: 1 });
    }
  }
  return pages;
}
