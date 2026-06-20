import { idbReplaceAll } from '~/core/persist/adapters/idb/primitives';
import {
  PERSIST_COLLECTIONS,
  type PersistCollection,
} from '~/core/storage/idbRegistry';

async function clearBrowserPersistedData(): Promise<void> {
  await Promise.all(
    PERSIST_COLLECTIONS.map(collection =>
      idbReplaceAll(collection as PersistCollection, [])
    )
  );
}

export function useResetAllData() {
  const isResetting = ref(false);

  const resetAllData = async (): Promise<void> => {
    if (isResetting.value) {
      return;
    }

    isResetting.value = true;

    try {
      await clearBrowserPersistedData();

      localStorage.clear();
      window.sessionStorage?.clear();
      window.location.reload();
    } finally {
      isResetting.value = false;
    }
  };

  return {
    isResetting,
    resetAllData,
  };
}
