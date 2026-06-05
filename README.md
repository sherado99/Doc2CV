# Doc2CV – Dokumen ke CV Otomatis

> "Dari tumpukan berkas ke CV siap unduh, tanpa mengetik satu huruf pun."

## Cara Kerja

1. **Input** — Upload hingga 10 file (PDF/JPG/PNG): ijazah, transkrip, KTP, sertifikat, pas foto, dll.
2. **OCR** — Tesseract mengekstrak teks dari setiap halaman/file
3. **Deteksi Tabel** — Tabel (misal transkrip nilai) dikenali dan disimpan sebagai CSV per jenis dokumen
4. **Pas Foto** — Wajah dideteksi otomatis dari KTP/foto dan di-crop
5. **Profile Transformer** — (Opsional) Cloudflare Workers AI merangkum data menjadi narasi profesional di kolom `profile`
6. **Output** — CV lengkap dalam format DOCX & PDF + tabel CSV per jenis dokumen

## Input

| Field | Tipe | Keterangan |
|---|---|---|
| `files` | array (maks 10) | URL publik file PDF/gambar |
| `language` | string | `ind` (default) atau `eng` |
| `useProfileTransformer` | boolean | Aktifkan LLM untuk kolom Profile |

## Output

- **DOCX** — CV siap kirim dengan pas foto, data diri, pendidikan, sertifikasi, skill, profile
- **PDF** — Sama seperti DOCX
- **CSV per jenis** — `ktp.csv`, `ijazah.csv`, `transkrip.csv`, `sertifikat.csv`, dll.

## Harga

- $3.00 / run (±1 CU Apify)
- LLM: Cloudflare Workers AI (gratis ~14 CV/hari)

## Stack

- Node.js 20 + Apify SDK v3
- Tesseract OCR (bahasa: Indonesia + Inggris)
- `docx` + `pdfkit` untuk generate output
- Cloudflare Workers AI (Llama 3 8B) via `stech-api`
