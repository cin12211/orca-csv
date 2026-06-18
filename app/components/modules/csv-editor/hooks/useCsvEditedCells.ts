import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { CellValueChangedEvent } from 'ag-grid-community';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { CsvEditedCell, RowData } from '../types';

export interface UseCsvEditedCellsOptions {
  originalData: Ref<RowData[]>;
}

export interface UseCsvEditedCellsReturn {
  editedCells: Ref<CsvEditedCell[]>;
  onCellValueChanged(event: CellValueChangedEvent): void;
  clearEdits(): void;
  hasEditedRows(): boolean;
  getPendingEditedRows(): CsvEditedCell[];
  pendingChangesCount: ComputedRef<number>;
}

export function useCsvEditedCells(
  options: UseCsvEditedCellsOptions
): UseCsvEditedCellsReturn {
  const editedCells = ref<CsvEditedCell[]>([]);

  const pendingChangesCount = computed(() => editedCells.value.length);

  const onCellValueChanged = (event: CellValueChangedEvent) => {
    const rowId = event.data[HASH_INDEX_ID];
    const field = event.colDef.field;
    if (!field || rowId === undefined) return;

    const newValue =
      event.newValue !== undefined && event.newValue !== null
        ? String(event.newValue)
        : '';

    const originalRow = options.originalData.value.find(
      r => r[HASH_INDEX_ID] === rowId
    );
    const originalValue =
      originalRow &&
      originalRow[field] !== undefined &&
      originalRow[field] !== null
        ? String(originalRow[field])
        : '';

    let editIndex = editedCells.value.findIndex(e => e.rowId === rowId);

    if (editIndex === -1) {
      if (newValue !== originalValue) {
        editedCells.value.push({
          rowId,
          changedData: {
            [field]: newValue,
          },
        });
      }
    } else {
      const edit = editedCells.value[editIndex];
      if (edit.isNewRow) {
        edit.changedData[field] = newValue;
      } else {
        if (newValue === originalValue) {
          delete edit.changedData[field];
          if (Object.keys(edit.changedData).length === 0) {
            editedCells.value.splice(editIndex, 1);
          }
        } else {
          edit.changedData[field] = newValue;
        }
      }
    }
  };

  const clearEdits = () => {
    editedCells.value = [];
  };

  const hasEditedRows = (): boolean => {
    return editedCells.value.length > 0;
  };

  const getPendingEditedRows = (): CsvEditedCell[] => {
    return editedCells.value;
  };

  return {
    editedCells,
    onCellValueChanged,
    clearEdits,
    hasEditedRows,
    getPendingEditedRows,
    pendingChangesCount,
  };
}
