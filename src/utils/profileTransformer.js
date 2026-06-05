// src/utils/profileTransformer.js
// Calls the /doc2cv endpoint on the stech-api Cloudflare Worker,
// which uses Cloudflare Workers AI (Llama 3.3 70B) to generate a professional profile summary.

const WORKER_URL = 'https://stech-api.sheradogilang.workers.dev/doc2cv';

export async function callProfileTransformer(structuredData) {
  try {
    const payload = {
      nama: structuredData.name,
      pendidikan: structuredData.education.map(e => e.detail).join(' | '),
      sertifikasi: structuredData.certifications.map(c => c.detail).join(' | '),
      mataKuliah: structuredData.courses.slice(0, 20),
      ipk: structuredData.gpa,
      skill: structuredData.skills
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
    console.warn(`[PROFILE] Failed to call Profile Transformer: ${err.message}`);
    return '';
  }
}
