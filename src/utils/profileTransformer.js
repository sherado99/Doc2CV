// src/utils/profileTransformer.js
// Builds a professional CV profile prompt from the structured data extracted
// by the actor (OCR + tableBuilder), then calls the stech-api Cloudflare Worker
// endpoint at /doc2cv. The worker forwards { message } to Cloudflare Workers AI
// (Llama 3.3 70B) and returns { response }.
// This is the same pattern used by SPDET and SCDFT actors.

import axios from 'axios';

const API_URL = 'https://stech-api.sheradogilang.workers.dev/doc2cv';

export async function callProfileTransformer(structuredData, timeout = 60) {
  const name         = structuredData.name || '-';
  const gpa          = structuredData.gpa  || '-';
  const education    = structuredData.education.length > 0
    ? structuredData.education.map(e => e.detail.substring(0, 200)).join(' | ')
    : '-';
  const certifications = structuredData.certifications.length > 0
    ? structuredData.certifications.map(c => c.detail.substring(0, 150)).join(' | ')
    : '-';
  const courses      = structuredData.courses.length > 0
    ? structuredData.courses.slice(0, 8).map(c => c.Course).join(', ')
    : '-';
  const skills       = Array.isArray(structuredData.skills) && structuredData.skills.length > 0
    ? structuredData.skills.join(', ')
    : '-';

  const message = `Write a professional CV profile summary in 3 to 4 sentences. Use the third person. Base it only on the data below — do not add anything that is not mentioned. Output only the profile text with no labels, no bullet points, and no headings.

Data:
- Name: ${name}
- Education: ${education}
- GPA: ${gpa}
- Key Courses: ${courses}
- Certifications: ${certifications}
- Skills: ${skills}`;

  try {
    const response = await axios.post(
      API_URL,
      { message },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: timeout * 1000,
      }
    );

    return response.data.response || '';
  } catch (err) {
    console.warn(`[PROFILE] Failed to call Profile Transformer: ${err.message}`);
    return '';
  }
}
