export interface CsvFileHandle {
  id: string;
  name: string;
  path?: string;
  size: number;
  lastModified: number;
  platform: 'electron' | 'web';
  _electronPath?: string;
  _webHandle?: FileSystemFileHandle;
  _file?: File;
  _cachedContent?: string;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
  size?: number;
  lastModified?: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface CsvFileSystemAPI {
  openFiles(): Promise<CsvFileHandle[]>;
  readFile(handle: CsvFileHandle): Promise<string>;
  writeFile(handle: CsvFileHandle, content: string): Promise<void>;
  watchFile?(handle: CsvFileHandle, callback: () => void): () => void;
  validateFile(handle: CsvFileHandle): Promise<FileValidation>;
  getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata>;
}
