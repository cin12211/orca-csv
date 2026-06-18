import type { CellValueChangedEvent } from 'ag-grid-community';
import type { CsvFileHandle } from '@/core/services/csv';
import type { HASH_INDEX_ID } from '~/components/base/data-grid/constants';

export interface RowData {
  [HASH_INDEX_ID]: number;
  [columnName: string]: string | number | boolean | null | undefined;
}

export interface CsvEditedCell {
  rowId: number;
  changedData: Record<string, string>;
  isNewRow?: boolean;
}

export interface OpenCsvEditorTabParams {
  fileHandle: CsvFileHandle;
  hasHeaders?: boolean;
}

export interface CsvParseOptions {
  headers?: boolean;
  delimiter?: string;
  skipEmptyLines?: boolean;
  trim?: boolean;
}

export interface CsvParseResult {
  rows: Record<string, string>[];
  headers: string[];
}

export interface CsvFormatOptions {
  includeHeaders?: boolean;
  headers?: string[];
  delimiter?: string;
  quote?: string;
}
