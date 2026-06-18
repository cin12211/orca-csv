import { describe, expect, it } from 'vitest';
import {
  formatCsv,
  sanitizeCsvCell,
} from '~/components/modules/csv-editor/utils/csvFormatter';
import { parseCsv } from '~/components/modules/csv-editor/utils/csvParser';

describe('CSV Parser and Formatter Utilities', () => {
  describe('sanitizeCsvCell', () => {
    it('escapes cells starting with formula prefixes', () => {
      expect(sanitizeCsvCell('=1+2')).toBe("'=1+2");
      expect(sanitizeCsvCell('+val')).toBe("'+val");
      expect(sanitizeCsvCell('-val')).toBe("'-val");
      expect(sanitizeCsvCell('@val')).toBe("'@val");
    });

    it('leaves safe cells unmodified', () => {
      expect(sanitizeCsvCell('hello')).toBe('hello');
      expect(sanitizeCsvCell('123')).toBe('123');
    });
  });

  describe('parseCsv', () => {
    it('parses CSV with headers correctly', async () => {
      const csvStr = 'name,age,city\nAlice,30,New York\nBob,25,San Francisco';
      const result = await parseCsv(csvStr, { headers: true });

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        name: 'Alice',
        age: '30',
        city: 'New York',
      });
      expect(result.rows[1]).toEqual({
        name: 'Bob',
        age: '25',
        city: 'San Francisco',
      });
    });

    it('parses CSV without headers correctly and generates column names', async () => {
      const csvStr = 'Alice,30,New York\nBob,25,San Francisco';
      const result = await parseCsv(csvStr, { headers: false });

      expect(result.headers).toEqual(['Column 1', 'Column 2', 'Column 3']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({
        'Column 1': 'Alice',
        'Column 2': '30',
        'Column 3': 'New York',
      });
    });
  });

  describe('formatCsv', () => {
    it('formats object rows to CSV string with headers', async () => {
      const rows = [
        { name: 'Alice', age: '30', city: 'New York' },
        { name: 'Bob', age: '25', city: 'San Francisco' },
      ];

      const csvResult = await formatCsv(rows, {
        includeHeaders: true,
        headers: ['name', 'age', 'city'],
      });

      // Split into lines to ignore EOL platform differences
      const lines = csvResult.trim().split(/\r?\n/);
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('name,age,city');
      expect(lines[1]).toBe('Alice,30,New York');
      expect(lines[2]).toBe('Bob,25,San Francisco');
    });

    it('escapes formulas during formatting', async () => {
      const rows = [{ name: 'Alice', formula: '=SUM(A1:A10)' }];

      const csvResult = await formatCsv(rows, {
        includeHeaders: true,
        headers: ['name', 'formula'],
      });

      const lines = csvResult.trim().split(/\r?\n/);
      expect(lines[1]).toBe("Alice,'=SUM(A1:A10)");
    });
  });
});
