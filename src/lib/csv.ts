// Minimal, dependency-free CSV. parseCsv handles quoted fields, escaped quotes
// (""), and CRLF/CR/LF line endings; csvCell quotes a value for output.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, '\n');
  // A list pasted straight from Excel / Numbers / Google Sheets arrives TAB-
  // separated; typed text is comma-separated. Pick the delimiter accordingly so
  // "copy the cells and paste" works exactly as the guide promises — and so a
  // comma inside a pasted cell (e.g. "Smith, Jones") isn't split by mistake.
  const delimiter = s.includes('\t') ? '\t' : ',';

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-blank lines.
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  // Prevent spreadsheet formula injection. Excel/Sheets execute a cell as a
  // formula when its first non-space character is = + - @ — and some importers
  // strip leading whitespace first, so " =cmd" is dangerous too. Look PAST any
  // leading spaces/tabs/newlines, not just position 0. A bare leading tab/CR/LF
  // is also quoted (it can confuse parsers). Prefix with ' to force plain text.
  if (/^\s*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
