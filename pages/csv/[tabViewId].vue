<script setup lang="ts">
import { computed, markRaw } from 'vue';
import { BaseEmpty } from '~/components/base/base-empty';
import { CsvEditor } from '~/components/modules/csv-editor';
import type { CsvFileHandle } from '~/core/services/csv';
import { useTabViewsStore } from '~/core/stores/useTabViewsStore';

definePageMeta({
  layout: 'default',
});

const route = useRoute('csv-tabViewId');
const tabViewsStore = useTabViewsStore();

const tabViewId = computed(() => route.params.tabViewId as string);
const tabView = computed(() => {
  const tab = tabViewsStore.tabViews.find(t => t.id === tabViewId.value);
  return tab;
});

const fileHandle = computed<CsvFileHandle | null>(() => {
  if (!tabView.value || !tabView.value.metadata) {
    return null;
  }

  const meta = tabView.value.metadata as any;

  const platform = 'web';

  const handle: CsvFileHandle = {
    id: `web-${tabViewId.value}`,
    name: meta.fileName,
    path: meta.filePath,
    size: meta.fileSize ?? 0,
    lastModified: meta.lastModified ?? Date.now(),
    platform,
    _webHandle: meta._webHandle ? markRaw(meta._webHandle) : undefined,
    _file: meta._file ? markRaw(meta._file) : undefined,
    _cachedContent: meta.cachedContent,
  };

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
      :key="fileHandle.id"
      :file-handle="fileHandle"
      :initial-has-headers="initialHasHeaders"
    />
    <BaseEmpty v-else desc="CSV editor tab metadata is invalid or missing." />
  </div>
</template>
