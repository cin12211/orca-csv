import type { CsvFileHandle } from '@/core/services/csv';
import { MAX_CSV_FILE_SIZE, MAX_CSV_TABS } from '../constants';

export async function createCsvFileHandleFromWebDrag(
  item: DataTransferItem
): Promise<CsvFileHandle | null> {
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
        _webHandle: fileHandle,
        _file: file,
      };
    }
  }

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
    _file: file,
  };
}

export async function createCsvFileHandlesFromDrop(
  dataTransfer: DataTransfer
): Promise<CsvFileHandle[]> {
  const handles: CsvFileHandle[] = [];
  const items = Array.from(dataTransfer.items);

  for (const item of items) {
    if (handles.length >= MAX_CSV_TABS) break;
    if (item.kind === 'file') {
      const handle = await createCsvFileHandleFromWebDrag(item);
      if (handle) {
        handles.push(handle);
      }
    }
  }

  return handles;
}
