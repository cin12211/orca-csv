<script setup lang="ts">
// main.ts (or the entry that mounts Vue)
import { LoadingOverlay, MigrationScreen, TooltipProvider } from '#components';
import { CommandPaletteView } from '@/components/modules/command-palette';
import { useMigrationState } from '~/core/composables/useMigrationState';
import {
  StrictModeConfirmDialog,
  useStrictModeGuardState,
} from './components/modules/environment-tag';
import Settings from './components/modules/settings';
import { Toaster } from './components/ui/sonner';
import { useAppearance } from './core/composables/useAppearance';
import { DEFAULT_DEBOUNCE_INPUT } from './core/constants';
import { useAppContext } from './core/contexts';
import { useChangelogModal } from './core/contexts/useChangelogModal';
import { useSettingsModal } from './core/contexts/useSettingsModal';

// initIDB() init in plugins/01.app-initialization.client.ts

// AG-Grid Module registration load in plugins/00.ag-grid.client.ts

// Analytics initialization load in plugins/03.analytics.client.ts

const {
  strictModeDialogOpen,
  activeStrictModeTags,
  confirmStrictModeDialog,
  cancelStrictModeDialog,
} = useStrictModeGuardState();

const appLoading = useAppLoading();
const { isLoading } = useLoadingIndicator();
const { isBlocking: isMigrating } = useMigrationState();

const { connectToConnection } = useAppContext();
const { openSettings } = useSettingsModal();

useAppearance();

useHead({
  title: 'OrcaQ CSV Viewer',
});

onMounted(async () => {
  // App initialization
});
</script>

<template>
  <ClientOnly>
    <MigrationScreen />
    <LoadingOverlay :visible="isLoading || appLoading.isLoading.value" />
    <NuxtLoadingIndicator
      :color="'repeating-linear-gradient(to right, #ffffff 0%, #000000 100%)'"
    />
    <TooltipProvider :delay-duration="DEFAULT_DEBOUNCE_INPUT">
      <div class="flex h-screen w-screen flex-col overflow-hidden">
        <div class="flex-1 min-h-0">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </div>
      </div>
    </TooltipProvider>

    <CommandPaletteView />
    <Settings />
    <StrictModeConfirmDialog
      :open="strictModeDialogOpen"
      :strict-tags="activeStrictModeTags"
      @confirm="confirmStrictModeDialog"
      @cancel="cancelStrictModeDialog"
    />
    <Toaster position="top-right" :close-button="true" />
  </ClientOnly>
</template>

<style>
@import url('./assets/global.css');
@import url('./assets/css/json-editor-overrides.css');
</style>
