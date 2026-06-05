// src/reporters/docx.js
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, ImageRun } from 'docx';
import { readFileSync, existsSync } from 'fs';

export async function generateDOCX(data, profile = '', profilePhotoPath = null) {
  const children = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: data.name || 'Name Not Detected', bold: true, size: 36 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }));

  if (data.dob)     children.push(new Paragraph({ text: `Date of Birth: ${data.dob}`, spacing: { after: 40 } }));
  if (data.address) children.push(new Paragraph({ text: `Address: ${data.address}`, spacing: { after: 40 } }));
  if (data.nik)     children.push(new Paragraph({ text: `ID Number: ${data.nik}`, spacing: { after: 120 } }));

  if (profile) {
    children.push(new Paragraph({ text: 'PROFESSIONAL PROFILE', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    children.push(new Paragraph({ text: profile, spacing: { after: 120 } }));
  }

  if (data.education?.length > 0) {
    children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    data.education.forEach(e => children.push(new Paragraph({ text: `• ${e.detail.substring(0, 200)}`, spacing: { after: 40 } })));
  }

  if (data.gpa) children.push(new Paragraph({ text: `GPA: ${data.gpa}`, spacing: { before: 80, after: 40 } }));

  if (data.courses?.length > 0) {
    children.push(new Paragraph({ text: 'RELEVANT COURSES', heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 } }));
    data.courses.slice(0, 15).forEach(c => children.push(new Paragraph({ text: `• ${c.Course} — ${c.Grade} (${c.Credits} credits)`, spacing: { after: 30 } })));
  }

  if (data.certifications?.length > 0) {
    children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    data.certifications.forEach(c => children.push(new Paragraph({ text: `• ${c.detail.substring(0, 200)}`, spacing: { after: 40 } })));
  }

  if (data.skills?.length > 0) {
    children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 } }));
    children.push(new Paragraph({ text: data.skills.join(' • '), spacing: { after: 40 } }));
  }

  const sectionChildren = [...children];
  if (profilePhotoPath && existsSync(profilePhotoPath)) {
    try {
      sectionChildren.unshift(new Paragraph({
        children: [new ImageRun({ data: readFileSync(profilePhotoPath), transformation: { width: 100, height: 130 } })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 }
      }));
    } catch (err) { console.warn(`[DOCX] Could not embed photo: ${err.message}`); }
  }

  const doc = new Document({ sections: [{ properties: {}, children: sectionChildren }] });
  return Packer.toBuffer(doc);
}
