import { storeToRefs } from 'pinia';
import type { RoutesNamesList } from '@typed-router/__routes';
import { useWorkspaceConnectionRoute } from '~/core/composables/useWorkspaceConnectionRoute';
import { TabViewType, useTabViewsStore } from '~/core/stores/useTabViewsStore';
import { useWSStateStore } from '~/core/stores/useWSStateStore';
import {
  useWorkspacesStore,
  type Workspace,
} from '~/core/stores/useWorkspacesStore';

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
    case TabViewType.CSVEditor:
      return 'csv-tabViewId' as RoutesNamesList;
    default:
      return 'csv-tabViewId' as RoutesNamesList;
  }
}

export const useTabManagement = () => {
  const tabViewStore = useTabViewsStore();
  const wsStateStore = useWSStateStore();
  const { workspaceId, connectionId } = useWorkspaceConnectionRoute();
  const workspacesStore = useWorkspacesStore();
  const { schemaId } = storeToRefs(wsStateStore);

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

    if (!targetWorkspaceId) {
      const sortedWorkspaces = [...workspacesStore.workspaces].sort((a, b) => {
        const aTime = a.lastOpened || a.createdAt;
        const bTime = b.lastOpened || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      if (sortedWorkspaces.length > 0) {
        targetWorkspaceId = sortedWorkspaces[0].id;
      } else {
        const newWorkspace: Workspace = {
          id: crypto.randomUUID(),
          icon: 'hugeicons:folder',
          name: 'My CSVs',
          createdAt: new Date().toISOString(),
        };
        await workspacesStore.createWorkspace(newWorkspace);
        targetWorkspaceId = newWorkspace.id;
      }
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
    const targetConnectionId = connectionId.value || 'local';

    await tabViewStore.ensureTab({
      id: tabId,
      name: fileName,
      icon: 'hugeicons:csv-01',
      type: TabViewType.CSVEditor,
      routeName: 'csv-tabViewId' as RoutesNamesList,
      routeParams: {
        tabViewId: tabId,
      },
      connectionId: targetConnectionId,
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
    openCsvEditorTab,
  };
};
