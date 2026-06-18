import { isElectron } from '@/core/helpers/environment';
import type { CsvFileHandle } from '@/core/services/csv';

/**
 * Create file handle from Electron drag-drop event file
 * @param file File from DataTransfer.files
 */
export async function createCsvFileHandleFromElectronDrag(
  file: File
): Promise<CsvFileHandle | null> {
  if (!window.electronAPI?.csv) {
    return null;
  }

  // Get file path via IPC
  const path = await window.electronAPI.csv.getPathForFile(file);
  if (!path) {
    return null;
  }

  // Validate via IPC
  const validation = await window.electronAPI.csv.validateFile(path);

  if (!validation.valid) {
    return null;
  }

  return {
    id: `electron-${path}`,
    name: file.name,
    path,
    size: validation.size!,
    lastModified: validation.lastModified!,
    platform: 'electron',
    _electronPath: path,
  };
}

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
      if (file.size > 50 * 1024 * 1024) return null;

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

  // --- Fallback: classic File API (Firefox, Safari, older Chrome) ---
  const file = item.getAsFile();
  if (!file) return null;
  if (!file.name.endsWith('.csv')) return null;
  if (file.size > 50 * 1024 * 1024) return null;

  return {
    id: `web-${file.name}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    platform: 'web',
    _file: file,
  };
}

/**
 * Unified helper to create file handles from a drop event
 */
export async function createCsvFileHandlesFromDrop(
  dataTransfer: DataTransfer
): Promise<CsvFileHandle[]> {
  const handles: CsvFileHandle[] = [];

  if (isElectron()) {
    const files = Array.from(dataTransfer.files);
    console.log('🚀 ~ createCsvFileHandlesFromDrop ~ files:', files);
    for (const file of files) {
      console.log('🚀 ~ createCsvFileHandlesFromDrop ~ file:', file);
      if (file.name.endsWith('.csv')) {
        const handle = await createCsvFileHandleFromElectronDrag(file);
        console.log('🚀 ~ createCsvFileHandlesFromDrop ~ handle:', handle);
        if (handle) {
          handles.push(handle);
        }
      }
    }
  } else {
    const items = Array.from(dataTransfer.items);
    for (const item of items) {
      if (item.kind === 'file') {
        const handle = await createCsvFileHandleFromWebDrag(item);
        if (handle) {
          handles.push(handle);
        }
      }
    }
  }

  return handles;
}
