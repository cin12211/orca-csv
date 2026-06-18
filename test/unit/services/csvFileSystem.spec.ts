import { describe, expect, it, vi } from 'vitest';
import { WebCsvFileSystem } from '~/core/services/csv/WebCsvFileSystem';
import { CsvFileSystemError, CsvErrorCode } from '~/core/services/csv/errors';
import { createCsvFileSystemForHandle, createCsvFileSystem } from '~/core/services/csv';

describe('WebCsvFileSystem', () => {
  it('returns valid for CSV file with web handle', async () => {
    const fs = new WebCsvFileSystem();
    const mockFileHandle: FileSystemFileHandle = {
      kind: 'file',
      name: 'test.csv',
      getFile: vi.fn().mockResolvedValue(new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' })),
    } as unknown as FileSystemFileHandle;

    const result = await fs.validateFile({
      id: 'test',
      name: 'test.csv',
      size: 100,
      lastModified: 0,
      platform: 'web',
      _webHandle: mockFileHandle,
    });

    expect(result.valid).toBe(true);
  });

  it('returns invalid for non-CSV file extension', async () => {
    const fs = new WebCsvFileSystem();
    const mockFileHandle: FileSystemFileHandle = {
      kind: 'file',
      name: 'test.txt',
      getFile: vi.fn().mockResolvedValue(new File(['hello'], 'test.txt', { type: 'text/plain' })),
    } as unknown as FileSystemFileHandle;

    const result = await fs.validateFile({
      id: 'test',
      name: 'test.txt',
      size: 100,
      lastModified: 0,
      platform: 'web',
      _webHandle: mockFileHandle,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe('File is not a CSV file');
  });

  it('returns invalid for file exceeding 50MB', async () => {
    const fs = new WebCsvFileSystem();
    const largeFile = new File([], 'large.csv', { type: 'text/csv' });
    Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });
    const mockFileHandle: FileSystemFileHandle = {
      kind: 'file',
      name: 'large.csv',
      getFile: vi.fn().mockResolvedValue(largeFile),
    } as unknown as FileSystemFileHandle;

    const result = await fs.validateFile({
      id: 'test',
      name: 'large.csv',
      size: 51 * 1024 * 1024,
      lastModified: 0,
      platform: 'web',
      _webHandle: mockFileHandle,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toBe('File is too large (max 50MB)');
  });

  it('readFile reads from File object', async () => {
    const fs = new WebCsvFileSystem();
    const file = new File(['name,age\nAlice,30'], 'test.csv', { type: 'text/csv' });

    const content = await fs.readFile({
      id: 'test',
      name: 'test.csv',
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _file: file,
    });

    expect(content).toBe('name,age\nAlice,30');
  });

  it('readFile reads from cached content', async () => {
    const fs = new WebCsvFileSystem();

    const content = await fs.readFile({
      id: 'test',
      name: 'test.csv',
      size: 100,
      lastModified: 0,
      platform: 'web',
      _cachedContent: 'cached data',
    });

    expect(content).toBe('cached data');
  });

  it('writeFile for drag-drop file without web handle throws error', async () => {
    const fs = new WebCsvFileSystem();

    await expect(
      fs.writeFile(
        {
          id: 'test',
          name: 'test.csv',
          size: 100,
          lastModified: 0,
          platform: 'web',
          _file: new File([''], 'test.csv'),
        },
        'new content'
      )
    ).rejects.toThrow('File dropped via drag-and-drop cannot be saved back');
  });

  it('getFileMetadata returns file info', async () => {
    const fs = new WebCsvFileSystem();
    const file = new File(['a,b\n1,2'], 'meta.csv', { type: 'text/csv' });

    const meta = await fs.getFileMetadata({
      id: 'test',
      name: 'meta.csv',
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _file: file,
    });

    expect(meta.name).toBe('meta.csv');
    expect(meta.type).toBe('text/csv');
  });
});

describe('CsvFileSystemError', () => {
  it('creates error with code', () => {
    const error = new CsvFileSystemError('Test error', CsvErrorCode.PARSE_ERROR);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe(CsvErrorCode.PARSE_ERROR);
    expect(error.name).toBe('CsvFileSystemError');
    expect(error).toBeInstanceOf(Error);
  });

  it('stores original error', () => {
    const original = new Error('Root cause');
    const error = new CsvFileSystemError('Wrapped', CsvErrorCode.WRITE_ERROR, original);

    expect(error.originalError).toBe(original);
  });
});

describe('createCsvFileSystemForHandle', () => {
  it('returns WebCsvFileSystem for web platform handle', () => {
    const fs = createCsvFileSystemForHandle({
      id: 'test',
      name: 'test.csv',
      size: 100,
      lastModified: 0,
      platform: 'web',
      _file: new File([''], 'test.csv'),
    });

    expect(fs).toBeInstanceOf(WebCsvFileSystem);
  });
});
