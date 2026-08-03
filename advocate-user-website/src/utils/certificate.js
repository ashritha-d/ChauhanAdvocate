import { jsPDF } from 'jspdf';

// Simple client-generated completion certificate — landscape A4, gold/dark theme
// matching the site's branding. No server round-trip; this is intentionally
// lightweight rather than a server-rendered/emailed PDF pipeline.
export function generateCertificate({ studentName, courseTitle, instructor, date }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const gold = [201, 168, 76];
  const dark = [26, 26, 46];

  doc.setFillColor(...dark);
  doc.rect(0, 0, w, h, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(3);
  doc.rect(24, 24, w - 48, h - 48);
  doc.setLineWidth(1);
  doc.rect(34, 34, w - 68, h - 68);

  doc.setTextColor(...gold);
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.text('Certificate of Completion', w / 2, 140, { align: 'center' });

  doc.setTextColor(230, 230, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('This is to certify that', w / 2, 190, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(30);
  doc.text(studentName || 'Student', w / 2, 235, { align: 'center' });

  doc.setTextColor(230, 230, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('has successfully completed the course', w / 2, 275, { align: 'center' });

  doc.setTextColor(...gold);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text(courseTitle || 'Course', w / 2, 315, { align: 'center' });

  doc.setTextColor(200, 200, 210);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Instructor: ${instructor || 'Advocate Chauhan'}`, w / 2, 360, { align: 'center' });
  doc.text(`Date: ${date || new Date().toLocaleDateString('en-IN')}`, w / 2, 380, { align: 'center' });

  doc.setTextColor(...gold);
  doc.setFontSize(11);
  doc.text('Advocate Chauhan — Legal Education', w / 2, h - 60, { align: 'center' });

  return doc;
}

export function downloadCertificate(opts) {
  const doc = generateCertificate(opts);
  const safeName = (opts.courseTitle || 'certificate').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  doc.save(`certificate_${safeName}.pdf`);
}
