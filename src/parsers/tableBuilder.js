// src/parsers/tableBuilder.js
import Papa from 'papaparse';

// Keyword sets for classifying document types from OCR text
const DOC_PATTERNS = {
  id_card:     ['nik', 'kartu tanda penduduk', 'tempat lahir', 'jenis kelamin', 'kewarganegaraan', 'golongan darah'],
  diploma:     ['ijazah', 'diploma', 'dinyatakan lulus', 'telah menyelesaikan', 'gelar', 'sarjana', 'madrasah', 'sekolah'],
  transcript:  ['transkrip', 'nilai', 'mata kuliah', 'sks', 'ipk', 'ip kumulatif', 'grade', 'kredit'],
  certificate: ['sertifikat', 'certificate', 'diberikan kepada', 'awarded to', 'telah mengikuti', 'has completed'],
  photo:       ['pas foto', 'photo']
};

function classifyDocument(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(DOC_PATTERNS)) {
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return 'other';
}

function extractIdCardData(text) {
  const rows = [];
  const fields = ['NIK', 'Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Alamat', 'RT/RW', 'Kelurahan', 'Kecamatan', 'Agama', 'Status Perkawinan', 'Pekerjaan', 'Kewarganegaraan'];
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    for (const field of fields) {
      if (line.toLowerCase().includes(field.toLowerCase())) {
        const value = line.split(/[:：]/)[1]?.trim() || line.replace(new RegExp(field, 'i'), '').trim();
        if (value) rows.push({ Field: field, Value: value });
      }
    }
  }
  return rows;
}

function extractTranscriptData(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).reduce((rows, line) => {
    const match = line.match(/^(.+?)\s+([A-E][+-]?|\d{1,3})\s+(\d{1,2})$/);
    if (match) rows.push({ Course: match[1].trim(), Grade: match[2], Credits: match[3] });
    return rows;
  }, []);
}

function extractGenericData(text, type) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).reduce((rows, line) => {
    const parts = line.split(/[:：]/);
    if (parts.length >= 2) rows.push({ Field: parts[0].trim(), Value: parts.slice(1).join(':').trim() });
    else if (line.length > 3 && line.length < 200) rows.push({ Field: type, Value: line });
    return rows;
  }, []);
}

function extractStructuredData(type, text) {
  if (type === 'id_card') return extractIdCardData(text);
  if (type === 'transcript') return extractTranscriptData(text);
  return extractGenericData(text, type);
}

export function classifyAndBuildTables(rawResults) {
  const grouped = {};
  const structuredData = { name: '', nik: '', dob: '', address: '', education: [], certifications: [], skills: [], courses: [], gpa: '', other: [] };

  for (const { filename, text } of rawResults) {
    if (!text) continue;
    const type = classifyDocument(text);
    (grouped[type] = grouped[type] || []).push({ filename, text });
  }

  const tables = {};
  for (const [type, docs] of Object.entries(grouped)) {
    const rows = [];
    for (const doc of docs) {
      const extracted = extractStructuredData(type, doc.text);
      rows.push(...extracted);

      if (type === 'id_card') {
        for (const row of extracted) {
          const f = row.Field?.toLowerCase() || '';
          if (f.includes('nama')) structuredData.name = row.Value;
          if (f.includes('nik')) structuredData.nik = row.Value;
          if (f.includes('tempat') || f.includes('tanggal')) structuredData.dob += (structuredData.dob ? ' ' : '') + row.Value;
          if (f.includes('alamat')) structuredData.address = row.Value;
        }
      }
      if (type === 'diploma') structuredData.education.push({ source: doc.filename, detail: doc.text.substring(0, 500) });
      if (type === 'transcript') {
        for (const row of extracted) {
          if (row.Course) structuredData.courses.push(row);
          if (row.Field?.toLowerCase().match(/ipk|gpa/)) structuredData.gpa = row.Value;
        }
      }
      if (type === 'certificate') structuredData.certifications.push({ source: doc.filename, detail: doc.text.substring(0, 300) });
    }
    if (rows.length > 0) tables[type] = Papa.unparse(rows);
  }

  return { tables, structuredData };
}
