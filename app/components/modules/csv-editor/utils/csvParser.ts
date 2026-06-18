import Papa from 'papaparse';
import type { CsvParseOptions, CsvParseResult } from '../types';

export function parseCsv(
  content: string,
  options: CsvParseOptions = {}
): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const hasHeaders = options.headers ?? true;

    const result = Papa.parse<Record<string, string> | string[]>(content, {
      header: hasHeaders,
      delimiter: options.delimiter ?? ',',
      skipEmptyLines: true,
      transformHeader: (header: string, index: number) =>
        header.trim() || `Column ${index + 1}`,
    });

    if (result.errors.length > 0) {
      const fatal = result.errors.find((e) => e.type === 'Quotes' || e.type === 'FieldMismatch');
      if (fatal) {
        return reject(new Error(fatal.message));
      }
    }

    let headers: string[] = [];
    let rows: Record<string, string>[] = [];

    if (hasHeaders) {
      headers = result.meta.fields ?? [];
      rows = result.data as Record<string, string>[];
    } else {
      const rawRows = result.data as string[][];
      const maxCols = rawRows.reduce((max, row) => Math.max(max, row.length), 0);
      headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
      rows = rawRows.map((rowArr) => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObj[header] = rowArr[index] !== undefined ? String(rowArr[index]) : '';
        });
        return rowObj;
      });
    }

    resolve({ rows, headers });
  });
}
