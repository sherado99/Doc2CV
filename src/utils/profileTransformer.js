// src/utils/profileTransformer.js
// Memanggil endpoint /doc2cv pada stech-api Cloudflare Worker
// Worker menggunakan Cloudflare Workers AI (Llama) untuk merangkum data menjadi narasi profil CV

const WORKER_URL = 'https://stech-api.sheradogilang.workers.dev/doc2cv';

export async function callProfileTransformer(structuredData) {
  try {
    const payload = {
      nama: structuredData.nama,
      pendidikan: structuredData.pendidikan.map(p => p.detail).join(' | '),
      sertifikasi: structuredData.sertifikasi.map(s => s.detail).join(' | '),
      mataKuliah: structuredData.mataKuliah.slice(0, 20),
      ipk: structuredData.ipk,
      skill: structuredData.skill
    };

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`[PROFILE] Worker error: ${res.status}`);
      return '';
    }

    const json = await res.json();
    return json.profile || json.response || '';
  } catch (err) {
    console.warn(`[PROFILE] Gagal memanggil Profile Transformer: ${err.message}`);
    return '';
  }
}
