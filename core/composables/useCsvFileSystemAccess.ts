import { markRaw } from 'vue';
import type { CsvFileHandle } from '~/core/services/csv/types';

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

/**
 * Open file picker and return CSV file handles
 * Supports multiple file selection
 */
export async function openCsvFiles(): Promise<CsvFileHandle[]> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System API not supported on this platform');
  }

  try {
    const handles = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'CSV Files',
          accept: { 'text/csv': ['.csv'] },
        },
      ],
      multiple: true,
    });

    return await Promise.all(
      handles.map(async (handle: FileSystemFileHandle) => {
        const file = await handle.getFile();
        return createCsvFileHandle(handle, file);
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    throw error;
  }
}

/**
 * Write content to a file using its FileSystemFileHandle
 */
export async function writeCsvFile(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Read content from a CSV file handle
 */
export async function readCsvFile(handle: CsvFileHandle): Promise<string> {
  if (handle._cachedContent) {
    return handle._cachedContent;
  }

  if (handle._webHandle) {
    const file = await handle._webHandle.getFile();
    return await file.text();
  }

  if (handle._file) {
    return await handle._file.text();
  }

  throw new Error('Invalid Web file handle');
}

/**
 * Create CsvFileHandle from FileSystemFileHandle
 */
export function createCsvFileHandle(
  webHandle: FileSystemFileHandle,
  file: File
): CsvFileHandle {
  return {
    id: `web-${file.name}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    platform: 'web',
    _webHandle: markRaw(webHandle),
  };
}
