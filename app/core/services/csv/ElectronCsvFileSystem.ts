import type { CsvFileSystemAPI, CsvFileHandle, FileValidation, FileMetadata } from './types';

export class ElectronCsvFileSystem implements CsvFileSystemAPI {
  private getApi() {
    const api = (window as any).electronAPI;
    if (!api || !api.csv) {
      throw new Error('Electron API is not available on this platform');
    }
    return api.csv;
  }

  async openFiles(): Promise<CsvFileHandle[]> {
    return [];
  }

  async readFile(handle: CsvFileHandle): Promise<string> {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }
    const api = this.getApi();
    const result = await api.readFile(handle._electronPath);
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    return result.content!;
  }

  async writeFile(handle: CsvFileHandle, content: string): Promise<void> {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }
    const api = this.getApi();
    const result = await api.writeFile(handle._electronPath, content);
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  watchFile(handle: CsvFileHandle, callback: () => void): () => void {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }
    const api = this.getApi();
    api.watchFile(handle._electronPath);
    const unwatch = api.onFileChanged(handle._electronPath, (eventType: string) => {
      if (eventType === 'change') callback();
    });
    const path = handle._electronPath;
    return () => {
      api.unwatchFile(path).catch((err: Error) => {
        console.error('Failed to unwatch file:', err);
      });
      unwatch();
    };
  }

  async validateFile(handle: CsvFileHandle): Promise<FileValidation> {
    if (!handle._electronPath) {
      return { valid: false, error: 'Invalid file handle' };
    }
    const api = this.getApi();
    const result = await api.validateFile(handle._electronPath);
    return {
      valid: result.valid,
      error: result.error,
      size: result.size,
      lastModified: result.lastModified,
    };
  }

  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata> {
    return {
      name: handle.name,
      size: handle.size,
      type: 'text/csv',
      lastModified: handle.lastModified,
    };
  }
}
