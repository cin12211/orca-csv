import type { RoutesNamesList } from '@typed-router/__routes';
import { useWorkspaceConnectionRoute } from '~/core/composables/useWorkspaceConnectionRoute';
import { TabViewType, useTabViewsStore } from '~/core/stores/useTabViewsStore';

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
  const { workspaceId, connectionId } = useWorkspaceConnectionRoute();

  const openCsvEditorTab = async (params: {
    filePath?: string;
    fileName?: string;
    hasHeaders?: boolean;
    fileSize?: number;
    lastModified?: number;
    fileHandle?: any;
    cachedContent?: string;
  }) => {
    const targetWorkspaceId = workspaceId.value ?? '';

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
      schemaId: '',
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
