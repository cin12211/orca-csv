import { describe, expect, it } from 'vitest';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils/createCsvFileHandleFromFiles';
import { MAX_CSV_TABS } from '~/components/modules/csv-editor/constants';

describe('createCsvFileHandlesFromFiles', () => {
  it('creates handles for valid CSV files', async () => {
    const file1 = new File(['name,age\nAlice,30'], 'data.csv', { type: 'text/csv' });
    const file2 = new File(['x,y\n1,2'], 'other.csv', { type: 'text/csv' });

    const handles = await createCsvFileHandlesFromFiles([file1, file2]);

    expect(handles).toHaveLength(2);
    expect(handles[0].name).toBe('data.csv');
    expect(handles[1].name).toBe('other.csv');
    expect(handles[0].platform).toBe('web');
    expect(handles[0]._file).toBe(file1);
    expect(handles[0].id).toContain('web-data.csv');
  });

  it('skips non-CSV files', async () => {
    const csvFile = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });
    const txtFile = new File(['hello'], 'readme.txt', { type: 'text/plain' });
    const jsonFile = new File(['{}'], 'config.json', { type: 'application/json' });

    const handles = await createCsvFileHandlesFromFiles([csvFile, txtFile, jsonFile]);

    expect(handles).toHaveLength(1);
    expect(handles[0].name).toBe('data.csv');
  });

  it('skips files exceeding 50MB limit', async () => {
    const MAX_CSV_FILE_SIZE = 50 * 1024 * 1024;

    const smallFile = new File(['a,b\n1,2'], 'small.csv', { type: 'text/csv' });
    const headers = 'x'.repeat(100);
    const bigContent = headers + '\n' + 'v'.repeat(MAX_CSV_FILE_SIZE);
    const bigFile = new File([bigContent], 'big.csv', { type: 'text/csv' });

    const handles = await createCsvFileHandlesFromFiles([smallFile, bigFile]);

    expect(handles).toHaveLength(1);
    expect(handles[0].name).toBe('small.csv');
  });

  it('returns empty array for empty input', async () => {
    const handles = await createCsvFileHandlesFromFiles([]);

    expect(handles).toEqual([]);
  });

  it('returns empty array when all files are non-CSV', async () => {
    const txtFile = new File(['hello'], 'readme.txt');

    const handles = await createCsvFileHandlesFromFiles([txtFile]);

    expect(handles).toEqual([]);
  });

  it('limits to MAX_CSV_TABS files', async () => {
    const files = Array.from({ length: MAX_CSV_TABS + 5 }, (_, i) =>
      new File([`a,b\n1,2`], `file${i}.csv`, { type: 'text/csv' })
    );

    const handles = await createCsvFileHandlesFromFiles(files);

    expect(handles).toHaveLength(MAX_CSV_TABS);
  });

  it('handles exactly MAX_CSV_TABS files', async () => {
    const files = Array.from({ length: MAX_CSV_TABS }, (_, i) =>
      new File([`a,b\n1,2`], `file${i}.csv`, { type: 'text/csv' })
    );

    const handles = await createCsvFileHandlesFromFiles(files);

    expect(handles).toHaveLength(MAX_CSV_TABS);
  });
});

describe('createCsvFileHandleFromWebDrag (via dragDrop)', () => {
  it('createCsvFileHandlesFromDrop handles DataTransfer', async () => {
    const { createCsvFileHandlesFromDrop } = await import('~/components/modules/csv-editor/utils/dragDrop');

    // Create DataTransfer with CSV file
    const dt = new DataTransfer();
    dt.items.add(new File(['name,age\nAlice,30'], 'test.csv', { type: 'text/csv' }));

    const handles = await createCsvFileHandlesFromDrop(dt);

    expect(handles).toHaveLength(1);
    expect(handles[0].name).toBe('test.csv');
  });

  it('createCsvFileHandlesFromDrop skips non-file items', async () => {
    const { createCsvFileHandlesFromDrop } = await import('~/components/modules/csv-editor/utils/dragDrop');

    const dt = new DataTransfer();
    dt.items.add('text', 'text/plain');

    const handles = await createCsvFileHandlesFromDrop(dt);

    expect(handles).toEqual([]);
  });

  it('createCsvFileHandlesFromDrop limits to MAX_CSV_TABS', async () => {
    const { createCsvFileHandlesFromDrop } = await import('~/components/modules/csv-editor/utils/dragDrop');

    const dt = new DataTransfer();
    for (let i = 0; i < MAX_CSV_TABS + 5; i++) {
      dt.items.add(new File([`a,b\n1,2`], `file${i}.csv`, { type: 'text/csv' }));
    }

    const handles = await createCsvFileHandlesFromDrop(dt);

    expect(handles.length).toBeLessThanOrEqual(MAX_CSV_TABS);
  });
});
