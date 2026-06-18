export type ColumnCopyFormat = 'list' | 'json';
export type ExportFormat = 'csv-no-header' | 'json';

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function copyRowsData(
  rows: Record<string, any>[],
  _label: string,
  format: ExportFormat | `${ExportFormat}`
): Promise<void> {
  if (format === 'json') {
    return copyToClipboard(JSON.stringify(rows, null, 2));
  }

  // TSV format
  if (rows.length === 0) return copyToClipboard('');
  const headers = Object.keys(rows[0]);
  const tsv = [
    headers.join('\t'),
    ...rows.map(row => headers.map(h => String(row[h] ?? '')).join('\t')),
  ].join('\n');
  return copyToClipboard(tsv);
}

export function copyColumnData(
  rows: Record<string, any>[],
  columnId: string,
  format: ColumnCopyFormat
): Promise<void> {
  const values = rows.map(row => row[columnId] ?? '');

  if (format === 'json') {
    return copyToClipboard(JSON.stringify(values, null, 2));
  }

  return copyToClipboard(values.join('\n'));
}
