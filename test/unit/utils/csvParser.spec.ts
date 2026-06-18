import { describe, expect, it } from 'vitest';
import { parseCsv } from '~/components/modules/csv-editor/utils/csvParser';
import { formatCsv, sanitizeCsvCell } from '~/components/modules/csv-editor/utils/csvFormatter';

describe('csvParser and csvFormatter', () => {
  describe('sanitizeCsvCell', () => {
    it('prefixes formula-like values with single quote', () => {
      expect(sanitizeCsvCell('=1+2')).toBe("'=1+2");
      expect(sanitizeCsvCell('+SUM(A1)')).toBe("'+SUM(A1)");
      expect(sanitizeCsvCell('-100')).toBe("'-100");
      expect(sanitizeCsvCell('@ref')).toBe("'@ref");
    });

    it('returns normal values unchanged', () => {
      expect(sanitizeCsvCell('hello world')).toBe('hello world');
      expect(sanitizeCsvCell('12345')).toBe('12345');
      expect(sanitizeCsvCell('')).toBe('');
    });
  });

  describe('parseCsv', () => {
    it('parses CSV with headers', async () => {
      const csv = 'name,age,city\nAlice,30,New York\nBob,25,SF';
      const result = await parseCsv(csv, { headers: true });

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
      expect(result.rows[1]).toEqual({ name: 'Bob', age: '25', city: 'SF' });
    });

    it('trims header whitespace', async () => {
      const csv = ' name , age \nAlice,30';
      const result = await parseCsv(csv, { headers: true });

      expect(result.headers).toEqual(['name', 'age']);
    });

    it('fills empty header names with Column N', async () => {
      const csv = ',name,\n1,2,3';
      const result = await parseCsv(csv, { headers: true });

      expect(result.headers).toEqual(['Column 1', 'name', 'Column 3']);
    });

    it('parses CSV without headers', async () => {
      const csv = 'Alice,30,New York\nBob,25,SF';
      const result = await parseCsv(csv, { headers: false });

      expect(result.headers).toEqual(['Column 1', 'Column 2', 'Column 3']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        'Column 1': 'Alice',
        'Column 2': '30',
        'Column 3': 'New York',
      });
    });

    it('handles variable column counts (no headers)', async () => {
      const csv = 'a,b,c\nd,e\nf,g,h,i';
      const result = await parseCsv(csv, { headers: false });

      expect(result.headers).toEqual(['Column 1', 'Column 2', 'Column 3', 'Column 4']);
      expect(result.rows[1]['Column 4']).toBe('');
      expect(result.rows[2]['Column 4']).toBe('i');
    });

    it('handles empty CSV', async () => {
      const result = await parseCsv('', { headers: true });

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('skips empty lines', async () => {
      const csv = 'name,age\n\nAlice,30\n\n\nBob,25\n';
      const result = await parseCsv(csv, { headers: true });

      expect(result.rows).toHaveLength(2);
    });

    it('handles custom delimiter (tab)', async () => {
      const csv = 'name\tage\nAlice\t30';
      const result = await parseCsv(csv, { headers: true, delimiter: '\t' });

      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows[0]).toEqual({ name: 'Alice', age: '30' });
    });
  });

  describe('formatCsv', () => {
    it('formats rows to CSV with headers', async () => {
      const rows = [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ];

      const csv = await formatCsv(rows, {
        includeHeaders: true,
        headers: ['name', 'age'],
      });

      const lines = csv.trim().split(/\r?\n/);
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('name,age');
      expect(lines[1]).toBe('Alice,30');
      expect(lines[2]).toBe('Bob,25');
    });

    it('formats without headers', async () => {
      const rows = [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ];

      // When headers array is provided, includeHeaders defaults to true.
      // To suppress headers, omit headers array and use includeHeaders: false
      const csv = await formatCsv(rows, {
        includeHeaders: false,
      });

      const lines = csv.trim().split(/\r?\n/);
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('Alice,30');
    });

    it('sanitizes formula-like values', async () => {
      const rows = [
        { name: 'Alice', expr: '=SUM(A1:A10)' },
      ];

      const csv = await formatCsv(rows, {
        includeHeaders: true,
        headers: ['name', 'expr'],
      });

      const lines = csv.trim().split(/\r?\n/);
      expect(lines[1]).toBe("Alice,'=SUM(A1:A10)");
    });

    it('converts null/undefined to empty string', async () => {
      const rows = [
        { name: 'Alice', age: null as any, city: undefined as any },
      ];

      // Omit headers array to suppress headers; keep includeHeaders: false
      const csv = await formatCsv(rows, {
        includeHeaders: false,
      });

      const lines = csv.trim().split(/\r?\n/);
      expect(lines[0]).toBe('Alice,,');
    });

    it('handles custom delimiter', async () => {
      const rows = [{ name: 'Alice', age: '30' }];

      const csv = await formatCsv(rows, {
        includeHeaders: true,
        headers: ['name', 'age'],
        delimiter: '\t',
      });

      const lines = csv.trim().split(/\r?\n/);
      expect(lines[0]).toBe('name\tage');
    });
  });
});
