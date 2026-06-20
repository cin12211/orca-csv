import { useFileSystemAccess } from '@vueuse/core';
import {
  openCsvFiles,
  readCsvFile,
  writeCsvFile,
} from '~/core/composables/useCsvFileSystemAccess';
import {
  MAX_CSV_FILE_SIZE,
  type CsvFileSystemAPI,
  type CsvFileHandle,
  type FileValidation,
  type FileMetadata,
} from './types';

// Static cache to preserve useFileSystemAccess instances across tab switches/component remounts
const fsAccessMap = new Map<string, ReturnType<typeof useFileSystemAccess>>();

export class WebCsvFileSystem implements CsvFileSystemAPI {
  private fsAccess: ReturnType<typeof useFileSystemAccess>;

  constructor(fsAccess?: any, handleId?: string) {
    if (handleId && fsAccessMap.has(handleId)) {
      this.fsAccess = fsAccessMap.get(handleId)!;
    } else {
      this.fsAccess =
        fsAccess ||
        useFileSystemAccess({
          dataType: 'Text',
          types: [
            {
              description: 'CSV Files',
              accept: { 'text/csv': ['.csv'] },
            },
          ],
        });
      if (handleId) {
        fsAccessMap.set(handleId, this.fsAccess);
      }
    }
  }

  async openFiles(): Promise<CsvFileHandle[]> {
    return await openCsvFiles();
  }

  async readFile(handle: CsvFileHandle): Promise<string> {
    if (this.fsAccess.file.value) {
      await this.fsAccess.updateData();
      if (
        this.fsAccess.data.value !== undefined &&
        this.fsAccess.data.value !== null
      ) {
        return this.fsAccess.data.value as string;
      }
    }
    return await readCsvFile(handle);
  }

  async writeFile(handle: CsvFileHandle, content: string): Promise<void> {
    if (handle._webHandle && typeof handle._webHandle.createWritable === 'function') {
      await writeCsvFile(handle._webHandle, content);
      return;
    }

    if (!this.fsAccess.isSupported.value) {
      throw new Error(
        'File System Access API is not supported in this browser'
      );
    }

    this.fsAccess.data.value = content;
    await this.fsAccess.save({ suggestedName: handle.name });

    if (this.fsAccess.file.value) {
      handle.name = this.fsAccess.file.value.name;
      handle.size = this.fsAccess.file.value.size;
      handle.lastModified = this.fsAccess.file.value.lastModified;
    }
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

      if (file.size > MAX_CSV_FILE_SIZE) {
        return { valid: false, error: 'File is too large (max 200MB)' };
      }

      return {
        valid: true,
        size: file.size,
        lastModified: file.lastModified,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
