<script setup lang="ts">
import { useDropZone, type MaybeComputedElementRef } from '@vueuse/core';
import { toast } from 'vue-sonner';
import { StatusBar, TabViewContainer } from '~/components/modules/app-shell';
import { CsvDropOverlay } from '~/components/modules/csv-editor/components';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils';
import { useTabManagement } from '~/core/composables/useTabManagement';
import { DEFAULT_DEBOUNCE_INPUT } from '~/core/constants';
import { useAppConfigStore } from '~/core/stores/appConfigStore';

const appConfigStore = useAppConfigStore();
const { bodySize } = storeToRefs(appConfigStore);

const { chatUiVars } = useAppearance();

const { openCsvEditorTab } = useTabManagement();

const dropZoneRef = useTemplateRef('dropZoneRef');

const onDrop = async (files: File[] | null) => {
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
    console.error('Failed to open dropped CSV files:', err);
    toast.error(
      err instanceof Error ? err.message : 'Failed to open CSV files'
    );
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['text/csv'],
  multiple: true,
});
</script>

<template>
  <div ref="dropZoneRef" class="relative w-screen h-screen overflow-hidden">
    <div
      class="h-full w-screen flex flex-col flex-1 max-h-screen overflow-y-auto"
      :style="chatUiVars"
    >
      <TabViewContainer />

      <div
        class="h-full flex overflow-y-auto w-screen max-w-screen overflow-x-hidden"
        v-auto-animate="{ duration: DEFAULT_DEBOUNCE_INPUT }"
      >
        <div class="overflow-y-auto w-full h-full">
          <ResizablePanelGroup
            id="default-layout-body-group"
            direction="vertical"
            v-model="bodySize"
            @layout="appConfigStore.onResizeBody"
          >
            <ResizablePanel
              id="default-layout-body-group-panel-1"
              key="default-layout-body-group-panel-1"
            >
              <div class="flex flex-col overflow-y-auto w-full h-full">
                <div class="h-full">
                  <slot />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      <StatusBar />
    </div>

    <CsvDropOverlay v-if="isOverDropZone" />
  </div>
</template>
