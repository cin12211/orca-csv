<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CellContextMenuEvent } from 'ag-grid-community';
import BaseContextMenu from '~/components/base/context-menu/BaseContextMenu.vue';
import {
  ContextMenuItemType,
  type ContextMenuItem,
} from '~/components/base/context-menu/menuContext.type';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { HASH_INDEX_ID } from '~/core/constants';
import {
  copyColumnData,
  copyRowsData,
  copyToClipboard,
  type ColumnCopyFormat,
  type ExportFormat,
} from '~/core/helpers/copyData';

const props = withDefaults(
  defineProps<{
    cellContextMenu?: CellContextMenuEvent;
    cellHeaderContextMenu?: CellContextMenuEvent;
    data?: any[];
    selectedRows?: any[];
    allowEditing?: boolean;
  }>(),
  {
    data: () => [],
    selectedRows: () => [],
    allowEditing: true,
  }
);

const emit = defineEmits<{
  (e: 'onClearContextMenu'): void;
  (e: 'addRowAt', rowIndex: number, position: 'above' | 'below'): void;
  (e: 'deleteRowAt', rowIndex: number): void;
  (
    e: 'addColumn',
    columnName: string,
    options?: { position?: 'left' | 'right' | 'end'; referenceColumn?: string }
  ): void;
  (e: 'deleteColumn', columnName: string): void;
}>();

// Add Column dialog state
const isAddColumnOpen = ref(false);
const insertColumnPosition = ref<'left' | 'right' | 'end'>('end');
const newColumnName = ref('');

const currentColumnId = computed<string | undefined>(() => {
  return (
    props.cellContextMenu?.column?.getColId() ??
    props.cellHeaderContextMenu?.column?.getColId()
  );
});

const currentColumnLabel = computed<string>(() => {
  return (
    props.cellContextMenu?.column?.getColDef().headerName ??
    props.cellHeaderContextMenu?.column?.getColDef().headerName ??
    currentColumnId.value ??
    'Select a column'
  );
});

// Copy Helpers
const copyCurrentCell = () => {
  const value = props.cellContextMenu?.value;
  if (value === undefined) return;

  if (typeof value === 'object' && value !== null) {
    return copyToClipboard(JSON.stringify(value));
  }
  return copyToClipboard(String(value));
};

const copyCurrentRow = () => {
  const row = props.cellContextMenu?.data;
  if (!row) return;

  return copyRowsData([row], 'csv_data', 'csv-no-header');
};

const copySelectedColumnData = (format: ColumnCopyFormat) => {
  if (!currentColumnId.value || !props.selectedRows.length) return;
  return copyColumnData(props.selectedRows, currentColumnId.value, format);
};

const copyAllColumnData = (format: ColumnCopyFormat) => {
  if (!currentColumnId.value || !props.data.length) return;
  return copyColumnData(props.data, currentColumnId.value, format);
};

const copySelectedRowsData = (format: ExportFormat | `${ExportFormat}`) => {
  if (!props.selectedRows.length) return;
  return copyRowsData(props.selectedRows, 'csv_data', format);
};

const copyAllRowsData = (format: ExportFormat | `${ExportFormat}`) => {
  if (!props.data.length) return;
  return copyRowsData(props.data, 'csv_data', format);
};

const addColumnDialogTitle = computed(() => {
  if (insertColumnPosition.value === 'left') {
    return `Insert Column Left of ${currentColumnLabel.value}`;
  }

  if (insertColumnPosition.value === 'right') {
    return `Insert Column Right of ${currentColumnLabel.value}`;
  }

  return 'Add New Column';
});

// Dialog submission
const handleAddColumnSubmit = () => {
  const name = newColumnName.value.trim();
  if (name) {
    emit('addColumn', name, {
      position: insertColumnPosition.value,
      referenceColumn:
        insertColumnPosition.value === 'end'
          ? undefined
          : currentColumnId.value,
    });
    newColumnName.value = '';
    insertColumnPosition.value = 'end';
    isAddColumnOpen.value = false;
  }
};

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const isCellContext = !!props.cellContextMenu;
  const hasSelectedRows = props.selectedRows.length > 0;
  const hasColumn = !!currentColumnId.value;
  const selectedCount = props.selectedRows.length;
  const clickedRowIndex = props.cellContextMenu?.rowIndex;

  const copyColumnItems: ContextMenuItem[] = [
    {
      type: ContextMenuItemType.LABEL,
      title: `${selectedCount} selected row${selectedCount === 1 ? '' : 's'}`,
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy selected as text',
      icon: 'hugeicons:file-01',
      select: () => copySelectedColumnData('list'),
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy selected as JSON',
      icon: 'hugeicons:code',
      select: () => copySelectedColumnData('json'),
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.SEPARATOR,
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.LABEL,
      title: 'All data in column',
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy all as text',
      icon: 'hugeicons:file-01',
      select: () => copyAllColumnData('list'),
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy all as JSON',
      icon: 'hugeicons:code',
      select: () => copyAllColumnData('json'),
    },
  ];

  const copyRowsItems: ContextMenuItem[] = [
    {
      type: ContextMenuItemType.LABEL,
      title: `${selectedCount} selected row${selectedCount === 1 ? '' : 's'}`,
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy selected as text (TSV)',
      icon: 'hugeicons:file-01',
      select: () => copySelectedRowsData('csv-no-header'),
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy selected as JSON',
      icon: 'hugeicons:code',
      select: () => copySelectedRowsData('json'),
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.SEPARATOR,
      condition: hasSelectedRows,
    },
    {
      type: ContextMenuItemType.LABEL,
      title: 'All rows',
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy all as text (TSV)',
      icon: 'hugeicons:file-01',
      select: () => copyAllRowsData('csv-no-header'),
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy all as JSON',
      icon: 'hugeicons:code',
      select: () => copyAllRowsData('json'),
    },
  ];

  return [
    // --- 1. Copy Actions ---
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy current cell',
      icon: 'hugeicons:copy-02',
      select: copyCurrentCell,
      condition: isCellContext,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Copy current row',
      icon: 'hugeicons:copy-02',
      select: copyCurrentRow,
      condition: isCellContext,
    },
    {
      type: ContextMenuItemType.SUBMENU,
      title: 'Copy column',
      icon: 'hugeicons:layout-3-column',
      items: copyColumnItems,
      condition: hasColumn,
      desc: currentColumnLabel.value,
    },
    {
      type: ContextMenuItemType.SUBMENU,
      title: 'Copy row(s)',
      icon: 'hugeicons:layout-3-row',
      items: copyRowsItems,
    },
    {
      type: ContextMenuItemType.SEPARATOR,
      condition: props.allowEditing,
    },

    // --- 2. Row Manipulations ---
    {
      type: ContextMenuItemType.ACTION,
      title: 'Insert row above',
      icon: 'hugeicons:plus-sign',
      select: () => {
        if (clickedRowIndex !== undefined && clickedRowIndex !== null) {
          emit('addRowAt', clickedRowIndex, 'above');
        }
      },
      condition:
        props.allowEditing && isCellContext && clickedRowIndex !== undefined,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Insert row below',
      icon: 'hugeicons:plus-sign',
      select: () => {
        if (clickedRowIndex !== undefined && clickedRowIndex !== null) {
          emit('addRowAt', clickedRowIndex, 'below');
        }
      },
      condition:
        props.allowEditing && isCellContext && clickedRowIndex !== undefined,
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Delete row',
      icon: 'hugeicons:delete-02',
      select: () => {
        if (clickedRowIndex !== undefined && clickedRowIndex !== null) {
          emit('deleteRowAt', clickedRowIndex);
        }
      },
      condition:
        props.allowEditing && isCellContext && clickedRowIndex !== undefined,
    },
    {
      type: ContextMenuItemType.SEPARATOR,
      condition: props.allowEditing,
    },

    // --- 3. Column Manipulations ---
    {
      type: ContextMenuItemType.SUBMENU,
      title: 'Add column',
      condition: props.allowEditing,
      icon: 'hugeicons:plus-sign',
      items: [
        {
          type: ContextMenuItemType.ACTION,
          title: 'Insert left of selected',
          icon: 'hugeicons:arrow-left-01',
          select: () => {
            insertColumnPosition.value = 'left';
            newColumnName.value = '';
            isAddColumnOpen.value = true;
          },
          condition:
            props.allowEditing &&
            hasColumn &&
            currentColumnId.value !== HASH_INDEX_ID,
        },
        {
          type: ContextMenuItemType.ACTION,
          title: 'Insert right of selected',
          icon: 'hugeicons:arrow-right-01',
          select: () => {
            insertColumnPosition.value = 'right';
            newColumnName.value = '';
            isAddColumnOpen.value = true;
          },
          condition:
            props.allowEditing &&
            hasColumn &&
            currentColumnId.value !== HASH_INDEX_ID,
        },
        {
          type: ContextMenuItemType.ACTION,
          title: 'Add at end',
          icon: 'hugeicons:plus-sign',
          select: () => {
            insertColumnPosition.value = 'end';
            newColumnName.value = '';
            isAddColumnOpen.value = true;
          },
        },
      ],
    },
    {
      type: ContextMenuItemType.ACTION,
      title: 'Delete column',
      icon: 'hugeicons:delete-02',
      select: () => {
        if (currentColumnId.value && currentColumnId.value !== HASH_INDEX_ID) {
          emit('deleteColumn', currentColumnId.value);
        }
      },
      condition:
        props.allowEditing &&
        hasColumn &&
        currentColumnId.value !== HASH_INDEX_ID,
    },
  ];
});
</script>

<template>
  <BaseContextMenu
    :contextMenuItems="contextMenuItems"
    @on-clear-context-menu="emit('onClearContextMenu')"
  >
    <!-- Slot wraps the AgGrid -->
    <slot />
  </BaseContextMenu>

  <!-- Add Column Dialog Modal -->
  <Dialog v-model:open="isAddColumnOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ addColumnDialogTitle }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="column-name" class="text-right">Name</Label>
          <Input
            id="column-name"
            v-model="newColumnName"
            placeholder="e.g. email, status"
            class="col-span-3"
            @keyup.enter="handleAddColumnSubmit"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isAddColumnOpen = false"
          >Cancel</Button
        >
        <Button type="submit" @click="handleAddColumnSubmit">Add Column</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
