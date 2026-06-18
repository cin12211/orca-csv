import { computed, type Ref, type ComputedRef } from 'vue';
import type { GridOptions, CellValueChangedEvent } from 'ag-grid-community';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { CsvEditedCell } from '../types';

export interface UseCsvGridOptionsOptions {
  editedCells: Ref<CsvEditedCell[]>;
  onCellValueChanged: (event: CellValueChangedEvent) => void;
}

export interface UseCsvGridOptionsReturn {
  gridOptions: ComputedRef<GridOptions>;
}

export function useCsvGridOptions(
  options: UseCsvGridOptionsOptions
): UseCsvGridOptionsReturn {
  const gridOptions = computed<GridOptions>(() => {
    return {
      singleClickEdit: false,
      stopEditingWhenCellsLoseFocus: true,
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 50,

      rowSelection: {
        mode: 'multiRow',
        checkboxes: false,
        headerCheckbox: false,
      },
      suppressRowClickSelection: true,

      getRowStyle: params => {
        if (!params.data) return undefined;
        const rowId = params.data[HASH_INDEX_ID];
        if (rowId === undefined) return undefined;

        const edit = options.editedCells.value.find(e => e.rowId === rowId);
        if (edit) {
          if (edit.isNewRow) {
            return { backgroundColor: 'rgba(212, 244, 221, 0.4)' };
          }
          if (Object.keys(edit.changedData).length > 0) {
            return { backgroundColor: 'rgba(255, 243, 205, 0.4)' };
          }
        }
        return undefined;
      },

      onCellValueChanged: options.onCellValueChanged,
      animateRows: false,
      enableCellTextSelection: true,
    };
  });

  return { gridOptions };
}
