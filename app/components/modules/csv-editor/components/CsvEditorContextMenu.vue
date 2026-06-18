<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CellContextMenuEvent } from 'ag-grid-community';
import BaseContextMenu from '~/components/base/BaseContextMenu.vue';
import {
  ContextMenuItemType,
  type ContextMenuItem,
} from '~/components/base/context-menu/menuContext.type';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import { copyColumnData, copyRowsData, copyToClipboard } from '~/core/helpers/copyData';
import type { ColumnCopyFormat, ExportFormat } from '~/core/helpers/copyData';

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
  (e: 'addColumn', columnName: string, options?: { position?: 'left' | 'right' | 'end'; referenceColumn?: string }): void;
  (e: 'deleteColumn', columnName: string): void;
}>();

const isAddColumnOpen = ref(false);
const insertColumnPosition = ref<'left' | 'right' | 'end'>('end');
const newColumnName = ref('');

const currentColumnId = computed<string | undefined>(() => {
  return props.cellContextMenu?.column?.getColId() ?? props.cellHeaderContextMenu?.column?.getColId();
});

const currentColumnLabel = computed<string>(() => {
  return props.cellContextMenu?.column?.getColDef().headerName ??
    props.cellHeaderContextMenu?.column?.getColDef().headerName ??
    currentColumnId.value ??
    'Select a column';
});

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
  if (insertColumnPosition.value === 'left') return `Insert Column Left of ${currentColumnLabel.value}`;
  if (insertColumnPosition.value === 'right') return `Insert Column Right of ${currentColumnLabel.value}`;
  return 'Add New Column';
});

const handleAddColumnSubmit = () => {
  const name = newColumnName.value.trim();
  if (name) {
    emit('addColumn', name, {
      position: insertColumnPosition.value,
      referenceColumn: insertColumnPosition.value === 'end' ? undefined : currentColumnId.value,
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
    { type: ContextMenuItemType.LABEL, title: `${selectedCount} selected row${selectedCount === 1 ? '' : 's'}`, condition: hasSelectedRows },
    { type: ContextMenuItemType.ACTION, title: 'Copy selected as text', icon: 'lucide:file-text', select: () => copySelectedColumnData('list'), condition: hasSelectedRows },
    { type: ContextMenuItemType.ACTION, title: 'Copy selected as JSON', icon: 'lucide:code', select: () => copySelectedColumnData('json'), condition: hasSelectedRows },
    { type: ContextMenuItemType.SEPARATOR, condition: hasSelectedRows },
    { type: ContextMenuItemType.LABEL, title: 'All data in column' },
    { type: ContextMenuItemType.ACTION, title: 'Copy all as text', icon: 'lucide:file-text', select: () => copyAllColumnData('list') },
    { type: ContextMenuItemType.ACTION, title: 'Copy all as JSON', icon: 'lucide:code', select: () => copyAllColumnData('json') },
  ];

  const copyRowsItems: ContextMenuItem[] = [
    { type: ContextMenuItemType.LABEL, title: `${selectedCount} selected row${selectedCount === 1 ? '' : 's'}`, condition: hasSelectedRows },
    { type: ContextMenuItemType.ACTION, title: 'Copy selected as text (TSV)', icon: 'lucide:file-text', select: () => copySelectedRowsData('csv-no-header'), condition: hasSelectedRows },
    { type: ContextMenuItemType.ACTION, title: 'Copy selected as JSON', icon: 'lucide:code', select: () => copySelectedRowsData('json'), condition: hasSelectedRows },
    { type: ContextMenuItemType.SEPARATOR, condition: hasSelectedRows },
    { type: ContextMenuItemType.LABEL, title: 'All rows' },
    { type: ContextMenuItemType.ACTION, title: 'Copy all as text (TSV)', icon: 'lucide:file-text', select: () => copyAllRowsData('csv-no-header') },
    { type: ContextMenuItemType.ACTION, title: 'Copy all as JSON', icon: 'lucide:code', select: () => copyAllRowsData('json') },
  ];

  return [
    { type: ContextMenuItemType.ACTION, title: 'Copy current cell', icon: 'lucide:copy', select: copyCurrentCell, condition: isCellContext },
    { type: ContextMenuItemType.ACTION, title: 'Copy current row', icon: 'lucide:copy', select: copyCurrentRow, condition: isCellContext },
    { type: ContextMenuItemType.SUBMENU, title: 'Copy column', icon: 'lucide:columns-3', items: copyColumnItems, condition: hasColumn, desc: currentColumnLabel.value },
    { type: ContextMenuItemType.SUBMENU, title: 'Copy row(s)', icon: 'lucide:rows-3', items: copyRowsItems },
    { type: ContextMenuItemType.SEPARATOR, condition: props.allowEditing },
    { type: ContextMenuItemType.ACTION, title: 'Insert row above', icon: 'lucide:plus', select: () => { if (clickedRowIndex !== undefined && clickedRowIndex !== null) emit('addRowAt', clickedRowIndex, 'above'); }, condition: props.allowEditing && isCellContext && clickedRowIndex !== undefined },
    { type: ContextMenuItemType.ACTION, title: 'Insert row below', icon: 'lucide:plus', select: () => { if (clickedRowIndex !== undefined && clickedRowIndex !== null) emit('addRowAt', clickedRowIndex, 'below'); }, condition: props.allowEditing && isCellContext && clickedRowIndex !== undefined },
    { type: ContextMenuItemType.ACTION, title: 'Delete row', icon: 'lucide:trash-2', select: () => { if (clickedRowIndex !== undefined && clickedRowIndex !== null) emit('deleteRowAt', clickedRowIndex); }, condition: props.allowEditing && isCellContext && clickedRowIndex !== undefined },
    { type: ContextMenuItemType.SEPARATOR, condition: props.allowEditing },
    {
      type: ContextMenuItemType.SUBMENU, title: 'Add column', condition: props.allowEditing, icon: 'lucide:plus',
      items: [
        { type: ContextMenuItemType.ACTION, title: 'Insert left of selected', icon: 'lucide:arrow-left', select: () => { insertColumnPosition.value = 'left'; newColumnName.value = ''; isAddColumnOpen.value = true; }, condition: props.allowEditing && hasColumn && currentColumnId.value !== HASH_INDEX_ID },
        { type: ContextMenuItemType.ACTION, title: 'Insert right of selected', icon: 'lucide:arrow-right', select: () => { insertColumnPosition.value = 'right'; newColumnName.value = ''; isAddColumnOpen.value = true; }, condition: props.allowEditing && hasColumn && currentColumnId.value !== HASH_INDEX_ID },
        { type: ContextMenuItemType.ACTION, title: 'Add at end', icon: 'lucide:plus', select: () => { insertColumnPosition.value = 'end'; newColumnName.value = ''; isAddColumnOpen.value = true; } },
      ],
    },
    { type: ContextMenuItemType.ACTION, title: 'Delete column', icon: 'lucide:trash-2', select: () => { if (currentColumnId.value && currentColumnId.value !== HASH_INDEX_ID) emit('deleteColumn', currentColumnId.value); }, condition: props.allowEditing && hasColumn && currentColumnId.value !== HASH_INDEX_ID },
  ];
});
</script>

<template>
  <BaseContextMenu
    :contextMenuItems="contextMenuItems"
    @on-clear-context-menu="emit('onClearContextMenu')"
  >
    <slot />
  </BaseContextMenu>

  <Dialog v-model:open="isAddColumnOpen">
    <div class="sm:max-w-[425px]">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">{{ addColumnDialogTitle }}</h3>
      </div>
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
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="isAddColumnOpen = false">Cancel</Button>
        <Button type="submit" @click="handleAddColumnSubmit">Add Column</Button>
      </div>
    </div>
  </Dialog>
</template>
