import { storeToRefs } from 'pinia';
import type { RoutesNamesList } from '@typed-router/__routes';
import { useWorkspaceConnectionRoute } from '~/core/composables/useWorkspaceConnectionRoute';
import { useManagementConnectionStore } from '~/core/stores/managementConnectionStore';
import { useExplorerFileStore } from '~/core/stores/useExplorerFileStore';
import { TabViewType, useTabViewsStore } from '~/core/stores/useTabViewsStore';
import { useWSStateStore } from '~/core/stores/useWSStateStore';
import { useWorkspacesStore } from '~/core/stores/useWorkspacesStore';
import {
  WorkspaceSqlFileSource,
  WorkspaceTabOpenAction,
} from '~/core/types/entities';

export interface OpenTabOptions {
  id: string;
  name: string;
  icon?: string;
  iconClass?: string;
  type: TabViewType;
  routeName: RoutesNamesList;
  routeParams?: Record<string, any>;
  metadata?: any;
}

export function resolveRouteNameForTabType(type: TabViewType): RoutesNamesList {
  switch (type) {
    case TabViewType.AgentChat:
      return 'workspaceId-connectionId-agent-tabViewId';
    case TabViewType.RedisBrowser:
    case TabViewType.RedisPubSub:
      return 'workspaceId-connectionId-redis-tabViewId' as RoutesNamesList;
    case TabViewType.CSVEditor:
      return 'workspaceId-connectionId-csv-tabViewId' as RoutesNamesList;
    default:
      return 'workspaceId-connectionId-quick-query-tabViewId';
  }
}

export const useTabManagement = () => {
  const tabViewStore = useTabViewsStore();
  const wsStateStore = useWSStateStore();
  const explorerFileStore = useExplorerFileStore();
  const { workspaceId, connectionId } = useWorkspaceConnectionRoute();
  const connectionStore = useManagementConnectionStore();
  const workspacesStore = useWorkspacesStore();
  const { schemaId } = storeToRefs(wsStateStore);

  const openTab = async (options: OpenTabOptions) => {
    if (!workspaceId.value || !connectionId.value) {
      return;
    }

    await tabViewStore.ensureTab({
      icon: options.icon || 'hugeicons:grid-table',
      iconClass: options.iconClass,
      id: options.id,
      name: options.name,
      type: options.type,
      routeName: options.routeName,
      routeParams: {
        ...options.routeParams,
        workspaceId: workspaceId.value,
        connectionId: connectionId.value,
      },
      connectionId: connectionId.value,
      schemaId: schemaId.value || '',
      workspaceId: workspaceId.value,
      metadata: {
        ...options.metadata,
        type: options.type,
      },
    });
  };

  const openCodeQueryTab = async (params: {
    id: string;
    name: string;
    icon?: string;
    metadata?: Record<string, any>;
  }) => {
    await openTab({
      id: params.id,
      name: params.name,
      icon: params.icon || 'lucide:file',
      type: TabViewType.CodeQuery,
      routeName: 'workspaceId-connectionId-explorer-fileId',
      routeParams: {
        fileId: params.id,
      },
      metadata: {
        tableName: params.name,
        treeNodeId: params.id,
        ...params.metadata,
      },
    });
  };

  const openStarterSqlTab = async () => {
    const file = await explorerFileStore.ensureStarterSqlFile();

    if (!file) {
      return;
    }

    await openCodeQueryTab({
      id: file.id,
      name: file.title,
      icon: file.icon,
      metadata: {
        fileSource: WorkspaceSqlFileSource.Starter,
        openAction: WorkspaceTabOpenAction.SqlShortcut,
      },
    });
  };

  const openNewSqlFileTab = async () => {
    const file = await explorerFileStore.createNextSqlFile();

    if (!file) {
      return;
    }

    await openCodeQueryTab({
      id: file.id,
      name: file.title,
      icon: file.icon,
      metadata: {
        fileSource: WorkspaceSqlFileSource.ManualCreate,
        openAction: WorkspaceTabOpenAction.NewSqlFile,
      },
    });
  };

  const openSchemaItemTab = async (params: {
    id: string;
    name: string;
    type: TabViewType;
    icon?: string;
    iconClass?: string;
    itemValueId?: string | number;
    treeNodeId?: string;
  }) => {
    const tabId = `${params.name}-${schemaId.value}`;
    const virtualTableId =
      params.type === TabViewType.ViewDetail
        ? String(params.itemValueId ?? params.treeNodeId ?? '')
        : undefined;

    await openTab({
      id: tabId,
      name: params.name,
      icon: params.icon,
      iconClass: params.iconClass,
      type: params.type,
      routeName: resolveRouteNameForTabType(params.type),
      routeParams: {
        tabViewId: tabId,
      },
      metadata: {
        tableName: params.name,
        virtualTableId,
        functionId: String(params.itemValueId || ''),
        treeNodeId: params.treeNodeId,
      },
    });
  };

  const openRedisTab = async (params: {
    id: string;
    name: string;
    type: TabViewType.RedisBrowser | TabViewType.RedisPubSub;
    icon?: string;
    iconClass?: string;
    metadata?: Record<string, any>;
  }) => {
    await openTab({
      id: params.id,
      name: params.name,
      icon: params.icon || 'hugeicons:database-sync-01',
      iconClass: params.iconClass,
      type: params.type,
      routeName: resolveRouteNameForTabType(params.type),
      routeParams: {
        tabViewId: params.id,
      },
      metadata: params.metadata,
    });
  };

  const openUserPermissionsTab = async (params: {
    roleName: string;
    icon?: string;
    iconClass?: string;
    treeNodeId?: string;
  }) => {
    const tabId = `user-permissions-${params.roleName}`;

    await openTab({
      id: tabId,
      name: `${params.roleName} Permissions`,
      icon: params.icon || 'hugeicons:user-circle',
      iconClass: params.iconClass,
      type: TabViewType.UserPermissions,
      routeName: 'workspaceId-connectionId-user-permissions-roleName',
      routeParams: {
        roleName: params.roleName,
      },
      metadata: {
        roleName: params.roleName,
        treeNodeId: params.treeNodeId,
      },
    });
  };

  const openInstanceInsightsTab = async (params?: {
    databaseName?: string;
    databaseIndex?: number;
  }) => {
    if (!workspaceId.value || !connectionId.value) return;

    const selectedConnection = connectionStore.connections.find(
      c => c.id === connectionId.value
    );

    const databaseName =
      params?.databaseName ||
      selectedConnection?.database ||
      selectedConnection?.name ||
      'Instance Insights';

    const tabId = `instance-insights-${connectionId.value}`;

    await openTab({
      id: tabId,
      name: `${databaseName} - Insights`,
      icon: 'hugeicons:activity-02',
      iconClass: 'text-primary',
      type: TabViewType.InstanceInsights,
      routeName: 'workspaceId-connectionId-instance-insights',
      routeParams: {
        workspaceId: workspaceId.value,
        connectionId: connectionId.value,
      },
      metadata: {
        openAction: WorkspaceTabOpenAction.InstanceInsights,
        databaseIndex: params?.databaseIndex,
      },
    });
  };

  const openSchemaDiffTab = async () => {
    if (!workspaceId.value || !connectionId.value) return;

    const selectedConnection = connectionStore.connections.find(
      c => c.id === connectionId.value
    );

    const databaseName =
      selectedConnection?.database || selectedConnection?.name || 'Schema Diff';

    const tabId = `schema-diff-${connectionId.value}`;

    await openTab({
      id: tabId,
      name: `${databaseName} · Schema Diff`,
      icon: 'hugeicons:git-compare',
      iconClass: 'text-primary',
      type: TabViewType.SchemaDiff,
      routeName: 'workspaceId-connectionId-database-tools-schema-diff',
      routeParams: {
        workspaceId: workspaceId.value,
        connectionId: connectionId.value,
      },
      metadata: {
        toolType: 'schema-diff',
        module: 'database-tools',
      },
    });
  };

  const openDatabaseToolsTab = async (params: {
    databaseName: string;
    type?: 'export' | 'import';
  }) => {
    if (!workspaceId.value || !connectionId.value) return;

    const tabId = `database-tools-${connectionId.value}`;
    const toolTab = params.type ?? 'export';

    await openTab({
      id: tabId,
      name: `${params.databaseName} · Backup & Restore`,
      icon: 'hugeicons:database-import',
      type: TabViewType.DatabaseTools,
      routeName: 'workspaceId-connectionId-database-tools-backup-restore-name',
      routeParams: {
        name: toolTab,
      },
      metadata: {
        toolType: 'backup-restore',
        backupRestoreTab: toolTab,
        module: 'database-tools',
      },
    });
  };

  const openCsvEditorTab = async (params: {
    filePath?: string;
    fileName?: string;
    hasHeaders?: boolean;
    fileSize?: number;
    lastModified?: number;
    fileHandle?: any;
    cachedContent?: string;
  }) => {
    let targetWorkspaceId = workspaceId.value;

    // If no workspaceId in route, fall back to most recently opened workspace
    if (!targetWorkspaceId) {
      const sortedWorkspaces = [...workspacesStore.workspaces].sort((a, b) => {
        const aTime = a.lastOpened || a.createdAt;
        const bTime = b.lastOpened || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      if (sortedWorkspaces.length === 0) {
        throw new Error(
          'No workspace available. Please create a workspace first.'
        );
      }

      targetWorkspaceId = sortedWorkspaces[0].id;
    }

    const fileHandle = params.fileHandle;
    const filePath = fileHandle?.path ?? params.filePath;
    const fileName = fileHandle?.name ?? params.fileName ?? 'Unnamed CSV';
    const fileSize = fileHandle?.size ?? params.fileSize;
    const lastModified = fileHandle?.lastModified ?? params.lastModified;
    const hasHeaders = params.hasHeaders ?? true;
    const _webHandle = fileHandle?._webHandle;
    const _file = fileHandle?._file;

    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    };

    const uniqueKey = filePath || `${fileName}-${lastModified}`;
    const tabId = `csv-${hashString(uniqueKey)}`;

    console.log('🔍 [openCsvEditorTab] Creating CSV tab with metadata:', {
      tabId,
      fileName,
      filePath,
      hasWebHandle: !!_webHandle,
      hasFile: !!_file,
      platform: fileHandle?.platform,
    });

    // CSV editor is connection-independent — bypass openTab's connectionId guard
    // and call tabViewStore.ensureTab directly.
    await tabViewStore.ensureTab({
      id: tabId,
      name: fileName,
      icon: 'hugeicons:csv-01',
      type: TabViewType.CSVEditor,
      routeName: 'workspaceId-connectionId-csv-tabViewId' as RoutesNamesList,
      routeParams: {
        tabViewId: tabId,
        workspaceId: targetWorkspaceId,
        connectionId: connectionId.value,
      },
      connectionId: connectionId.value || '',
      schemaId: schemaId.value || '',
      workspaceId: targetWorkspaceId,
      metadata: {
        type: TabViewType.CSVEditor,
        filePath,
        fileName,
        hasHeaders,
        fileSize,
        encoding: 'utf-8',
        lastModified,
        _webHandle,
        _file,
        cachedContent: params.cachedContent,
      },
    });
  };

  return {
    openTab,
    openCodeQueryTab,
    openStarterSqlTab,
    openNewSqlFileTab,
    openSchemaItemTab,
    openRedisTab,
    openUserPermissionsTab,
    openInstanceInsightsTab,
    openSchemaDiffTab,
    openDatabaseToolsTab,
    openCsvEditorTab,
  };
};
