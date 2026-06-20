import { computed, type Ref, type ComputedRef } from 'vue';
import type { ColDef } from 'ag-grid-community';
import {
  DEFAULT_HASH_INDEX_WIDTH,
  HASH_INDEX_HEADER,
  HASH_INDEX_ID,
} from '~/components/base/data-grid/constants';
import type { CsvEditedCell } from '../types';

export interface CsvDirtyTracker {
  cells: CsvEditedCell[];
}

export interface UseCsvColumnDefsOptions {
  /** CSV headers */
  headers: Ref<string[]>;
  /** Dirty cells tracker */
  dirtyTracker: CsvDirtyTracker;
}

export interface UseCsvColumnDefsReturn {
  /** AG Grid column definitions */
  columnDefs: ComputedRef<ColDef[]>;
}

export function useCsvColumnDefs(
  options: UseCsvColumnDefsOptions
): UseCsvColumnDefsReturn {
  const columnDefs = computed<ColDef[]>(() => {
    // Row number column (matching QuickQuery pattern)
    const cols: ColDef[] = [
      {
        colId: HASH_INDEX_ID,
        headerName: HASH_INDEX_HEADER,
        field: HASH_INDEX_ID,
        filter: false,
        resizable: true,
        editable: false,
        sortable: false,
        type: 'indexColumn',
        headerComponentParams: {
          allowSorting: false,
        },
        pinned: 'left',
        width: DEFAULT_HASH_INDEX_WIDTH,
      },
    ];

    options.headers.value.forEach(header => {
      cols.push({
        headerName: header,
        field: header,
        editable: true,
        resizable: true,
        sortable: true,
        cellEditor: 'agTextCellEditor',
        filter: 'agTextColumnFilter',
        cellStyle: params => {
          if (!params.data) return undefined;
          const rowId = params.data[HASH_INDEX_ID];
          if (rowId === undefined) return undefined;

          // Check if this cell is modified in the dirty tracker
          const edit = options.dirtyTracker.cells.find(e => e.rowId === rowId);
          if (
            edit &&
            !edit.isNewRow &&
            edit.changedData[header] !== undefined
          ) {
            return { backgroundColor: 'var(--color-orange-200)' };
          }
          return undefined;
        },
        // Value formatter to handle display values cleanly
        valueFormatter: params => {
          if (params.value === null || params.value === undefined) {
            return '';
          }
          return String(params.value);
        },
        // Value setter to update rowData
        valueSetter: params => {
          const newValue =
            params.newValue !== null && params.newValue !== undefined
              ? String(params.newValue)
              : '';
          if (params.data) {
            params.data[header] = newValue;
            return true;
          }
          return false;
        },
      });
    });

    return cols;
  });

  return {
    columnDefs,
  };
}
