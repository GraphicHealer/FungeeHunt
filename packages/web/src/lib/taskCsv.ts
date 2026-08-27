const CSV_HEADERS = ['title', 'description', 'points', 'proofType', 'photoCount', 'category', 'order'];

export function toCsv(tasks: any[]): string {
  const rows = tasks.map((t) => [
    csvCell(t.title ?? ''),
    csvCell(t.description ?? ''),
    csvCell(String(t.points ?? 0)),
    csvCell(t.proofType ?? 'PHOTO'),
    csvCell(t.photoCount ? String(t.photoCount) : ''),
    csvCell(t.category ?? ''),
    csvCell(String(t.order ?? '')),
  ]);
  return [CSV_HEADERS, ...rows].map((r) => r.join(',')).join('\n');
}

export function downloadTemplate(filename: string, tasks?: any[]) {
  const sample = tasks && tasks.length > 0 ? tasks : [
    {
      title: 'Welcome to the Landmark',
      description: 'Take a photo of your entire team together with a well-known local landmark clearly visible in the background.',
      points: 150,
      proofType: 'PHOTO',
      photoCount: '',
      category: 'Team Photo',
      order: 1,
    },
  ];
  const csv = toCsv(sample);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
