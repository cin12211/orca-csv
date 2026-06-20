/**
 * Factory that returns the correct storage implementation based on runtime platform.
 *
 * Platform resolution:
 *   isElectron() == true  → IPC-proxy wrappers around existing electron adapters (renderer → main via IPC; main uses SQLite)
 *   isElectron() == false → IDB entity storage singletons (localforage / IndexedDB)
 */
import {
  normalizeAppConfigState,
  normalizeAgentState,
} from '~/core/persist/store-state';
import type { MigrationState } from '~/core/types/entities/migration-state.entity';
import {
  connectionStorage,
  workspaceStateStorage,
  tabViewStorage,
  quickQueryLogStorage,
  appConfigStorage,
  agentStateStorage,
  migrationStateStorage,
} from './entities';
import type { StorageApis } from './types';

// ── Browser (IDB) path ────────────────────────────────────────────────────────

function createIDBStorageApis(): StorageApis {
  return {
    connectionStorage:
      connectionStorage as unknown as StorageApis['connectionStorage'],
    workspaceStateStorage:
      workspaceStateStorage as unknown as StorageApis['workspaceStateStorage'],
    tabViewStorage: tabViewStorage as unknown as StorageApis['tabViewStorage'],
    quickQueryLogStorage: {
      getAll: () => quickQueryLogStorage.getAll(),
      getByContext: ctx => quickQueryLogStorage.getByContext(ctx),
      create: log => quickQueryLogStorage.create(log),
      delete: props => quickQueryLogStorage.deleteByConnectionProps(props),
    },
    appConfigStorage: {
      get: () => appConfigStorage.get(),
      save: state => appConfigStorage.save(state),
      delete: () => appConfigStorage.deleteConfig(),
    },
    agentStorage: {
      get: () => agentStateStorage.get(),
      save: state => agentStateStorage.save(state),
      delete: () => agentStateStorage.deleteState(),
    },
    migrationStateStorage: {
      get: () => migrationStateStorage.get(),
      save: names => migrationStateStorage.save(names),
      clear: () => migrationStateStorage.clear(),
    },
  };
}

export function createStorageApis(): StorageApis {
  return createIDBStorageApis();
}
