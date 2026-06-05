// src/utils/profileTransformer.js
// Calls the /doc2cv endpoint on the stech-api Cloudflare Worker.
// The Worker uses Cloudflare Workers AI (Llama 3.3 70B) to generate
// a professional profile summary from the extracted document data.
// Authenticated via X-Doc2CV-Actor-Secret header.

import axios from 'axios';

const API_URL = 'https://stech-api.sheradogilang.workers.dev/doc2cv';

export async function callProfileTransformer(structuredData, proxySecret, timeout = 60) {
  const payload = {
    nama: structuredData.name || '',
    pendidikan: structuredData.education.map(e => e.detail).join(' | '),
    sertifikasi: structuredData.certifications.map(c => c.detail).join(' | '),
    mataKuliah: structuredData.courses.slice(0, 20),
    ipk: structuredData.gpa || '',
    skill: structuredData.skills || [],
  };

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Doc2CV-Actor-Secret': proxySecret,
      },
      timeout: timeout * 1000,
    });

    return response.data.profile || response.data.response || '';
  } catch (err) {
    console.warn(`[PROFILE] Failed to call Profile Transformer: ${err.message}`);
    return '';
  }
}
