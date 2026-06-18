<script setup lang="ts">
import type { CsvFileHandle } from '@/core/services/csv';
import { createCsvFileHandlesFromDrop } from '~/components/modules/csv-editor';
import CsvDropOverlay from '~/components/modules/csv-editor/components/CsvDropOverlay.vue';
import { MAX_CSV_TABS } from '~/components/modules/csv-editor/constants';

const tabs = ref<CsvFileHandle[]>([]);
const activeTabIndex = ref(0);
const isDragging = ref(false);
const dragCounter = ref(0);
const tabComponents = ref<Map<string, any>>(new Map());

const activeFileHandle = computed(() => tabs.value[activeTabIndex.value] ?? null);

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  dragCounter.value++;
  isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  dragCounter.value--;
  if (dragCounter.value <= 0) {
    isDragging.value = false;
    dragCounter.value = 0;
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  dragCounter.value = 0;

  if (!e.dataTransfer) return;

  const handles = await createCsvFileHandlesFromDrop(e.dataTransfer);
  if (handles.length === 0) return;

  openFiles(handles);
}

function openFiles(handles: CsvFileHandle[]) {
  const available = MAX_CSV_TABS - tabs.value.length;
  if (available <= 0) return;

  const toAdd = handles.slice(0, available);
  tabs.value.push(...toAdd);
  activeTabIndex.value = tabs.value.length - 1;
}

async function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;
  input.value = '';

  const handles = await createCsvFileHandlesFromDrop(
    new DataTransfer() // dummy, will use classic File path
  );

  // Fallback: create handles directly from File objects
  const directHandles: CsvFileHandle[] = [];
  const available = MAX_CSV_TABS - tabs.value.length;

  for (let i = 0; i < Math.min(files.length, available); i++) {
    const file = files[i];
    if (!file.name.endsWith('.csv')) continue;

    directHandles.push({
      id: `web-${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _file: file,
    });
  }

  if (directHandles.length > 0) {
    openFiles(directHandles);
  }
}

function switchToTab(index: number) {
  if (index >= 0 && index < tabs.value.length) {
    activeTabIndex.value = index;
  }
}

function closeTab(index: number, event: MouseEvent) {
  event.stopPropagation();

  const wasActive = index === activeTabIndex.value;

  tabs.value.splice(index, 1);

  if (tabs.value.length === 0) {
    activeTabIndex.value = 0;
    return;
  }

  if (wasActive) {
    activeTabIndex.value = Math.min(index, tabs.value.length - 1);
  } else if (activeTabIndex.value > index) {
    activeTabIndex.value--;
  }
}
</script>

<template>
  <div
    class="h-screen w-screen flex flex-col bg-background"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <CsvDropOverlay v-if="isDragging" />

    <!-- No tabs open: landing page -->
    <div v-if="tabs.length === 0" class="flex-1 flex flex-col items-center justify-center gap-6">
      <div class="flex flex-col items-center gap-2">
        <Icon name="lucide:file-spreadsheet" class="size-16 text-muted-foreground/30" />
        <h1 class="text-2xl font-semibold text-foreground">CSV Editor</h1>
        <p class="text-sm text-muted-foreground max-w-md text-center">
          Drag and drop CSV files here, or click to browse. Supports up to {{ MAX_CSV_TABS }} tabs.
          Edit, filter, and manage your CSV data with ease.
        </p>
      </div>

      <div class="flex gap-3">
        <label>
          <Button as-child>
            <span>
              <Icon name="lucide:folder-open" class="size-4" />
              Open CSV File
            </span>
          </Button>
          <input
            type="file"
            accept=".csv"
            multiple
            class="hidden"
            @change="handleFileInput"
          />
        </label>
      </div>

      <div class="mt-8 p-4 border rounded-lg bg-muted/30 max-w-md">
        <h3 class="text-xs font-medium text-muted-foreground mb-2">Keyboard Shortcuts</h3>
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          <span class="text-muted-foreground">⌘S</span><span>Save changes</span>
          <span class="text-muted-foreground">⌘F</span><span>Toggle filter</span>
          <span class="text-muted-foreground">⌘R</span><span>Reload file</span>
          <span class="text-muted-foreground">⌘A</span><span>Select all</span>
          <span class="text-muted-foreground">⌥⌘⌫</span><span>Delete selected rows</span>
        </div>
      </div>
    </div>

    <!-- Tabs open: tab bar + active editor -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <!-- Tab Bar -->
      <div class="flex items-center border-b bg-muted/30 overflow-x-auto shrink-0">
        <div class="flex items-center flex-1 min-w-0">
          <button
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="group relative flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-border cursor-pointer select-none shrink-0 max-w-[200px] transition-colors"
            :class="index === activeTabIndex
              ? 'bg-background text-foreground border-b-2 border-b-primary -mb-[1px]'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'"
            @click="switchToTab(index)"
          >
            <Icon name="lucide:file-text" class="size-3.5 shrink-0" />
            <span class="truncate">{{ tab.name }}</span>
            <button
              class="ml-0.5 shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 p-0.5"
              @click="closeTab(index, $event)"
            >
              <Icon name="lucide:x" class="size-3" />
            </button>
          </button>
        </div>

        <!-- Add file button -->
        <label class="px-2 py-1.5 cursor-pointer hover:bg-accent/50 shrink-0">
          <Icon name="lucide:plus" class="size-4 text-muted-foreground" />
          <input
            type="file"
            accept=".csv"
            multiple
            class="hidden"
            @change="handleFileInput"
          />
        </label>
      </div>

      <!-- Tab count badge -->
      <div v-if="tabs.length > 1" class="px-3 py-0.5 text-[10px] text-muted-foreground bg-muted/20 border-b">
        {{ tabs.length }} / {{ MAX_CSV_TABS }} tabs
      </div>

      <!-- Active Editor -->
      <div class="flex-1 min-h-0">
        <CsvEditor :key="activeFileHandle?.id" :file-handle="activeFileHandle!" />
      </div>
    </div>
  </div>
</template>
