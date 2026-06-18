import { watch, type Ref } from 'vue';
import type { Column } from 'ag-grid-community';
import {
  DEFAULT_COLUMN_ADDITIONAL_GAP_WIDTH,
  HASH_INDEX_ID,
} from '~/components/base/data-grid/constants';
import {
  estimateAllColumnWidths,
  type RowData,
} from '~/components/base/data-grid/utils';

interface UseCsvGridSizingOptions {
  gridApi: Ref<any>;
  data: Ref<RowData[] | undefined>;
}

export const useCsvGridSizing = ({
  gridApi,
  data,
}: UseCsvGridSizingOptions) => {
  const onRowDataUpdated = () => {
    if (!gridApi.value) {
      return;
    }

    console.log('🔍 [useCsvGridSizing] onRowDataUpdated triggered');

    const columns = (gridApi.value.getAllGridColumns() || []) as Column[];
    const rows = (data.value || []).slice(0, 10);
    const columnWidths = estimateAllColumnWidths({
      columns,
      rows,
    });

    gridApi.value.updateGridOptions({
      columnDefs: columns.map((column: Column) => {
        const fieldId = column.getColDef().field!;
        const additionalGap = DEFAULT_COLUMN_ADDITIONAL_GAP_WIDTH;

        return {
          ...column.getColDef(),
          width:
            fieldId === HASH_INDEX_ID
              ? column.getActualWidth()
              : columnWidths[fieldId] + additionalGap,
        };
      }),
    });
  };

  return {
    onRowDataUpdated,
  };
};
