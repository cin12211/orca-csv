import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { CsvFileHandle, CsvFileSystemAPI } from '@/core/services/csv';
import { HASH_INDEX_ID } from '~/core/constants';
import type { RowData } from '../types';
import { parseCsv } from '../utils';

export interface UseCsvDataOptions {
  /** File handle to load */
  fileHandle: Ref<CsvFileHandle | null>;

  /** Whether first row is headers */
  hasHeaders?: Ref<boolean>;

  /** File system implementation */
  csvFileSystem: CsvFileSystemAPI;
}

export interface UseCsvDataReturn {
  // State
  data: Ref<RowData[]>;
  headers: Ref<string[]>;
  originalHeaders: Ref<string[]>;
  /** Immutable snapshot of data as loaded from disk – never mutated by the grid */
  originalData: Ref<RowData[]>;
  isLoading: Ref<boolean>;
  parseError: Ref<string | undefined>;

  // Actions
  loadCsvData(): Promise<void>;
  refreshData(): Promise<void>;

  // Computed
  rowCount: ComputedRef<number>;
  columnCount: ComputedRef<number>;
}

export function useCsvData(options: UseCsvDataOptions): UseCsvDataReturn {
  const data = ref<RowData[]>([]);
  const headers = ref<string[]>([]);
  const originalHeaders = ref<string[]>([]);
  // Snapshot of data as loaded from disk – never mutated by the grid
  const originalData = ref<RowData[]>([]);
  const isLoading = ref(false);
  const parseError = ref<string | undefined>(undefined);

  const hasHeaders = options.hasHeaders ?? ref(true);

  const rowCount = computed(() => data.value.length);
  const columnCount = computed(() => headers.value.length);

  const loadCsvData = async () => {
    const handle = options.fileHandle.value;
    if (!handle) {
      data.value = [];
      headers.value = [];
      originalHeaders.value = [];
      parseError.value = undefined;
      return;
    }

    isLoading.value = true;
    parseError.value = undefined;

    try {
      const content = await options.csvFileSystem.readFile(handle);
      const parsed = await parseCsv(content, {
        headers: hasHeaders.value,
      });

      headers.value = parsed.headers;
      originalHeaders.value = [...parsed.headers];
      const rows = parsed.rows.map((row, index) => ({
        [HASH_INDEX_ID]: index,
        ...row,
      }));
      data.value = rows;
      // Deep-copy snapshot so originalData is never shared with the live grid data
      originalData.value = rows.map(r => ({ ...r }));
    } catch (error) {
      console.error('Failed to load CSV data:', error);
      parseError.value =
        error instanceof Error ? error.message : 'Unknown parsing error';
      data.value = [];
      headers.value = [];
      originalHeaders.value = [];
      originalData.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const refreshData = async () => {
    await loadCsvData();
  };

  return {
    data,
    headers,
    originalHeaders,
    originalData,
    isLoading,
    parseError,
    loadCsvData,
    refreshData,
    rowCount,
    columnCount,
  };
}
