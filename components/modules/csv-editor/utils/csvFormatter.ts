import Papa from 'papaparse';
import type { CsvFormatOptions } from '../types';

/**
 * Sanitize CSV cell values to prevent formula injection
 */
export function sanitizeCsvCell(value: string): string {
  if (
    value.startsWith('=') ||
    value.startsWith('+') ||
    value.startsWith('-') ||
    value.startsWith('@')
  ) {
    return `'${value}`;
  }
  return value;
}

/**
 * Format objects to CSV string
 * @param rows Data rows
 * @param options Format options
 * @returns CSV formatted string
 * @throws Error if formatting fails
 */
export function formatCsv(
  rows: Record<string, any>[],
  options: CsvFormatOptions = {}
): Promise<string> {
  // Deep copy rows and sanitize string values if needed
  const sanitizedRows = rows.map(row => {
    const sanitizedRow: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      const val = row[key];
      if (typeof val === 'string') {
        sanitizedRow[key] = sanitizeCsvCell(val);
      } else if (val === null || val === undefined) {
        sanitizedRow[key] = '';
      } else {
        sanitizedRow[key] = val;
      }
    }
    return sanitizedRow;
  });

  const includeHeaders = options.headers ?? options.includeHeaders ?? true;
  const delimiter = options.delimiter ?? ',';
  const quoteChar = options.quote ?? '"';

  const csv = Papa.unparse(sanitizedRows, {
    header: Boolean(includeHeaders),
    delimiter,
    quoteChar,
  });

  return Promise.resolve(csv);
}
