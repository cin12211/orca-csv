import { isElectron } from '../../helpers/environment';
import { ElectronCsvFileSystem } from './ElectronCsvFileSystem';
import { WebCsvFileSystem } from './WebCsvFileSystem';
import type { CsvFileSystemAPI, CsvFileHandle } from './types';

export * from './types';
export * from './errors';
export { ElectronCsvFileSystem } from './ElectronCsvFileSystem';
export { WebCsvFileSystem } from './WebCsvFileSystem';
export type { CsvFileHandle } from './types';
export type { CsvFileSystemAPI } from './types';

export function isFileSystemAPISupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'FileSystemFileHandle' in window
  );
}

export function createCsvFileSystemForHandle(_handle: CsvFileHandle): CsvFileSystemAPI {
  return new WebCsvFileSystem();
}

export function createCsvFileSystem(): CsvFileSystemAPI {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  } else if (isFileSystemAPISupported()) {
    return new WebCsvFileSystem();
  }
  throw new Error('CSV editor not supported on this platform');
}
