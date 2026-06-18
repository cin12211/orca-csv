import type { CellValueChangedEvent } from 'ag-grid-community';
import type { CsvFileHandle } from '@/core/services/csv';
import type { HASH_INDEX_ID } from '~/components/base/data-grid/constants/constants';

export interface RowData {
  /** Unique row identifier for AG Grid */
  [HASH_INDEX_ID]: number;

  /** CSV column values keyed by header name or index */
  [columnName: string]: string | number | boolean | null | undefined;
}

export interface CsvEditedCell {
  /** Row index / ID in data array */
  rowId: number;

  /** Changed column values */
  changedData: Record<string, string>;

  /** True if this is a newly added row */
  isNewRow?: boolean;
}

export interface OpenCsvEditorTabParams {
  /** File handle */
  fileHandle: CsvFileHandle;

  /** Whether first row is headers */
  hasHeaders?: boolean;
}

export interface CsvParseOptions {
  /** First row contains headers */
  headers?: boolean;

  /** CSV delimiter character */
  delimiter?: string;

  /** Skip empty lines */
  skipEmptyLines?: boolean;

  /** Trim whitespace */
  trim?: boolean;
}

export interface CsvParseResult {
  /** Parsed rows as objects */
  rows: Record<string, string>[];

  /** Column headers */
  headers: string[];
}

export interface CsvFormatOptions {
  /** Include headers row */
  includeHeaders?: boolean;

  /** Column headers */
  headers?: string[];

  /** CSV delimiter */
  delimiter?: string;

  /** Quote character */
  quote?: string;
}
