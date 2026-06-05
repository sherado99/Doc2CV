// src/reporters/pdf.js
import PDFDocument from 'pdfkit';
import { readFileSync, existsSync } from 'fs';

export async function generatePDF(data, profile = '', pasFotoPath = null) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Pas foto kanan atas
    if (pasFotoPath && existsSync(pasFotoPath)) {
      try {
        doc.image(pasFotoPath, doc.page.width - 150, 50, { width: 100 });
      } catch {}
    }

    // Nama
    doc.fontSize(20).font('Helvetica-Bold').text(data.nama || 'Nama Tidak Terdeteksi', { align: 'center' });
    doc.moveDown(0.5);

    if (data.ttl) doc.fontSize(11).font('Helvetica').text(`Tempat/Tgl Lahir: ${data.ttl}`);
    if (data.alamat) doc.fontSize(11).text(`Alamat: ${data.alamat}`);
    if (data.nik) doc.fontSize(11).text(`NIK: ${data.nik}`);
    doc.moveDown();

    // Profile
    if (profile) {
      doc.fontSize(13).font('Helvetica-Bold').text('PROFIL PROFESIONAL');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(profile);
      doc.moveDown();
    }

    // Pendidikan
    if (data.pendidikan?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('RIWAYAT PENDIDIKAN');
      doc.moveDown(0.3);
      data.pendidikan.forEach(p => {
        doc.fontSize(11).font('Helvetica').text(`• ${p.detail.substring(0, 200)}`);
      });
      doc.moveDown();
    }

    if (data.ipk) {
      doc.fontSize(11).font('Helvetica-Bold').text(`IPK: ${data.ipk}`);
      doc.moveDown(0.3);
    }

    // Mata kuliah
    if (data.mataKuliah?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('MATA KULIAH RELEVAN');
      doc.moveDown(0.3);
      data.mataKuliah.slice(0, 15).forEach(mk => {
        doc.fontSize(10).font('Helvetica').text(`• ${mk['Mata Kuliah']} — ${mk['Nilai']} (${mk['SKS']} SKS)`);
      });
      doc.moveDown();
    }

    // Sertifikasi
    if (data.sertifikasi?.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('SERTIFIKASI');
      doc.moveDown(0.3);
      data.sertifikasi.forEach(s => {
        doc.fontSize(11).font('Helvetica').text(`• ${s.detail.substring(0, 200)}`);
      });
    }

    doc.end();
  });
}
