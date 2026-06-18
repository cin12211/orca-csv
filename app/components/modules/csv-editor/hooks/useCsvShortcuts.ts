import type { Ref } from 'vue';
import { useHotkeys } from '~/core/composables/useHotKeys';
import type CsvFilter from '../components/CsvFilter.vue';

interface UseCsvShortcutsOptions {
  containerRef: Ref<HTMLElement | undefined>;
  csvFilterRef: Ref<InstanceType<typeof CsvFilter> | undefined>;
  gridApi: Ref<any>;
  canSave: Ref<boolean>;
  canDeleteRows: Ref<boolean>;
  onSaveData: () => void;
  onDeleteRows: () => void;
}

export const useCsvShortcuts = ({
  containerRef,
  csvFilterRef,
  gridApi,
  canSave,
  canDeleteRows,
  onSaveData,
  onDeleteRows,
}: UseCsvShortcutsOptions) => {
  useHotkeys(
    [
      {
        key: 'meta+a',
        callback: () => {
          gridApi.value?.selectAll();
        },
        excludeInput: true,
        isPreventDefault: true,
      },
      {
        key: 'meta+s',
        callback: () => {
          if (!canSave.value) return;
          onSaveData();
        },
        isPreventDefault: true,
      },
      {
        key: 'meta+alt+backspace',
        callback: () => {
          if (!canDeleteRows.value) return;
          onDeleteRows();
        },
        excludeInput: true,
        isPreventDefault: true,
      },
    ],
    {
      target: containerRef,
    }
  );

  useHotkeys([
    {
      key: 'meta+f',
      callback: async () => {
        await csvFilterRef.value?.onShowSearch();
      },
    },
  ]);
};
