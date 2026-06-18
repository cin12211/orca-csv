import { computed, type Ref, type ComputedRef } from 'vue';
import type { GridOptions, CellValueChangedEvent } from 'ag-grid-community';
import { HASH_INDEX_ID } from '~/core/constants';
import type { CsvEditedCell } from '../types';

export interface UseCsvGridOptionsOptions {
  /** Edited cells tracker for styling */
  editedCells: Ref<CsvEditedCell[]>;

  /** Cell value change handler */
  onCellValueChanged: (event: CellValueChangedEvent) => void;
}

export interface UseCsvGridOptionsReturn {
  /** AG Grid options */
  gridOptions: ComputedRef<GridOptions>;
}

export function useCsvGridOptions(
  options: UseCsvGridOptionsOptions
): UseCsvGridOptionsReturn {
  const gridOptions = computed<GridOptions>(() => {
    return {
      // Editing configuration
      singleClickEdit: false,
      stopEditingWhenCellsLoseFocus: true,
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 50,

      // Selection configuration
      rowSelection: {
        mode: 'multiRow',
        checkboxes: false, // selection column check box is handled in column defs
        headerCheckbox: false,
      },
      suppressRowClickSelection: true,

      // Row styling based on edit state
      getRowStyle: params => {
        if (!params.data) return undefined;

        const rowId = params.data[HASH_INDEX_ID];
        if (rowId === undefined) return undefined;

        const edit = options.editedCells.value.find(e => e.rowId === rowId);
        if (edit) {
          if (edit.isNewRow) {
            return { backgroundColor: 'rgba(212, 244, 221, 0.4)' }; // Light green for new row
          }
          if (Object.keys(edit.changedData).length > 0) {
            return { backgroundColor: 'rgba(255, 243, 205, 0.4)' }; // Light orange for edited row
          }
        }
        return undefined;
      },

      // Events
      onCellValueChanged: options.onCellValueChanged,

      // Performance and behaviour
      animateRows: false,
      enableCellTextSelection: true,
    };
  });

  return {
    gridOptions,
  };
}
