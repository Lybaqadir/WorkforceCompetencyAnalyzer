const Papa = require('papaparse');
const XLSX = require('xlsx');

function parseCsv(buffer) {
  const text = buffer.toString('utf-8');
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return result.data;
}

function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function rowsToPeopleAndRoles(rows) {
  const people = [];
  const roles = [];

  for (const row of rows) {
    const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
    const vals = Object.values(row).map((v) => String(v).trim());
    const get = (aliases) => {
      for (const a of aliases) {
        const idx = keys.findIndex((k) => k.includes(a));
        if (idx !== -1) return vals[idx];
      }
      return '';
    };

    const name = get(['name', 'full name', 'employee']);
    const title = get(['title', 'role', 'position', 'job']);
    const email = get(['email', 'mail']);
    const tenure = get(['tenure', 'years', 'experience', 'seniority']);
    const skills = get(['skills', 'competencies', 'expertise'])
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (name) people.push({ name, title, email, tenure, skills });
    if (title && !name) roles.push({ title, skills });
  }

  return { people, roles };
}

async function parseTeamFile(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  let rows = [];

  if (ext === 'csv' || ext === 'txt') {
    rows = parseCsv(file.buffer);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rows = parseXlsx(file.buffer);
  } else if (ext === 'pdf') {
    // For PDFs, return raw text for the AI to interpret
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(file.buffer);
    return { rawText: data.text.slice(0, 4000), people: [], roles: [] };
  } else if (ext === 'docx') {
    // For Word CVs, return raw text for the AI to interpret
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return { rawText: result.value.slice(0, 4000), people: [], roles: [] };
  }

  return rowsToPeopleAndRoles(rows);
}

module.exports = { parseTeamFile };
