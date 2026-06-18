<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import type { HTMLAttributes } from 'vue';
import type {
  CellContextMenuEvent,
  CellValueChangedEvent,
  ColDef,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { cellValueFormatter } from './data-grid/cellValueFormatter';
import { useHotkeys } from '~/core/composables/useHotKeys';

const props = withDefaults(
  defineProps<{
    columnDefs: ColDef[];
    rowData: unknown[];
    gridOptions?: GridOptions;
    class?: HTMLAttributes['class'];
    allowEditing?: boolean;
  }>(),
  {
    allowEditing: false,
  }
);

const emit = defineEmits<{
  (e: 'selectionChanged', rows: unknown[]): void;
  (e: 'cellValueChanged', event: CellValueChangedEvent): void;
  (e: 'gridReady', event: GridReadyEvent): void;
  (e: 'rowDataUpdated'): void;
}>();

const containerRef = ref<HTMLElement>();
const agGridRef = useTemplateRef<HTMLElement>('agGridRef');
const gridApi = ref<any>(null);

const cellContextMenu = ref<CellContextMenuEvent | undefined>(undefined);
const cellHeaderContextMenu = ref<CellContextMenuEvent | undefined>(undefined);

const handleGridReady = (event: GridReadyEvent) => {
  gridApi.value = event.api;
  emit('gridReady', event);
};

const mergedGridOptions = computed<GridOptions>(() => ({
  rowBuffer: 20,
  rowSelection: {
    mode: 'multiRow',
    checkboxes: false,
    headerCheckbox: false,
    enableSelectionWithoutKeys: false,
    enableClickSelection: 'enableSelection',
    copySelectedRows: false,
  },
  pagination: false,
  animateRows: false,
  ...(props.gridOptions ?? {}),
}));

const onCellValueChanged = (event: CellValueChangedEvent) => {
  if (!props.allowEditing) return;
  emit('cellValueChanged', event);
};

const onSelectionChanged = () => {
  const selectedRows = gridApi.value?.getSelectedRows() ?? [];
  emit('selectionChanged', selectedRows);
};

const onRowDataUpdated = () => {
  emit('rowDataUpdated');
};

const onCellContextMenu = (event: CellContextMenuEvent) => {
  cellContextMenu.value = event;
};

const onCellHeaderContextMenu = (event: CellContextMenuEvent) => {
  cellHeaderContextMenu.value = event;
};

const clearCellContextMenu = () => {
  cellContextMenu.value = undefined;
  cellHeaderContextMenu.value = undefined;
};

onClickOutside(agGridRef, () => {
  clearCellContextMenu();
});

useHotkeys(
  [
    {
      key: 'meta+c',
      callback: async () => {
        const selectedCell = gridApi.value?.getFocusedCell();
        if (!selectedCell) return;
        const rowNode = gridApi.value?.getDisplayedRowAtIndex(selectedCell.rowIndex);
        const colId = selectedCell.column.getColId();
        const cellValue = rowNode?.data?.[colId];
        await navigator.clipboard.writeText(cellValueFormatter(cellValue) || '');
      },
      excludeInput: true,
    },
  ],
  {
    isPreventDefault: false,
    target: containerRef,
  }
);

defineExpose({
  gridApi,
  cellContextMenu,
  cellHeaderContextMenu,
  clearCellContextMenu,
});
</script>

<template>
  <div ref="containerRef" class="h-full">
    <AgGridVue
      ref="agGridRef"
      :class="props.class"
      :grid-options="mergedGridOptions"
      :column-defs="props.columnDefs"
      :row-data="props.rowData"
      :suppress-scroll-on-new-data="true"
      @grid-ready="handleGridReady"
      @selection-changed="onSelectionChanged"
      @cell-value-changed="onCellValueChanged"
      @row-data-updated="onRowDataUpdated"
      @cell-context-menu="onCellContextMenu"
      @column-header-context-menu="onCellHeaderContextMenu"
    />
  </div>
</template>

<style>
.ag-cell-value {
  user-select: none;
}
.ag-root-wrapper {
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  border: none;
}
</style>
