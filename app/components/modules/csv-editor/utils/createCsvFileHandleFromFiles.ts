import type { CsvFileHandle } from '~/core/services/csv';
import { MAX_CSV_FILE_SIZE, MAX_CSV_TABS } from '../constants';

export async function createCsvFileHandlesFromFiles(
  files: File[]
): Promise<CsvFileHandle[]> {
  const handles: CsvFileHandle[] = [];

  for (const file of files) {
    if (handles.length >= MAX_CSV_TABS) break;
    if (!file.name.endsWith('.csv')) continue;
    if (file.size > MAX_CSV_FILE_SIZE) continue;

    handles.push({
      id: `web-${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _file: file,
    });
  }

  return handles;
}
