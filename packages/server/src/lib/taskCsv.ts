export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const next = line[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

export function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines.map((l) => l.trim()).filter((l) => l).map(parseCsvLine);
}

const CSV_HEADERS = ['title', 'description', 'points', 'proofType', 'photoCount', 'category'];

export function parseTaskRows(rows: string[][]): any[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const get = (row: string[], name: string) => {
    const index = headers.indexOf(name);
    return index >= 0 ? row[index] : '';
  };

  return rows.slice(1).map((row) => {
    const title = (get(row, 'title') || '').trim();
    const description = (get(row, 'description') || '').trim();
    const points = Number(get(row, 'points')) || 0;
    const proofType = (get(row, 'prooftype') || 'PHOTO').toUpperCase().trim();
    const validProofType = ['PHOTO', 'VIDEO', 'PHOTOS'].includes(proofType) ? proofType : 'PHOTO';
    const photoCountRaw = get(row, 'photocount').trim();
    const photoCount = photoCountRaw ? Number(photoCountRaw) : null;
    const category = (get(row, 'category') || '').trim() || undefined;

    return {
      title,
      description,
      points,
      proofType: validProofType,
      photoCount: Number.isFinite(photoCount as any) && photoCount ? photoCount : null,
      category,
    };
  }).filter((t) => t.title);
}

export function toCsv(tasks: any[]): string {
  const headers = CSV_HEADERS;
  const rows = tasks.map((t) => [
    csvCell(t.title ?? ''),
    csvCell(t.description ?? ''),
    csvCell(String(t.points ?? 0)),
    csvCell(t.proofType ?? 'PHOTO'),
    csvCell(t.photoCount ? String(t.photoCount) : ''),
    csvCell(t.category ?? ''),
  ]);
  return [headers, ...rows].map((r) => r.join(',')).join('\n');
}

function csvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
