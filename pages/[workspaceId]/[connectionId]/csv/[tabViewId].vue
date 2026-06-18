<script setup lang="ts">
import { computed } from 'vue';
import { CsvEditor } from '~/components/modules/csv-editor';
import type { CsvFileHandle } from '~/core/services/csv';
import { useTabViewsStore } from '~/core/stores/useTabViewsStore';

definePageMeta({
  layout: 'default',
});

const route = useRoute('workspaceId-connectionId-csv-tabViewId');
const tabViewsStore = useTabViewsStore();

const tabViewId = computed(() => route.params.tabViewId as string);
const tabView = computed(() => {
  const tab = tabViewsStore.tabViews.find(t => t.id === tabViewId.value);
  console.log('🔍 [CSV Page] Found tab:', tab);
  return tab;
});

const fileHandle = computed<CsvFileHandle | null>(() => {
  if (!tabView.value || !tabView.value.metadata) {
    console.warn('⚠️ [CSV Page] No tab or metadata found');
    return null;
  }

  const meta = tabView.value.metadata as any;
  console.log('🔍 [CSV Page] Tab metadata:', meta);

  // Determine platform: check for _electronPath first, then filePath
  const isElectronPlatform = !!meta._electronPath || !!meta.filePath;
  const platform = isElectronPlatform ? 'electron' : 'web';

  console.log('🔍 [CSV Page] Platform detection:', {
    isElectronPlatform,
    platform,
    hasFilePath: !!meta.filePath,
    hasElectronPath: !!meta._electronPath,
    hasWebHandle: !!meta._webHandle,
    hasFile: !!meta._file,
  });

  const handle: CsvFileHandle = {
    id: isElectronPlatform
      ? `electron-${meta.filePath}`
      : `web-${meta.fileName}-${meta.lastModified}`,
    name: meta.fileName,
    path: meta.filePath,
    size: meta.fileSize ?? 0,
    lastModified: meta.lastModified ?? Date.now(),
    platform,
    _electronPath: meta._electronPath || meta.filePath,
    _webHandle: meta._webHandle,
    _file: meta._file,
    _cachedContent: meta.cachedContent,
  };

  console.log('🔍 [CSV Page] Created file handle:', handle);
  return handle;
});

const initialHasHeaders = computed(() => {
  if (!tabView.value || !tabView.value.metadata) return true;
  return (tabView.value.metadata as any).hasHeaders ?? true;
});
</script>

<template>
  <div class="w-full h-full min-h-0 bg-background">
    <CsvEditor
      v-if="fileHandle"
      :file-handle="fileHandle"
      :initial-has-headers="initialHasHeaders"
    />
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none text-muted-foreground text-sm"
    >
      <Icon name="hugeicons:file-02" class="size-12 mb-3 opacity-60" />
      <span>CSV editor tab metadata is invalid or missing.</span>
    </div>
  </div>
</template>
