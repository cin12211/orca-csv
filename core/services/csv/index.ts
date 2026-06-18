import { isElectron } from '../../helpers/environment';
import { ElectronCsvFileSystem } from './ElectronCsvFileSystem';
import { WebCsvFileSystem } from './WebCsvFileSystem';
import type { CsvFileSystemAPI, CsvFileHandle } from './types';

export * from './types';
export * from './errors';
export { ElectronCsvFileSystem } from './ElectronCsvFileSystem';
export { WebCsvFileSystem } from './WebCsvFileSystem';
export type { CsvFileHandle } from './types';

/**
 * Check if File System API is available in browser
 */
export function isFileSystemAPISupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'FileSystemFileHandle' in window
  );
}

/**
 * Check if FileSystemObserver is supported (file watching)
 */
export function isFileSystemObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'FileSystemObserver' in window;
}

/**
 * Create appropriate file system implementation for a specific file handle
 * @param handle - The file handle to determine the platform from
 * @returns Platform-specific CsvFileSystemAPI instance
 */
export function createCsvFileSystemForHandle(
  handle: CsvFileHandle
): CsvFileSystemAPI {
  if (handle.platform === 'electron') {
    return new ElectronCsvFileSystem();
  } else {
    return new WebCsvFileSystem();
  }
}

/**
 * Create appropriate file system implementation for current platform
 * @returns Platform-specific CsvFileSystemAPI instance
 * @throws Error if neither platform is available
 * @deprecated Use createCsvFileSystemForHandle instead to respect file handle platform
 */
export function createCsvFileSystem(): CsvFileSystemAPI {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  } else if (isFileSystemAPISupported()) {
    return new WebCsvFileSystem();
  } else {
    throw new Error('CSV editor not supported on this platform');
  }
}

/**
 * Get file system implementation with fallback
 */
export function getCsvFileSystemOrFallback(): CsvFileSystemAPI | null {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  }

  if (isFileSystemAPISupported()) {
    return new WebCsvFileSystem();
  }

  return null;
}
