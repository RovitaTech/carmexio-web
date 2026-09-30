/**
 * CSV / TSV / semicolon files and pasted spreadsheet text → rows of cells.
 * RFC 4180 quoting ("a, b", "say ""hi"""), CRLF, BOM; the delimiter is detected
 * from the header line (Excel in es-MX saves CSV with `;`).
 */
/** Byte-order mark that Excel puts at the start of UTF-8 CSV files. */
const BOM = String.fromCharCode(0xfeff);

export function parseDelimited(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((v) => v.trim())).filter((r) => r.some((v) => v !== ''));
}

function detectDelimiter(text: string): string {
  const newline = text.search(/\r?\n/);
  const header = newline < 0 ? text : text.slice(0, newline);
  const counts = ['\t', ';', ','].map((d) => [d, header.split(d).length] as const);
  return counts.reduce((best, c) => (c[1] > best[1] ? c : best))[0];
}
