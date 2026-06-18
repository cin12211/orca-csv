<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  CellValueChangedEvent,
  ColDef,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import BaseDataGrid from '~/components/base/BaseDataGrid.vue';
import CsvEditorContextMenu from './CsvEditorContextMenu.vue';

withDefaults(
  defineProps<{
    rowData: any[];
    columnDefs: ColDef[];
    gridOptions: GridOptions;
    allowEditing?: boolean;
  }>(),
  {
    allowEditing: true,
  }
);

const emit = defineEmits<{
  (e: 'cellValueChanged', event: CellValueChangedEvent): void;
  (e: 'selectionChanged', selectedRows: any[]): void;
  (e: 'gridReady', event: GridReadyEvent): void;
  (e: 'onRowDataUpdated'): void;
  (e: 'addRowAt', rowIndex: number, position: 'above' | 'below'): void;
  (e: 'deleteRowAt', rowIndex: number): void;
  (e: 'addColumn', columnName: string, options?: { referenceColumn?: string; position?: 'left' | 'right' | 'end' }): void;
  (e: 'deleteColumn', columnName: string): void;
}>();

const baseGridRef = ref<InstanceType<typeof BaseDataGrid>>();
const selectedRowsState = ref<any[]>([]);

const cellContextMenu = computed(() => baseGridRef.value?.cellContextMenu);
const cellHeaderContextMenu = computed(() => baseGridRef.value?.cellHeaderContextMenu);

function onSelectionChanged(rows: any[]) {
  selectedRowsState.value = rows;
  emit('selectionChanged', rows);
}

function onCellValueChanged(event: CellValueChangedEvent) {
  emit('cellValueChanged', event);
}

function onGridReady(event: GridReadyEvent) {
  emit('gridReady', event);
}

function clearCellContextMenu() {
  baseGridRef.value?.clearCellContextMenu();
}

function onRowDataUpdated() {
  emit('onRowDataUpdated');
}
</script>

<template>
  <div class="relative w-full h-full flex-1 min-h-0 bg-background">
    <CsvEditorContextMenu
      :cell-context-menu="cellContextMenu"
      :cell-header-context-menu="cellHeaderContextMenu"
      :data="rowData"
      :selected-rows="selectedRowsState"
      :allow-editing="allowEditing"
      @on-clear-context-menu="clearCellContextMenu"
      @add-row-at="(idx, pos) => emit('addRowAt', idx, pos)"
      @delete-row-at="idx => emit('deleteRowAt', idx)"
      @add-column="(name, options) => emit('addColumn', name, options)"
      @delete-column="name => emit('deleteColumn', name)"
    >
      <BaseDataGrid
        ref="baseGridRef"
        :column-defs="columnDefs"
        :row-data="rowData"
        :grid-options="gridOptions"
        :allow-editing="allowEditing"
        @selection-changed="onSelectionChanged"
        @cell-value-changed="onCellValueChanged"
        @grid-ready="onGridReady"
        @row-data-updated="onRowDataUpdated"
        class="w-full h-full"
      />
    </CsvEditorContextMenu>
  </div>
</template>
