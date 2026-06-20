<script setup lang="ts">
import { useHotkeys } from '~/core/composables/useHotKeys';
import { useTabViewsStore } from '~/core/stores/useTabViewsStore';
import TabViews from './TabViews.vue';

const tabsStore = useTabViewsStore();

// Tab keyboard shortcuts
useHotkeys([
  {
    key: 'meta+w',
    callback: () => {
      if (tabsStore.activeTab) {
        tabsStore.closeTab(tabsStore.activeTab.id);
      }
    },
  },
  {
    key: 'meta+alt+t',
    callback: () => {
      if (tabsStore.activeTab) {
        tabsStore.closeOtherTab(tabsStore.activeTab.id);
      }
    },
  },
]);
</script>

<template>
  <div class="w-screen h-9 select-none border-b pr-2 bg-sidebar-accent/50!">
    <div class="flex justify-between items-center h-full">
      <div class="flex items-center gap-2 h-full px-3">
        <img src="/logo.png" alt="OrcaQ Logo" class="h-8 w-8 object-contain" />
      </div>

      <TabViews />

      <div class="flex items-center gap-2">
        <!-- Placeholder for right side actions -->
      </div>
    </div>
  </div>
</template>
