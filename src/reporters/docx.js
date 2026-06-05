// src/reporters/docx.js
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { readFileSync, existsSync } from 'fs';

export async function generateDOCX(data, profile = '', pasFotoPath = null) {
  const children = [];

  // Header: Nama
  children.push(new Paragraph({
    children: [new TextRun({ text: data.nama || 'Nama Tidak Terdeteksi', bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }));

  // Info dasar
  if (data.ttl) children.push(new Paragraph({ text: `Tempat/Tgl Lahir: ${data.ttl}`, spacing: { after: 40 } }));
  if (data.alamat) children.push(new Paragraph({ text: `Alamat: ${data.alamat}`, spacing: { after: 40 } }));
  if (data.nik) children.push(new Paragraph({ text: `NIK: ${data.nik}`, spacing: { after: 120 } }));

  // Profile / Ringkasan Profesional
  if (profile) {
    children.push(new Paragraph({ text: 'PROFIL PROFESIONAL', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    children.push(new Paragraph({ text: profile, spacing: { after: 120 } }));
  }

  // Pendidikan
  if (data.pendidikan?.length > 0) {
    children.push(new Paragraph({ text: 'RIWAYAT PENDIDIKAN', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    data.pendidikan.forEach(p => {
      children.push(new Paragraph({ text: `• ${p.detail.substring(0, 200)}`, spacing: { after: 40 } }));
    });
  }

  // Transkrip / IPK
  if (data.ipk) {
    children.push(new Paragraph({ text: `IPK: ${data.ipk}`, spacing: { before: 80, after: 40 } }));
  }
  if (data.mataKuliah?.length > 0) {
    children.push(new Paragraph({ text: 'MATA KULIAH RELEVAN', heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 } }));
    data.mataKuliah.slice(0, 15).forEach(mk => {
      children.push(new Paragraph({ text: `• ${mk['Mata Kuliah']} — ${mk['Nilai']} (${mk['SKS']} SKS)`, spacing: { after: 30 } }));
    });
  }

  // Sertifikasi
  if (data.sertifikasi?.length > 0) {
    children.push(new Paragraph({ text: 'SERTIFIKASI', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    data.sertifikasi.forEach(s => {
      children.push(new Paragraph({ text: `• ${s.detail.substring(0, 200)}`, spacing: { after: 40 } }));
    });
  }

  // Pas foto (pojok kanan atas jika ada)
  const sectionChildren = [...children];
  if (pasFotoPath && existsSync(pasFotoPath)) {
    try {
      const imgBuffer = readFileSync(pasFotoPath);
      sectionChildren.unshift(new Paragraph({
        children: [new ImageRun({ data: imgBuffer, transformation: { width: 100, height: 130 } })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 }
      }));
    } catch {}
  }

  const doc = new Document({ sections: [{ properties: {}, children: sectionChildren }] });
  return Packer.toBuffer(doc);
}
