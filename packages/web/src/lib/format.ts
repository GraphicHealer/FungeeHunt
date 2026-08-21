export function formatPoints(value: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '0';
  const n = Number(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}
