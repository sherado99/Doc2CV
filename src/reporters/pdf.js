// src/reporters/pdf.js
import PDFDocument from 'pdfkit';
import { readFileSync, existsSync } from 'fs';

export async function generatePDF(data, profile = '', profilePhotoPath = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (profilePhotoPath && existsSync(profilePhotoPath)) {
      try { doc.image(profilePhotoPath, doc.page.width - 150, 50, { width: 100 }); }
      catch (err) { console.warn(`[PDF] Could not embed photo: ${err.message}`); }
    }

    doc.fontSize(20).font('Helvetica-Bold').text(data.name || 'Name Not Detected', { align: 'center' });
    doc.moveDown(0.5);

    if (data.dob)     doc.fontSize(11).font('Helvetica').text(`Date of Birth: ${data.dob}`);
    if (data.address) doc.fontSize(11).text(`Address: ${data.address}`);
    if (data.nik)     doc.fontSize(11).text(`ID Number: ${data.nik}`);
    doc.moveDown();

    if (profile) {
      doc.fontSize(13).font('Helvetica-Bold').text('PROFESSIONAL PROFILE');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(profile);
      doc.moveDown();
    }

    if (data.education?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('EDUCATION');
      doc.moveDown(0.3);
      data.education.forEach(e => doc.fontSize(11).font('Helvetica').text(`• ${e.detail.substring(0, 200)}`));
      doc.moveDown();
    }

    if (data.gpa) { doc.fontSize(11).font('Helvetica-Bold').text(`GPA: ${data.gpa}`); doc.moveDown(0.3); }

    if (data.courses?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('RELEVANT COURSES');
      doc.moveDown(0.3);
      data.courses.slice(0, 15).forEach(c => doc.fontSize(10).font('Helvetica').text(`• ${c.Course} — ${c.Grade} (${c.Credits} credits)`));
      doc.moveDown();
    }

    if (data.certifications?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('CERTIFICATIONS');
      doc.moveDown(0.3);
      data.certifications.forEach(c => doc.fontSize(11).font('Helvetica').text(`• ${c.detail.substring(0, 200)}`));
      doc.moveDown();
    }

    if (data.skills?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('SKILLS');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(data.skills.join(' • '));
    }

    doc.end();
  });
}
