/** Quotes a CSV cell when it holds a comma, quote or line break. */
const cell = (value) => {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** rows + [{ header, value(row) }] → CSV text (Excel-friendly, CRLF line ends). */
export function toCsv(rows, columns) {
  const lines = [columns.map((c) => cell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(','));
  return lines.join('\r\n');
}

// Byte-order mark so Excel opens the file as UTF-8 (₦ signs, names with accents)
const BOM = String.fromCharCode(0xfeff);

/** Saves CSV text as a file download. */
export function downloadCsv(filename, csv) {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
