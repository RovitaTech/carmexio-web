/**
 * Minimal .xlsx reader: first worksheet → rows of cell text. An .xlsx file is a zip of
 * XML parts; `fflate` unzips it and the browser's DOMParser reads the sheet. Loaded
 * lazily by the import page only (admin, client-rendered).
 */
export async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const { unzipSync, strFromU8 } = await import('fflate');
  const files = unzipSync(new Uint8Array(buffer));
  const xml = (path: string) => {
    const file = files[path];
    return file ? new DOMParser().parseFromString(strFromU8(file), 'application/xml') : null;
  };
  const shared = [...(xml('xl/sharedStrings.xml')?.getElementsByTagName('si') ?? [])].map((si) =>
    [...si.getElementsByTagName('t')].map((t) => t.textContent ?? '').join(''),
  );
  const sheetPath = firstSheetPath(files, xml);
  const sheet = sheetPath ? xml(sheetPath) : null;
  if (!sheet) throw new Error('El archivo de Excel no tiene hojas.');
  const rows: string[][] = [];
  for (const r of sheet.getElementsByTagName('row')) {
    const cells: string[] = [];
    for (const c of r.getElementsByTagName('c')) {
      const col = columnIndex(c.getAttribute('r') ?? '');
      const type = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      cells[col >= 0 ? col : cells.length] =
        type === 's'
          ? (shared[Number(v)] ?? '')
          : type === 'inlineStr'
            ? [...c.getElementsByTagName('t')].map((t) => t.textContent ?? '').join('')
            : v;
    }
    rows.push(Array.from(cells, (v) => (v ?? '').trim()));
  }
  return rows.filter((row) => row.some((v) => v !== ''));
}

/** The workbook's first sheet (not always `sheet1.xml`). */
function firstSheetPath(
  files: Record<string, Uint8Array>,
  xml: (path: string) => Document | null,
): string | null {
  const rid = xml('xl/workbook.xml')?.getElementsByTagName('sheet')[0]?.getAttribute('r:id');
  const rel = [...(xml('xl/_rels/workbook.xml.rels')?.getElementsByTagName('Relationship') ?? [])]
    .find((r) => r.getAttribute('Id') === rid)
    ?.getAttribute('Target');
  const path = rel ? `xl/${rel.replace(/^\/?xl\//, '')}` : null;
  if (path && files[path]) return path;
  return Object.keys(files).find((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)) ?? null;
}

/** "C12" → 2. */
function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0];
  if (!letters) return -1;
  return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}
