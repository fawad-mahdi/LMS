const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

const REPORT_COLUMNS = [
  ['employee_name', 'Employee'],
  ['employee_email', 'Email'],
  ['department', 'Department'],
  ['training_title', 'Training'],
  ['category', 'Category'],
  ['training_type', 'Type'],
  ['status', 'Status'],
  ['progress_pct', 'Progress %'],
  ['due_date', 'Due Date'],
  ['completed_at', 'Completed At'],
  ['assigned_at', 'Assigned At'],
];

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16);
}

function sanitizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(rows) {
  const header = REPORT_COLUMNS.map(([, label]) => csvEscape(label)).join(',');
  const body = rows.map(row => REPORT_COLUMNS.map(([key]) => csvEscape(row[key])).join(','));
  return [header, ...body].join('\n');
}

function pdfEscape(value) {
  return sanitizeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapPdfText(text, maxChars) {
  const words = sanitizeText(text).split(' ').filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    if (!line) {
      line = word;
    } else if (`${line} ${word}`.length <= maxChars) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function buildPdf(rows, requestedBy) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lines = [
    { text: '10Pearls LMS Completion Report', size: 18, gap: 24 },
    { text: `Generated for ${requestedBy.name} (${requestedBy.role})`, size: 10, gap: 14 },
    { text: `Generated at ${formatDateTime(new Date())} UTC`, size: 10, gap: 22 },
    { text: `Total records: ${rows.length}`, size: 11, gap: 20 },
  ];

  rows.slice(0, 140).forEach((row, index) => {
    const status = sanitizeText(row.status).replace('_', ' ');
    const summary = `${index + 1}. ${row.employee_name} - ${row.training_title}`;
    const details = `${status} | ${row.progress_pct}% | due ${row.due_date || 'n/a'} | completed ${row.completed_at || 'n/a'}`;
    wrapPdfText(summary, 86).forEach(text => lines.push({ text, size: 9, gap: 12 }));
    wrapPdfText(details, 96).forEach(text => lines.push({ text, size: 8, gap: 11 }));
    lines.push({ text: '', size: 8, gap: 5 });
  });

  if (rows.length > 140) {
    lines.push({ text: `Showing first 140 records. Use CSV for the complete ${rows.length}-record export.`, size: 9, gap: 12 });
  }

  const pageContents = [];
  let y = pageHeight - margin;
  let content = 'BT\n/F1 10 Tf\n';

  for (const line of lines) {
    if (y < margin) {
      content += 'ET\n';
      pageContents.push(content);
      content = 'BT\n/F1 10 Tf\n';
      y = pageHeight - margin;
    }
    content += `/F1 ${line.size} Tf\n${margin} ${y} Td\n(${pdfEscape(line.text)}) Tj\n-${margin} -${y} Td\n`;
    y -= line.gap;
  }

  content += 'ET\n';
  pageContents.push(content);

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectIds = pageContents.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageContents.length} >>`);

  pageContents.forEach((pageContent, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(pageContent)} >>\nstream\n${pageContent}endstream`);
  });

  const parts = ['%PDF-1.4\n'];
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(parts.join('')));
    parts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(''));
  parts.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(offset => {
    parts.push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(parts.join(''), 'utf8');
}

function normalizeStatus(status) {
  if (['not_started', 'in_progress', 'completed'].includes(status)) return status;
  return null;
}

async function getReportRows(user, status) {
  const params = [];
  const clauses = ['u.is_active=true'];

  if (user.role === 'manager') {
    params.push(user.userId);
    clauses.push(`u.department=(SELECT department FROM users WHERE id=$${params.length})`);
  } else if (user.role === 'instructor') {
    params.push(user.userId);
    clauses.push(`t.created_by=$${params.length}`);
  } else if (user.role === 'employee') {
    params.push(user.userId);
    clauses.push(`ta.user_id=$${params.length}`);
  }

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) {
    params.push(normalizedStatus);
    clauses.push(`ta.status=$${params.length}`);
  } else if (status === 'overdue') {
    clauses.push("ta.due_date < CURRENT_DATE AND ta.status != 'completed'");
  }

  const { rows } = await pool.query(
    `SELECT
       u.name AS employee_name,
       u.email AS employee_email,
       COALESCE(u.department, '') AS department,
       t.title AS training_title,
       COALESCE(t.category, '') AS category,
       t.type AS training_type,
       ta.status,
       ta.progress_pct,
       ta.due_date,
       ta.completed_at,
       ta.created_at AS assigned_at
     FROM training_assignments ta
     JOIN trainings t ON ta.training_id=t.id
     JOIN users u ON ta.user_id=u.id
     WHERE ${clauses.join(' AND ')}
     ORDER BY ta.created_at DESC`,
    params
  );

  return rows.map(row => ({
    ...row,
    due_date: formatDate(row.due_date),
    completed_at: formatDateTime(row.completed_at),
    assigned_at: formatDateTime(row.assigned_at),
  }));
}

router.get('/completion', async (req, res, next) => {
  try {
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
    const rows = await getReportRows(req.user, req.query.status);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const pdf = buildPdf(rows, req.user);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="completion-report-${stamp}.pdf"`);
      return res.send(pdf);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="completion-report-${stamp}.csv"`);
    return res.send(buildCsv(rows));
  } catch (err) { return next(err); }
});

module.exports = router;
