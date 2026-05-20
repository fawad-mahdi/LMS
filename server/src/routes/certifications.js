const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const createNotification = require('../utils/notify');

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'manager'));

function sanitizeCertificateText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function pdfEscape(value) {
  return sanitizeCertificateText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatCertificateDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function buildCertificatePdf(assignment) {
  const pageWidth = 792;
  const pageHeight = 612;
  const lines = [
    { text: '10Pearls Learning & Development', size: 15, x: 396, y: 520 },
    { text: 'Certificate of Completion', size: 34, x: 396, y: 452 },
    { text: 'This certifies that', size: 13, x: 396, y: 386 },
    { text: assignment.user_name, size: 28, x: 396, y: 342 },
    { text: 'has successfully completed', size: 13, x: 396, y: 292 },
    { text: assignment.training_title, size: 22, x: 396, y: 252 },
    { text: `Completed on ${formatCertificateDate(assignment.completed_at)}`, size: 12, x: 396, y: 196 },
    { text: `Awarded on ${formatCertificateDate(assignment.certificate_awarded_at)}`, size: 11, x: 396, y: 170 },
    { text: `Certificate ID ${assignment.id}`, size: 9, x: 396, y: 92 },
  ];

  const border = [
    'q 1 0.84 0 0 RG 3 w 36 36 720 540 re S Q',
    'q 0.12 0.13 0.16 RG 1 w 54 54 684 504 re S Q',
  ].join('\n');

  const text = lines.map(line => (
    `BT /F1 ${line.size} Tf 0.08 0.09 0.11 rg ${line.x} ${line.y} Td (${pdfEscape(line.text)}) Tj ET`
  )).join('\n');

  const content = `${border}\n${text}\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`,
  ];

  const parts = ['%PDF-1.4\n'];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(parts.join('')));
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(''));
  parts.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(offset => parts.push(`${String(offset).padStart(10, '0')} 00000 n \n`));
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(parts.join(''), 'utf8');
}

function scopeClause(user, params) {
  if (user.role === 'manager') {
    params.push(user.userId);
    return `AND u.department=(SELECT department FROM users WHERE id=$${params.length})`;
  }
  return '';
}

async function findCompletedAssignment(id, user) {
  const params = [id];
  const { rows: [assignment] } = await pool.query(
    `SELECT ta.*, t.title AS training_title, t.category, u.name AS user_name,
      u.email AS user_email, u.department, awarded_by.name AS awarded_by_name
     FROM training_assignments ta
     JOIN trainings t ON ta.training_id=t.id
     JOIN users u ON ta.user_id=u.id
     LEFT JOIN users awarded_by ON awarded_by.id=ta.certificate_awarded_by
     WHERE ta.id=$1 AND ta.status='completed' ${scopeClause(user, params)}`,
    params
  );
  return assignment;
}

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const { rows } = await pool.query(
      `SELECT ta.id, ta.completed_at, ta.certificate_awarded_at, t.title AS training_title,
        t.category, u.name AS user_name, u.email AS user_email, u.department,
        awarded_by.name AS awarded_by_name
       FROM training_assignments ta
       JOIN trainings t ON ta.training_id=t.id
       JOIN users u ON ta.user_id=u.id
       LEFT JOIN users awarded_by ON awarded_by.id=ta.certificate_awarded_by
       WHERE ta.status='completed' ${scopeClause(req.user, params)}
       ORDER BY ta.certificate_awarded_at NULLS FIRST, ta.completed_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/award', async (req, res, next) => {
  try {
    const assignment = await findCompletedAssignment(req.params.id, req.user);
    if (!assignment) return res.status(404).json({ error: 'Completed assignment not found' });

    const { rows } = await pool.query(
      `UPDATE training_assignments
       SET certificate_awarded_at=COALESCE(certificate_awarded_at, NOW()),
        certificate_awarded_by=COALESCE(certificate_awarded_by, $2),
        updated_at=NOW()
       WHERE id=$1
       RETURNING *`,
      [req.params.id, req.user.userId]
    );
    if (!assignment.certificate_awarded_at) {
      createNotification(
        assignment.user_id, 'certificate_awarded',
        `Your certificate for "${assignment.training_title}" has been awarded`,
        req.params.id, 'assignment'
      ).catch(() => {});
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.get('/:id/download', async (req, res, next) => {
  try {
    const assignment = await findCompletedAssignment(req.params.id, req.user);
    if (!assignment) return res.status(404).json({ error: 'Completed assignment not found' });
    if (!assignment.certificate_awarded_at) return res.status(400).json({ error: 'Certificate has not been awarded' });

    const pdf = buildCertificatePdf(assignment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${assignment.id}.pdf"`);
    return res.send(pdf);
  } catch (err) { return next(err); }
});

module.exports = router;
