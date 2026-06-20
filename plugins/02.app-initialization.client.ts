import { useAppConfigStore } from '~/core/stores';

export default defineNuxtPlugin(async () => {
  // Platform storage and schema migrations are handled by 01.migration.client.ts.
  // This plugin only hydrates essential stores.

  // 1. Hydrate Essential Stores — required for any route to function properly.
  const appConfigStore = useAppConfigStore();

  try {
    await appConfigStore.loadPersistData();
    console.log('[Init Plugin] Essential stores hydrated.');
  } catch (error) {
    console.error('[Init Plugin] Failed to hydrate stores:', error);
  }
});
