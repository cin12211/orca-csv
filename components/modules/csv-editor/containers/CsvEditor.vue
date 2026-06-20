<script setup lang="ts">
import { useFileSystemAccess } from '@vueuse/core';
import { ref, watch, toRef, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { BaseEmpty } from '@/components/base/base-empty';
import { LoadingOverlay } from '@/components/base/loading-overlay';
import type { CsvFileHandle } from '@/core/services/csv';
import { createCsvFileSystemForHandle } from '@/core/services/csv';
import { Button } from '~/components/ui/button';
import { HASH_INDEX_ID } from '~/core/constants';
import { isElectron } from '~/core/helpers/environment';
import { useTabViewsStore } from '~/core/stores/useTabViewsStore';
import { CsvEditorControlBar, CsvEditorTable, CsvFilter } from '../components';
import { CsvFilterCompose } from '../constants/csv-filter.constants';
import {
  useCsvData,
  useCsvEditedCells,
  useCsvMutation,
  useCsvColumnDefs,
  useCsvGridOptions,
  useCsvFilter,
  useCsvGridSizing,
  useCsvShortcuts,
} from '../hooks';
import type { CsvEditedCell } from '../types';
import type { CsvFilterRow } from '../types/csv-filter.types';

const props = defineProps<{
  fileHandle: CsvFileHandle;
  initialHasHeaders?: boolean;
}>();

const fileHandleRef = toRef(props, 'fileHandle');
const hasHeadersRef = ref(props.initialHasHeaders ?? true);
const delimiterRef = ref(',');
const selectedRows = ref<any[]>([]);
const gridApi = ref<any>(null);
const isFileModifiedExternally = ref(false);
const isFilterVisible = ref(false);
const filters = ref<CsvFilterRow[]>([]);
const composeWith = ref<CsvFilterCompose>(CsvFilterCompose.AND);
const csvEditorContainerRef = ref<HTMLElement>();
const csvFilterRef = ref<InstanceType<typeof CsvFilter>>();

const fsAccess = useFileSystemAccess({
  dataType: 'Text',
  types: [
    {
      description: 'CSV Files',
      accept: { 'text/csv': ['.csv'] },
    },
  ],
});

const csvFileSystem = createCsvFileSystemForHandle(props.fileHandle, fsAccess);

const { applyFilterToGrid } = useCsvFilter();

// 1. Data Loading
const {
  data,
  headers,
  originalHeaders,
  originalData,
  isLoading,
  parseError,
  loadCsvData,
  rowCount,
  columnCount,
} = useCsvData({
  fileHandle: fileHandleRef,
  hasHeaders: hasHeadersRef,
  csvFileSystem,
});

console.log('🚀 ~ data:', data, originalData);

// Auto-resize columns
const { onRowDataUpdated } = useCsvGridSizing({
  gridApi,
  data,
});

// Schema modified checker
const isSchemaModified = computed(() => {
  if (headers.value.length !== originalHeaders.value.length) return true;
  return headers.value.some((h, i) => h !== originalHeaders.value[i]);
});

// 2. Edits Tracking
const {
  editedCells,
  onCellValueChanged,
  clearEdits,
  hasEditedRows,
  getPendingEditedRows,
  pendingChangesCount,
} = useCsvEditedCells({
  // Use the snapshot so diffs are against disk state, not the live grid data
  originalData,
});

const tabViewsStore = useTabViewsStore();
const route = useRoute();
const tabViewId = computed(() => route.params.tabViewId as string);

const isReadOnly = computed(() => false);

const hasChanges = computed(
  () => !isReadOnly.value && (hasEditedRows() || isSchemaModified.value)
);
const pendingChangesInControlBar = computed(() =>
  isReadOnly.value
    ? 0
    : pendingChangesCount.value + (isSchemaModified.value ? 1 : 0)
);
const canDeleteSelectedRows = computed(
  () => !isReadOnly.value && selectedRows.value.length > 0
);

// 3. Mutation Operations
const {
  isSaving,
  onSaveData,
  onAddEmptyRow,
  onAddRowAt,
  onAddColumn,
  onDeleteColumn,
  onDeleteRows,
  onDiscardChanges,
} = useCsvMutation({
  fileHandle: fileHandleRef,
  isReadOnly,
  data,
  headers,
  hasHeaders: hasHeadersRef,
  editedCells: {
    editedCells,
    onCellValueChanged,
    clearEdits,
    hasEditedRows,
    getPendingEditedRows,
    pendingChangesCount,
  },
  csvFileSystem,
  onSaveSuccess: () => {
    if (tabViewId.value) {
      void tabViewsStore.updateTabMetadata(
        tabViewId.value,
        {
          fileName: props.fileHandle.name,
          fileSize: props.fileHandle.size,
          lastModified: props.fileHandle.lastModified,
        },
        props.fileHandle.name
      );
    }
    // Refresh table and data after save
    loadCsvData();
    isFileModifiedExternally.value = false;
  },
  onDiscard: () => {
    loadCsvData();
    isFileModifiedExternally.value = false;
  },
});

// 4. Columns Generation
const dirtyTracker = { cells: [] as CsvEditedCell[] };

watch(
  editedCells,
  cells => {
    dirtyTracker.cells = cells;
    if (gridApi.value) {
      gridApi.value.refreshCells({ force: true });
    }
  },
  { deep: true, immediate: true }
);

const { columnDefs } = useCsvColumnDefs({ headers, dirtyTracker });

// 5. Grid Options
const { gridOptions } = useCsvGridOptions({
  editedCells,
  onCellValueChanged: event => {
    onCellValueChanged(event);
    if (gridApi.value) {
      gridApi.value.redrawRows({ rowNodes: [event.node] });
    }
  },
});

// Load data initially
loadCsvData();

// File Watching Implementation for Electron
let unwatchFn: (() => void) | null = null;

const startWatching = () => {
  if (unwatchFn) {
    unwatchFn();
    unwatchFn = null;
  }

  if (
    fileHandleRef.value &&
    csvFileSystem.watchFile &&
    fileHandleRef.value.platform === 'electron'
  ) {
    try {
      unwatchFn = csvFileSystem.watchFile(fileHandleRef.value, () => {
        isFileModifiedExternally.value = true;
      });
    } catch (e) {
      console.error('Failed to watch CSV file:', e);
    }
  }
};

onMounted(() => {
  startWatching();
});

onUnmounted(() => {
  if (unwatchFn) {
    unwatchFn();
  }
});

// Watch for file handle changes (e.g., tab switching)
watch(fileHandleRef, () => {
  loadCsvData();
  clearEdits();
  isFileModifiedExternally.value = false;
  startWatching();
});

// Watch hasHeaders and reload
watch(hasHeadersRef, () => {
  loadCsvData();
  clearEdits();
});

// Watch delimiter and reload
watch(delimiterRef, () => {
  loadCsvData();
  clearEdits();
});

function onSelectionChanged(rows: any[]) {
  selectedRows.value = rows;
}

function onGridReady(event: any) {
  gridApi.value = event.api;
}

function handleAddRow() {
  if (isReadOnly.value) return;

  onAddEmptyRow();
  if (gridApi.value) {
    gridApi.value.setGridOption('rowData', [...data.value]);
  }
}

function handleAddRowAt(rowIndex: number, position: 'above' | 'below') {
  if (isReadOnly.value) return;

  onAddRowAt(rowIndex, position);
  if (gridApi.value) {
    gridApi.value.setGridOption('rowData', [...data.value]);
  }
}

function handleDeleteRowAt(rowIndex: number) {
  if (isReadOnly.value) return;

  const rowNode = gridApi.value?.getDisplayedRowAtIndex(rowIndex);
  if (rowNode && rowNode.data) {
    const rowId = rowNode.data[HASH_INDEX_ID];
    onDeleteRows([rowId]);
    if (gridApi.value) {
      gridApi.value.setGridOption('rowData', [...data.value]);
    }
  }
}

function handleAddColumn(
  columnName: string,
  options?: { referenceColumn?: string; position?: 'left' | 'right' | 'end' }
) {
  if (isReadOnly.value) return;

  onAddColumn(columnName, options);
  if (gridApi.value) {
    gridApi.value.setGridOption('columnDefs', columnDefs.value);
    gridApi.value.setGridOption('rowData', [...data.value]);
  }
}

function handleDeleteColumn(columnName: string) {
  if (isReadOnly.value) return;

  onDeleteColumn(columnName);
  if (gridApi.value) {
    gridApi.value.setGridOption('columnDefs', columnDefs.value);
    gridApi.value.setGridOption('rowData', [...data.value]);
  }
}

async function handleDeleteSelected() {
  if (isReadOnly.value || selectedRows.value.length === 0) return;

  const rowIdsToDelete = selectedRows.value.map(row => row[HASH_INDEX_ID]);
  await onDeleteRows(rowIdsToDelete);
  selectedRows.value = [];
  if (gridApi.value) {
    gridApi.value.setGridOption('rowData', [...data.value]);
  }
}

function handleCellValueChanged(event: any) {
  onCellValueChanged(event);
  if (gridApi.value) {
    gridApi.value.redrawRows({ rowNodes: [event.node] });
  }
}

useCsvShortcuts({
  containerRef: csvEditorContainerRef,
  csvFilterRef,
  gridApi,
  canSave: hasChanges,
  canDeleteRows: canDeleteSelectedRows,
  onSaveData: () => {
    void onSaveData();
  },
  onDeleteRows: () => {
    void handleDeleteSelected();
  },
});

function handleReloadFile() {
  loadCsvData();
  clearEdits();
  isFileModifiedExternally.value = false;
}

function handleApplyFilter() {
  applyFilterToGrid(gridApi.value, filters.value, composeWith.value);
}

function handleUpdateFilters(newFilters: CsvFilterRow[]) {
  filters.value = newFilters;
}

function handleChangeComposeWith(val: CsvFilterCompose) {
  composeWith.value = val;
  handleApplyFilter();
}
</script>

<template>
  <div
    ref="csvEditorContainerRef"
    class="flex flex-col w-full h-full min-h-0 bg-background overflow-hidden relative"
  >
    <!-- External change warning banner -->
    <Transition name="slide-down">
      <div
        v-if="isFileModifiedExternally"
        class="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs px-4 py-2 flex items-center justify-between gap-4 z-10"
      >
        <div class="flex items-center gap-2">
          <Icon name="hugeicons:information-circle" class="size-4 shrink-0" />
          <span
            >This CSV file has been modified externally. Reload to see
            updates.</span
          >
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="xxs"
            @click="handleReloadFile"
            class="border-amber-500/30 hover:bg-amber-500/20 text-amber-500"
          >
            Reload File
          </Button>
          <Button
            variant="ghost"
            size="xxs"
            @click="isFileModifiedExternally = false"
            class="hover:bg-amber-500/10 text-amber-500"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </Transition>

    <!-- Control Bar -->
    <div class="px-1">
      <CsvEditorControlBar
        :file-name="fileHandle.name"
        :file-size="fileHandle.size"
        :last-modified="fileHandle.lastModified"
        :has-changes="hasChanges"
        :is-saving="isSaving"
        :has-selection="canDeleteSelectedRows"
        :is-read-only="isReadOnly"
        :pending-changes-count="pendingChangesInControlBar"
        :selected-rows-count="selectedRows.length"
        :row-count="rowCount"
        :column-count="columnCount"
        v-model:has-headers="hasHeadersRef"
        v-model:delimiter="delimiterRef"
        @save="onSaveData"
        @discard="onDiscardChanges"
        @add-row="handleAddRow"
        @delete-rows="handleDeleteSelected"
        @reload="handleReloadFile"
        @on-show-filter="
          () => {
            csvFilterRef?.onShowSearch();
          }
        "
      />
    </div>

    <!-- Filter Panel -->
    <div class="px-2">
      <CsvFilter
        ref="csvFilterRef"
        v-model:is-visible="isFilterVisible"
        :columns="
          data.length > 0
            ? Object.keys(data[0]).filter(k => k !== HASH_INDEX_ID)
            : []
        "
        :init-filters="filters"
        :compose-with="composeWith"
        @on-update-filters="handleUpdateFilters"
        @on-search="handleApplyFilter"
        @on-change-compose-with="handleChangeComposeWith"
      />
    </div>

    <!-- Main Table Area -->
    <div class="flex-1 overflow-hidden px-1 mb-0.5 relative">
      <LoadingOverlay :visible="isLoading" />

      <BaseEmpty
        v-if="parseError"
        icon="icons:ghost"
        title="Failed to parse CSV"
        :desc="parseError"
        class="absolute inset-0 z-20"
      >
        <Button variant="outline" size="sm" @click="loadCsvData">
          Retry
        </Button>
      </BaseEmpty>

      <CsvEditorTable
        v-else-if="!parseError"
        class="h-full border rounded-md"
        :row-data="data"
        :column-defs="columnDefs"
        :grid-options="gridOptions"
        :allow-editing="!isReadOnly"
        @selection-changed="onSelectionChanged"
        @grid-ready="onGridReady"
        @on-row-data-updated="onRowDataUpdated"
        @cell-value-changed="handleCellValueChanged"
        @add-row-at="handleAddRowAt"
        @delete-row-at="handleDeleteRowAt"
        @add-column="handleAddColumn"
        @delete-column="handleDeleteColumn"
      />
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
