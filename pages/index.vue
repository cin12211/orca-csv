<script setup lang="ts">
import {
  useFileDialog,
  useDropZone,
  type MaybeComputedElementRef,
} from '@vueuse/core';
import { toast } from 'vue-sonner';
import { CsvDropOverlay } from '~/components/modules/csv-editor/components';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils';
import { useTabManagement } from '~/core/composables/useTabManagement';

definePageMeta({
  layout: 'home',
});

const { openCsvEditorTab } = useTabManagement();

const dropZoneRef = useTemplateRef('dropZoneRef');

const openFiles = async (files: File[] | null) => {
  if (!files || files.length === 0) return;

  try {
    const handles = await createCsvFileHandlesFromFiles(files);
    if (handles.length === 0) {
      toast.error(
        'No valid CSV files found. Only .csv files under 50MB are supported.'
      );
      return;
    }

    for (const handle of handles) {
      const content = handle._file ? await handle._file.text() : '';
      await openCsvEditorTab({
        fileHandle: handle,
        cachedContent: content,
      });
    }

    if (handles.length === 1) {
      toast.success(`Opened CSV file: ${handles[0].name}`);
    } else {
      toast.success(`Opened ${handles.length} CSV files`);
    }
  } catch (err) {
    console.error('Failed to open CSV files:', err);
    toast.error(
      err instanceof Error ? err.message : 'Failed to open CSV files'
    );
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: openFiles,
  dataTypes: ['text/csv'],
  multiple: true,
});

const { open: openFileDialog, onChange: onFileChange } = useFileDialog({
  accept: '.csv',
  multiple: true,
});

onFileChange(async files => {
  if (!files) return;
  await openFiles(Array.from(files));
});
</script>

<template>
  <div
    ref="dropZoneRef"
    class="relative w-full h-full flex flex-col items-center justify-center gap-4 p-8 select-none"
  >
    <Avatar class="rounded-2xl size-40">
      <AvatarImage src="/logo.png" alt="OrcaQ CSV Viewer" />
    </Avatar>

    <div class="text-2xl font-semibold mt-4">OrcaQ CSV Viewer</div>

    <div class="text-muted-foreground text-center max-w-md mt-1">
      Drag & drop CSV files here, or click the button below to open a file
    </div>

    <Button variant="default" size="lg" class="mt-4" @click="openFileDialog()">
      <Icon name="hugeicons:folder-open" class="size-5 mr-2" />
      Open CSV File
    </Button>

    <div class="text-muted-foreground text-sm mt-1">
      Supports .csv files up to 50MB
    </div>

    <CsvDropOverlay v-if="isOverDropZone" />
  </div>
</template>
