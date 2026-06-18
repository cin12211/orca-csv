import { isElectron } from '@/core/helpers/environment';
import type { CsvFileHandle } from '~/core/services/csv';
import { MAX_CSV_FILE_SIZE } from '../constants';
import { createCsvFileHandleFromElectronDrag } from './dragDrop';

/**
 * Create CSV file handles from File objects (e.g., from useDropZone)
 * Note: File objects cannot be serialized, so web fallback handles created this way
 * cannot be persisted across page reloads. They're only valid for the
 * current session.
 */
export async function createCsvFileHandlesFromFiles(
  files: File[]
): Promise<CsvFileHandle[]> {
  const handles: CsvFileHandle[] = [];

  for (const file of files) {
    if (!file.name.endsWith('.csv')) continue;
    if (file.size > MAX_CSV_FILE_SIZE) continue;

    console.log(
      '🔍 [createCsvFileHandlesFromFiles] Creating handle for file:',
      {
        name: file.name,
        size: file.size,
        type: file.type,
        isElectron: isElectron(),
      }
    );

    if (isElectron()) {
      const electronHandle = await createCsvFileHandleFromElectronDrag(
        file as File & { path?: string }
      );

      if (electronHandle) {
        handles.push(electronHandle);
        continue;
      }
    }

    handles.push({
      id: `web-${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _file: file,
    });
  }

  console.log(
    '🔍 [createCsvFileHandlesFromFiles] Created handles:',
    handles.length
  );
  return handles;
}
