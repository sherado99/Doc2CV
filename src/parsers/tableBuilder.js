// src/parsers/tableBuilder.js
import Papa from 'papaparse';

// Kata kunci untuk klasifikasi jenis dokumen
const DOC_PATTERNS = {
  ktp: ['nik', 'kartu tanda penduduk', 'tempat lahir', 'jenis kelamin', 'kewarganegaraan', 'golongan darah'],
  ijazah: ['ijazah', 'diploma', 'dinyatakan lulus', 'telah menyelesaikan', 'gelar', 'sarjana', 'madrasah', 'sekolah'],
  transkrip: ['transkrip', 'nilai', 'mata kuliah', 'sks', 'ipk', 'ip kumulatif', 'grade', 'kredit'],
  sertifikat: ['sertifikat', 'certificate', 'diberikan kepada', 'awarded to', 'telah mengikuti', 'has completed'],
  foto: ['pas foto', 'photo', 'foto']
};

function classifyDocument(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(DOC_PATTERNS)) {
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return 'lainnya';
}

function extractKTPData(text) {
  const rows = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fields = ['NIK', 'Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Alamat', 'RT/RW', 'Kelurahan', 'Kecamatan', 'Agama', 'Status Perkawinan', 'Pekerjaan', 'Kewarganegaraan'];
  
  for (const line of lines) {
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
  const rows = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Cari baris yang mengandung pola: [nama matkul] [nilai/huruf] [sks]
    const match = line.match(/^(.+?)\s+([A-E][+-]?|\d{1,3})\s+(\d{1,2})$/);
    if (match) {
      rows.push({ 'Mata Kuliah': match[1].trim(), 'Nilai': match[2], 'SKS': match[3] });
    }
  }
  return rows;
}

function extractGenericData(text, type) {
  const rows = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach(line => {
    const parts = line.split(/[:：]/);
    if (parts.length >= 2) {
      rows.push({ Field: parts[0].trim(), Value: parts.slice(1).join(':').trim() });
    } else if (line.length > 3 && line.length < 200) {
      rows.push({ Field: type, Value: line });
    }
  });
  return rows;
}

function extractStructuredData(type, text) {
  switch (type) {
    case 'ktp': return extractKTPData(text);
    case 'transkrip': return extractTranscriptData(text);
    default: return extractGenericData(text, type);
  }
}

export function classifyAndBuildTables(rawResults) {
  const grouped = {};
  const structuredData = {
    nama: '', nik: '', ttl: '', alamat: '', pendidikan: [], sertifikasi: [], 
    skill: [], mataKuliah: [], ipk: '', dokumenLain: []
  };

  for (const { filename, text, sourceFile } of rawResults) {
    if (!text) continue;
    const type = classifyDocument(text);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push({ filename, text });
  }

  const tables = {};
  for (const [type, docs] of Object.entries(grouped)) {
    const rows = [];
    for (const doc of docs) {
      const extracted = extractStructuredData(type, doc.text);
      rows.push(...extracted);

      // Isi structuredData untuk CV
      if (type === 'ktp') {
        for (const row of extracted) {
          const f = row.Field?.toLowerCase() || '';
          if (f.includes('nama')) structuredData.nama = row.Value;
          if (f.includes('nik')) structuredData.nik = row.Value;
          if (f.includes('tempat') || f.includes('tanggal')) structuredData.ttl = (structuredData.ttl ? structuredData.ttl + ' ' : '') + row.Value;
          if (f.includes('alamat')) structuredData.alamat = row.Value;
        }
      }
      if (type === 'ijazah') {
        structuredData.pendidikan.push({ sumber: doc.filename, detail: doc.text.substring(0, 500) });
      }
      if (type === 'transkrip') {
        for (const row of extracted) {
          if (row['Mata Kuliah']) structuredData.mataKuliah.push(row);
          if (row.Field?.toLowerCase().includes('ipk')) structuredData.ipk = row.Value;
        }
      }
      if (type === 'sertifikat') {
        structuredData.sertifikasi.push({ sumber: doc.filename, detail: doc.text.substring(0, 300) });
      }
    }

    if (rows.length > 0) {
      tables[type] = Papa.unparse(rows);
    }
  }

  return { tables, structuredData };
}
