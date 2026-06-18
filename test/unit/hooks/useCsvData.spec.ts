import { ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useCsvData } from '~/components/modules/csv-editor/hooks/useCsvData';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { CsvFileHandle, CsvFileSystemAPI } from '~/core/services/csv';

function createMockFileSystem(csvContent: string): CsvFileSystemAPI {
  return {
    readFile: vi.fn().mockResolvedValue(csvContent),
    writeFile: vi.fn().mockResolvedValue(undefined),
    openFiles: vi.fn().mockResolvedValue([]),
    validateFile: vi.fn().mockResolvedValue({ valid: true }),
    getFileMetadata: vi.fn().mockResolvedValue({ name: 'test.csv', size: 100, type: 'text/csv', lastModified: 0 }),
  };
}

function createMockFileHandle(name = 'test.csv'): CsvFileHandle {
  return {
    id: 'web-test-1',
    name,
    size: 100,
    lastModified: 0,
    platform: 'web',
    _file: new File([''], name),
  };
}

describe('useCsvData', () => {
  it('has empty initial state', () => {
    const fileHandle = ref<CsvFileHandle | null>(null);
    const mockFs = createMockFileSystem('');

    const { data, headers, originalData, isLoading, parseError, rowCount, columnCount } =
      useCsvData({ fileHandle, csvFileSystem: mockFs });

    expect(data.value).toEqual([]);
    expect(headers.value).toEqual([]);
    expect(originalData.value).toEqual([]);
    expect(isLoading.value).toBe(false);
    expect(parseError.value).toBeUndefined();
    expect(rowCount.value).toBe(0);
    expect(columnCount.value).toBe(0);
  });

  it('loads and parses CSV data', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const fileHandle = ref<CsvFileHandle | null>(createMockFileHandle());
    const mockFs = createMockFileSystem(csv);

    const { data, headers, originalData, originalHeaders } =
      useCsvData({ fileHandle, csvFileSystem: mockFs });

    const result = useCsvData({ fileHandle, csvFileSystem: mockFs });
    await (result as any).loadCsvData();

    expect(result.data.value).toHaveLength(2);
    expect(result.headers.value).toEqual(['name', 'age']);
    expect(result.originalHeaders.value).toEqual(['name', 'age']);
    expect(result.rowCount.value).toBe(2);
    expect(result.columnCount.value).toBe(2);
    expect(result.isLoading.value).toBe(false);
    expect(result.parseError.value).toBeUndefined();

    expect(result.data.value[0]).toEqual({
      [HASH_INDEX_ID]: 0,
      name: 'Alice',
      age: '30',
    });
    expect(result.data.value[1]).toEqual({
      [HASH_INDEX_ID]: 1,
      name: 'Bob',
      age: '25',
    });

    expect(result.originalData.value).toEqual(result.data.value);
    expect(result.originalData.value).not.toBe(result.data.value);
  });

  it('does nothing when fileHandle is null', async () => {
    const fileHandle = ref<CsvFileHandle | null>(null);
    const mockFs = createMockFileSystem('name,age\nAlice,30');

    const { data, parseError, headers } = useCsvData({ fileHandle, csvFileSystem: mockFs });

    await data.value as any;
    expect(data.value).toEqual([]);
    expect(headers.value).toEqual([]);
    expect(parseError.value).toBeUndefined();
  });

  it('catches and reports read errors', async () => {
    const fileHandle = ref<CsvFileHandle | null>(createMockFileHandle());
    const mockFs: CsvFileSystemAPI = {
      readFile: vi.fn().mockRejectedValue(new Error('Read failed')),
      writeFile: vi.fn(),
      openFiles: vi.fn(),
      validateFile: vi.fn(),
      getFileMetadata: vi.fn(),
    };

    const { parseError, isLoading, loadCsvData } = useCsvData({ fileHandle, csvFileSystem: mockFs });

    await loadCsvData();

    expect(parseError.value).toBe('Read failed');
    expect(isLoading.value).toBe(false);
  });

  it('originalData is a deep copy, not a reference', async () => {
    const csv = 'name,age\nAlice,30';
    const fileHandle = ref<CsvFileHandle | null>(createMockFileHandle());
    const mockFs = createMockFileSystem(csv);

    const { data, originalData, loadCsvData } = useCsvData({ fileHandle, csvFileSystem: mockFs });

    await loadCsvData();

    expect(data.value).toHaveLength(1);
    expect(originalData.value).toHaveLength(1);
    expect(originalData.value).toEqual(data.value);
    expect(originalData.value).not.toBe(data.value);

    // Mutating data should not affect originalData
    data.value[0].name = 'Modified';
    expect(originalData.value[0].name).toBe('Alice');
  });

  it('refreshData re-loads the file', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const fileHandle = ref<CsvFileHandle | null>(createMockFileHandle());
    const mockFs = createMockFileSystem(csv);

    const { refreshData, rowCount } = useCsvData({ fileHandle, csvFileSystem: mockFs });

    await refreshData();

    expect(rowCount.value).toBe(2);
    expect(mockFs.readFile).toHaveBeenCalled();
  });
});
