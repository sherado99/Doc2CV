# Doc2CV – Document to CV Converter

> "From a pile of documents to a ready-to-download CV, without typing a single word."

## How It Works

1. **Input** — Upload up to 10 files (PDF/JPG/PNG): diploma, transcript, ID card, certificates, profile photo, etc.
2. **OCR** — Tesseract extracts raw text from each page or image
3. **Table Detection** — Tables (e.g. academic transcripts) are identified and exported as per-type CSV files
4. **Profile Photo** — Face/portrait region is detected and cropped automatically
5. **Profile Transformer** — *(Optional)* Cloudflare Workers AI (Llama 3.3 70B) reads all extracted data and writes a concise professional profile paragraph
6. **Output** — Full CV in DOCX and PDF format + per-type CSV tables, all available as public download links

## Input

| Field | Type | Description |
|---|---|---|
| `files` | array (max 10) | Public URLs of PDF or image files |
| `language` | string | `ind` (default) or `eng` |
| `useProfileTransformer` | boolean | Enable LLM profile summary |

## Output

| Field | Description |
|---|---|
| `download_docx` | CV in DOCX format |
| `download_pdf` | CV in PDF format |
| `tables` | Object mapping document type to CSV download URL |
| `profile` | LLM-generated professional profile |
| `pagesProcessed` | Number of pages processed |
| `documentsDetected` | List of detected document types |

## Document Types

| Key | Detected from |
|---|---|
| `id_card` | NIK, KTP keywords |
| `diploma` | Ijazah, graduation keywords |
| `transcript` | Grades, credits, GPA keywords |
| `certificate` | Certificate, awarded keywords |
| `other` | Fallback |

## Stack

- Node.js 20 + Apify SDK v3
- Tesseract OCR (Indonesian + English)
- `docx` + `pdfkit` for output generation
- `papaparse` for CSV serialisation
- Cloudflare Workers AI (Llama 3.3 70B) via `stech-api`

## Pricing

- $3.00 / run (~1 Apify CU)
- LLM: free up to ~10,000 neurons/day via Cloudflare Workers AI
