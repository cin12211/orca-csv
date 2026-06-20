import { markRaw } from 'vue';
import { MAX_CSV_FILE_SIZE } from '../constants/csv-editor.constants';
import type { CsvFileHandle } from '@/core/services/csv';

/**
 * Create file handle from Web drag-drop event item
 * @param item DataTransferItem from drop event
 */
export async function createCsvFileHandleFromWebDrag(
  item: DataTransferItem
): Promise<CsvFileHandle | null> {
  // --- Preferred path: File System Access API (Chrome 86+) ---
  const itemAsAny = item as any;
  if (typeof itemAsAny.getAsFileSystemHandle === 'function') {
    const handle = await itemAsAny.getAsFileSystemHandle();

    if (handle && handle.kind === 'file') {
      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();

      if (!file.name.endsWith('.csv')) return null;
      if (file.size > MAX_CSV_FILE_SIZE) return null;

      return {
        id: `web-${file.name}-${file.lastModified}`,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        platform: 'web',
        _webHandle: markRaw(fileHandle),
        _file: markRaw(file),
      };
    }
  }

  // --- Fallback: classic File API (Firefox, Safari, older Chrome) ---
  const file = item.getAsFile();
  if (!file) return null;
  if (!file.name.endsWith('.csv')) return null;
  if (file.size > MAX_CSV_FILE_SIZE) return null;

  return {
    id: `web-${file.name}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    platform: 'web',
    _file: markRaw(file),
  };
}

/**
 * Unified helper to create file handles from a drop event
 */
export async function createCsvFileHandlesFromDrop(
  dataTransfer: DataTransfer
): Promise<CsvFileHandle[]> {
  const handles: CsvFileHandle[] = [];

  const items = Array.from(dataTransfer.items);
  for (const item of items) {
    if (item.kind === 'file') {
      const handle = await createCsvFileHandleFromWebDrag(item);
      if (handle) {
        handles.push(handle);
      }
    }
  }

  return handles;
}
