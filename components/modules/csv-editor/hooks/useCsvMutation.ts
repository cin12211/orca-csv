import { ref, type Ref } from 'vue';
import type { CsvFileHandle, CsvFileSystemAPI } from '@/core/services/csv';
import { HASH_INDEX_ID } from '~/core/constants';
import type { RowData } from '../types';
import { formatCsv } from '../utils';
import type { UseCsvEditedCellsReturn } from './useCsvEditedCells';

export interface UseCsvMutationOptions {
  /** File handle to save to */
  fileHandle: Ref<CsvFileHandle | null>;

  /** Whether the current file can be modified */
  isReadOnly: Ref<boolean>;

  /** Current data */
  data: Ref<RowData[]>;

  /** CSV headers */
  headers: Ref<string[]>;

  /** Has headers row */
  hasHeaders: Ref<boolean>;

  /** Edited cells tracker */
  editedCells: UseCsvEditedCellsReturn;

  /** File system implementation */
  csvFileSystem: CsvFileSystemAPI;

  /** Callback after successful save */
  onSaveSuccess?: () => void;

  /** Optional callback to reload/discard changes */
  onDiscard?: () => void;
}

export interface CsvAddColumnOptions {
  position?: 'left' | 'right' | 'end';
  referenceColumn?: string;
}

export interface UseCsvMutationReturn {
  // State
  isSaving: Ref<boolean>;
  saveError: Ref<string | undefined>;

  // Actions
  onSaveData(): Promise<void>;
  onAddEmptyRow(): void;
  onAddRowAt(rowIndex: number, position: 'above' | 'below'): void;
  onAddColumn(columnName: string, options?: CsvAddColumnOptions): void;
  onDeleteColumn(columnName: string): void;
  onDeleteRows(rowIds: number[]): Promise<void>;
  onDiscardChanges(): void;
}

export function useCsvMutation(
  options: UseCsvMutationOptions
): UseCsvMutationReturn {
  const isSaving = ref(false);
  const saveError = ref<string | undefined>(undefined);

  const ensureWritable = (): boolean => {
    if (!options.isReadOnly.value) {
      return true;
    }

    saveError.value = 'This CSV file is read-only in the browser';
    return false;
  };

  const onSaveData = async () => {
    if (!ensureWritable()) {
      return;
    }
    const handle = options.fileHandle.value;
    if (!handle) {
      saveError.value = 'No file open';
      return;
    }

    isSaving.value = true;
    saveError.value = undefined;

    try {
      // Format current data to CSV
      // Order columns by options.headers.value
      const currentHeaders = options.headers.value;
      const rowsToFormat = options.data.value.map(row => {
        const formattedRow: Record<string, string> = {};
        currentHeaders.forEach(header => {
          const val = row[header];
          formattedRow[header] =
            val !== undefined && val !== null ? String(val) : '';
        });
        return formattedRow;
      });

      const csvContent = await formatCsv(rowsToFormat, {
        includeHeaders: options.hasHeaders.value,
        headers: currentHeaders,
      });

      // Write to file
      await options.csvFileSystem.writeFile(handle, csvContent);

      // Clear edit state
      options.editedCells.clearEdits();

      // Trigger success callback
      if (options.onSaveSuccess) {
        options.onSaveSuccess();
      }
    } catch (error) {
      console.error('Failed to save CSV file:', error);
      saveError.value =
        error instanceof Error ? error.message : 'Failed to save file';
    } finally {
      isSaving.value = false;
    }
  };

  const onAddEmptyRow = () => {
    if (!ensureWritable()) {
      return;
    }

    const currentData = options.data.value;
    const currentHeaders = options.headers.value;

    const newRowId =
      currentData.length > 0
        ? Math.max(...currentData.map(r => r[HASH_INDEX_ID])) + 1
        : 0;

    const newRow: RowData = {
      [HASH_INDEX_ID]: newRowId,
    };

    currentHeaders.forEach(header => {
      newRow[header] = '';
    });

    currentData.push(newRow);

    // Track as a new row in editedCells
    options.editedCells.editedCells.value.push({
      rowId: newRowId,
      changedData: {},
      isNewRow: true,
    });
  };

  const onAddRowAt = (rowIndex: number, position: 'above' | 'below') => {
    if (!ensureWritable()) {
      return;
    }

    const currentData = options.data.value;
    const currentHeaders = options.headers.value;

    const newRowId =
      currentData.length > 0
        ? Math.max(...currentData.map(r => r[HASH_INDEX_ID])) + 1
        : 0;

    const newRow: RowData = {
      [HASH_INDEX_ID]: newRowId,
    };

    currentHeaders.forEach(header => {
      newRow[header] = '';
    });

    const targetIndex = position === 'above' ? rowIndex : rowIndex + 1;
    currentData.splice(targetIndex, 0, newRow);

    // Track as a new row in editedCells
    options.editedCells.editedCells.value.push({
      rowId: newRowId,
      changedData: {},
      isNewRow: true,
    });
  };

  const onAddColumn = (
    columnName: string,
    addColumnOptions?: CsvAddColumnOptions
  ) => {
    if (!ensureWritable()) {
      return;
    }

    const trimmed = columnName.trim();
    if (!trimmed || options.headers.value.includes(trimmed)) return;

    const nextHeaders = [...options.headers.value];
    const targetPosition = addColumnOptions?.position ?? 'end';
    const referenceColumn = addColumnOptions?.referenceColumn;

    if (targetPosition === 'end' || !referenceColumn) {
      nextHeaders.push(trimmed);
    } else {
      const referenceIndex = nextHeaders.indexOf(referenceColumn);

      if (referenceIndex === -1) {
        nextHeaders.push(trimmed);
      } else {
        const insertIndex =
          targetPosition === 'left' ? referenceIndex : referenceIndex + 1;
        nextHeaders.splice(insertIndex, 0, trimmed);
      }
    }

    options.headers.value = nextHeaders;
    options.data.value.forEach(row => {
      row[trimmed] = '';
    });
  };

  const onDeleteColumn = (columnName: string) => {
    if (!ensureWritable()) {
      return;
    }

    const index = options.headers.value.indexOf(columnName);
    if (index === -1) return;

    options.headers.value.splice(index, 1);
    options.data.value.forEach(row => {
      delete row[columnName];
    });

    // Remove any edits for this column
    options.editedCells.editedCells.value.forEach(edit => {
      delete edit.changedData[columnName];
    });

    // Filter out rows that have no edits left and aren't new rows
    options.editedCells.editedCells.value =
      options.editedCells.editedCells.value.filter(
        edit => edit.isNewRow || Object.keys(edit.changedData).length > 0
      );
  };

  const onDeleteRows = async (rowIds: number[]) => {
    if (!ensureWritable()) {
      return;
    }

    options.data.value = options.data.value.filter(
      row => !rowIds.includes(row[HASH_INDEX_ID])
    );
    // Remove deleted rows from editedCells tracking
    options.editedCells.editedCells.value =
      options.editedCells.editedCells.value.filter(
        edit => !rowIds.includes(edit.rowId)
      );
    // Persist deletion immediately to file
    await onSaveData();
  };

  const onDiscardChanges = () => {
    options.editedCells.clearEdits();
    if (options.onDiscard) {
      options.onDiscard();
    }
  };

  return {
    isSaving,
    saveError,
    onSaveData,
    onAddEmptyRow,
    onAddRowAt,
    onAddColumn,
    onDeleteColumn,
    onDeleteRows,
    onDiscardChanges,
  };
}
