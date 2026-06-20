import type { Connection, TabView } from '../types/entities';
import type { QuickQueryLog } from '../types/entities';
import type { WorkspaceState } from '../types/entities';
import type {
  AgentPersistedState,
  AppConfigPersistedState,
} from './store-state';

// ── Shared filter / query types ──────────────────────────────────────

export interface GetTabViewsByContextProps {
  workspaceId: string;
  connectionId: string;
}

export interface DeleteTabViewProps {
  id?: string;
  connectionId?: string;
  schemaId?: string;
}

export interface GetQQueryLogsProps {
  connectionId: string;
}

export type DeleteQQueryLogsProps =
  | { workspaceId: string }
  | { connectionId: string }
  | { connectionId: string; schemaName: string; tableName: string };

// ── Per-entity API contracts ─────────────────────────────────────────

export interface WorkspaceStatePersistApi {
  getAll(): Promise<WorkspaceState[]>;
  create(wsState: WorkspaceState): Promise<WorkspaceState>;
  update(wsState: WorkspaceState): Promise<WorkspaceState | null>;
  delete(id: string): Promise<WorkspaceState | null | void>;
}

export interface ConnectionPersistApi {
  getAll(): Promise<Connection[]>;
  getByWorkspaceId(workspaceId: string): Promise<Connection[]>;
  getOne(id: string): Promise<Connection | null>;
  create(connection: Connection): Promise<Connection>;
  update(connection: Connection): Promise<Connection | null>;
  delete(id: string): Promise<Connection | null | void>;
}

export interface TabViewsPersistApi {
  getAll(): Promise<TabView[]>;
  getByContext(props: GetTabViewsByContextProps): Promise<TabView[]>;
  create(tabView: TabView): Promise<TabView>;
  update(tabView: TabView): Promise<TabView | null>;
  delete(props: DeleteTabViewProps): Promise<TabView | null | void>;
  bulkDelete(propsArray: DeleteTabViewProps[]): Promise<TabView[] | void>;
}

export interface QuickQueryLogsPersistApi {
  getAll(): Promise<QuickQueryLog[]>;
  getByContext(props: GetQQueryLogsProps): Promise<QuickQueryLog[]>;
  create(qqLog: QuickQueryLog): Promise<QuickQueryLog>;
  update(qqLog: QuickQueryLog): Promise<QuickQueryLog | null>;
  delete(props: DeleteQQueryLogsProps): Promise<void>;
}

export interface AppConfigPersistApi {
  get(): Promise<AppConfigPersistedState | null>;
  save(state: AppConfigPersistedState): Promise<AppConfigPersistedState>;
  delete(): Promise<void>;
}

export interface AgentPersistApi {
  get(): Promise<AgentPersistedState | null>;
  save(state: AgentPersistedState): Promise<AgentPersistedState>;
  delete(): Promise<void>;
}

// ── QueryBuilderState ────────────────────────────────────────────────
// QB state is persisted directly in localStorage by useTableQueryBuilder.
// No API layer needed.
