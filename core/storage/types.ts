import type { DeleteTabViewProps } from '~/core/persist/types';
import type {
  Connection,
  WorkspaceState,
  TabView,
  QuickQueryLog,
  AppConfigPersistedState,
  AgentPersistedState,
  MigrationState,
} from '~/core/types/entities';

// ── 4.1 ConnectionStorageApi ──────────────────────────────────────────────────

export interface ConnectionStorageApi {
  getAll(): Promise<Connection[]>;
  getOne(id: string): Promise<Connection | null>;
  getByWorkspaceId(wsId: string): Promise<Connection[]>;
  create(conn: Connection): Promise<Connection>;
  update(conn: Connection): Promise<Connection | null>;
  delete(id: string): Promise<Connection | null | void>;
}

// ── 4.2 WorkspaceStateStorageApi ─────────────────────────────────────────────

export interface WorkspaceStateStorageApi {
  getAll(): Promise<WorkspaceState[]>;
  create(ws: WorkspaceState): Promise<WorkspaceState>;
  update(ws: WorkspaceState): Promise<WorkspaceState | null>;
  delete(id: string): Promise<WorkspaceState | null | void>;
}

// ── 4.3 TabViewStorageApi ─────────────────────────────────────────────────────

export interface TabViewStorageApi {
  getAll(): Promise<TabView[]>;
  getByContext(ctx: {
    workspaceId: string;
    connectionId: string;
  }): Promise<TabView[]>;
  create(tab: TabView): Promise<TabView>;
  delete(id: string): Promise<TabView | null>;
  deleteByProps(props: DeleteTabViewProps): Promise<void>;
  bulkDeleteByProps(propsArray: DeleteTabViewProps[]): Promise<void>;
  replaceAll(tabs: TabView[]): Promise<void>;
}

// ── 4.4 QuickQueryLogStorageApi ───────────────────────────────────────────────

export interface QuickQueryLogStorageApi {
  getAll(): Promise<QuickQueryLog[]>;
  getByContext(ctx: { connectionId: string }): Promise<QuickQueryLog[]>;
  create(log: QuickQueryLog): Promise<QuickQueryLog>;
  delete(
    props:
      | { workspaceId: string }
      | { connectionId: string }
      | { connectionId: string; schemaName: string; tableName: string }
  ): Promise<void>;
}

// ── 4.5 AppConfigStorageApi (single-record) ────────────────────────────────────

export interface AppConfigStorageApi {
  get(): Promise<AppConfigPersistedState>; // never returns null
  save(state: AppConfigPersistedState): Promise<void>;
  delete(): Promise<void>;
}

// ── 4.6 AgentStateStorageApi (single-record) ───────────────────────────────────

export interface AgentStateStorageApi {
  get(): Promise<AgentPersistedState>; // never returns null
  save(state: AgentPersistedState): Promise<void>;
  delete(): Promise<void>;
}

// ── 4.7 QueryBuilderStateStorageApi ──────────────────────────────────────────
// QB state is persisted directly in localStorage by useTableQueryBuilder.
// No storage API layer needed.

// ── 4.8 MigrationStateStorageApi ────────────────────────────────────────────

export interface MigrationStateStorageApi {
  get(): Promise<MigrationState | null>;
  save(names: string[]): Promise<void>;
  clear(): Promise<void>;
}

// ── 5. StorageApis — Factory Return Type ──────────────────────────────────────

export interface StorageApis {
  connectionStorage: ConnectionStorageApi;
  workspaceStateStorage: WorkspaceStateStorageApi;
  tabViewStorage: TabViewStorageApi;
  quickQueryLogStorage: QuickQueryLogStorageApi;
  appConfigStorage: AppConfigStorageApi;
  agentStorage: AgentStateStorageApi;
  migrationStateStorage: MigrationStateStorageApi;
}
