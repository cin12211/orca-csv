import type { CsvFileSystemAPI, CsvFileHandle, FileValidation, FileMetadata } from './types';
import { openCsvFiles, readCsvFile, writeCsvFile } from '~/core/composables/useCsvFileSystemAccess';

export class WebCsvFileSystem implements CsvFileSystemAPI {
  async openFiles(): Promise<CsvFileHandle[]> {
    return await openCsvFiles();
  }

  async readFile(handle: CsvFileHandle): Promise<string> {
    return await readCsvFile(handle);
  }

  async writeFile(handle: CsvFileHandle, content: string): Promise<void> {
    if (handle._webHandle) {
      await writeCsvFile(handle._webHandle, content);
      return;
    }
    if (handle._file) {
      throw new Error('File dropped via drag-and-drop cannot be saved back. Use "Save As" to download.');
    }
    throw new Error('Invalid Web file handle');
  }

  async validateFile(handle: CsvFileHandle): Promise<FileValidation> {
    try {
      let file: File | null = null;
      if (handle._webHandle) {
        file = await handle._webHandle.getFile();
      } else if (handle._file) {
        file = handle._file;
      } else {
        return { valid: false, error: 'Invalid file handle' };
      }
      if (!file.name.endsWith('.csv')) {
        return { valid: false, error: 'File is not a CSV file' };
      }
      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: 'File is too large (max 50MB)' };
      }
      return { valid: true, size: file.size, lastModified: file.lastModified };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata> {
    let file: File | null = null;
    if (handle._webHandle) {
      file = await handle._webHandle.getFile();
    } else if (handle._file) {
      file = handle._file;
    } else {
      throw new Error('Invalid Web file handle');
    }
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'text/csv',
      lastModified: file.lastModified,
    };
  }
}
