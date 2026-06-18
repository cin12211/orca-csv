<script setup lang="ts">
import {
  useDropZone,
  useElementSize,
  type MaybeComputedElementRef,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';
import {
  ActivityBar,
  PrimarySideBar,
  SecondarySideBar,
  StatusBar,
  TabViewContainer,
} from '~/components/modules/app-shell';
import { CsvDropOverlay } from '~/components/modules/csv-editor/components';
import { createCsvFileHandlesFromFiles } from '~/components/modules/csv-editor/utils';
import { useTabManagement } from '~/core/composables/useTabManagement';
import { DEFAULT_DEBOUNCE_INPUT } from '~/core/constants';
import { useAppConfigStore } from '~/core/stores/appConfigStore';

const route = useRoute();

const primarySideBarPanelRef = useTemplateRef('primarySideBarPanel');
const { width: primarySideBarWidth } = useElementSize(
  primarySideBarPanelRef as MaybeComputedElementRef
);

const appConfigStore = useAppConfigStore();
const { layoutSize, isPrimarySidebarCollapsed, bodySize } =
  storeToRefs(appConfigStore);

const { chatUiVars } = useAppearance();

const isAccessBottomPanel = computed(() => {
  if (route.meta.notAllowBottomPanel) return false;
  return true;
});

const isAccessRightPanel = computed(() => {
  if (route.meta.notAllowRightPanel) return false;
  return true;
});

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
      // Read file content immediately since File objects can't be serialized
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

useHotkeys([
  {
    key: 'meta+shift+b',
    callback: () => {
      if (isAccessRightPanel.value) {
        appConfigStore.onToggleSecondSidebar();
      }
    },
  },
  {
    key: 'meta+b',
    callback: () => {
      appConfigStore.onToggleActivityBarPanel();
    },
  },
  {
    key: 'meta+j',
    callback: () => {
      if (isAccessBottomPanel.value) {
        appConfigStore.onToggleBottomPanel();
      }
    },
  },
]);
</script>

<template>
  <div ref="dropZoneRef" class="relative w-screen h-screen overflow-hidden">
    <ResizablePanelGroup
      direction="horizontal"
      id="default-layout-group-1"
      @layout="appConfigStore.onResizeLayout($event)"
    >
      <div
        class="h-full w-screen flex flex-col flex-1 max-h-screen overflow-y-auto"
        :style="chatUiVars"
      >
        <TabViewContainer :primarySideBarWidth="primarySideBarWidth" />

        <div
          class="h-full flex overflow-y-auto w-screen max-w-screen overflow-x-hidden"
          v-auto-animate="{ duration: DEFAULT_DEBOUNCE_INPUT }"
        >
          <ActivityBar v-if="isPrimarySidebarCollapsed" />

          <ResizablePanel
            :min-size="10"
            :max-size="40"
            :default-size="layoutSize[0]"
            :collapsed-size="0"
            ref="primarySideBarPanel"
            collapsible
            id="default-layout-group-1-panel-1"
            key="primarySideBarPanel"
            class="bg-sidebar/50 dark:bg-sidebar"
          >
            <PrimarySideBar />
          </ResizablePanel>
          <ResizableHandle
            class="[&[data-state=hover]]:bg-primary/30! [&[data-state=drag]]:bg-primary/20!"
            id="default-layout-group-1-resize-1"
            with-handle
          />
          <ResizablePanel
            id="default-layout-group-1-panel-2"
            key="contentPanel"
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
                <ResizableHandle
                  class="[&[data-state=hover]]:bg-primary/30! [&[data-state=drag]]:bg-primary/20!"
                  with-handle
                  v-show="isAccessBottomPanel"
                />

                <ResizablePanel
                  :min-size="10"
                  :max-size="70"
                  :default-size="bodySize[1]"
                  :collapsed-size="0"
                  collapsible
                  id="default-layout-body-group-panel-2"
                  key="default-layout-body-group-panel-2"
                  v-show="isAccessBottomPanel"
                >
                  <div
                    class="flex flex-col flex-1 h-full p-1"
                    id="bottom-panel"
                  ></div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
          <ResizableHandle
            class="[&[data-state=hover]]:bg-primary/30! [&[data-state=drag]]:bg-primary/20!"
            id="default-layout-group-1-resize-2"
            with-handle
            v-show="isAccessRightPanel"
          />
          <ResizablePanel
            id="default-layout-group-1-panel-3"
            :min-size="15"
            :max-size="40"
            :default-size="layoutSize[2]"
            :collapsed-size="0"
            collapsible
            key="secondarySideBarPanel"
            v-show="isAccessRightPanel"
            class="bg-sidebar"
          >
            <SecondarySideBar />
          </ResizablePanel>
        </div>
        <StatusBar />
      </div>
    </ResizablePanelGroup>

    <CsvDropOverlay v-if="isOverDropZone" />
  </div>
</template>
