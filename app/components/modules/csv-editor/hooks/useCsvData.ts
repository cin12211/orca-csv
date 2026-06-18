import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { CsvFileHandle, CsvFileSystemAPI } from '@/core/services/csv';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { RowData } from '../types';
import { parseCsv } from '../utils';

export interface UseCsvDataOptions {
  fileHandle: Ref<CsvFileHandle | null>;
  hasHeaders?: Ref<boolean>;
  csvFileSystem: CsvFileSystemAPI;
}

export interface UseCsvDataReturn {
  data: Ref<RowData[]>;
  headers: Ref<string[]>;
  originalHeaders: Ref<string[]>;
  originalData: Ref<RowData[]>;
  isLoading: Ref<boolean>;
  parseError: Ref<string | undefined>;
  loadCsvData(): Promise<void>;
  refreshData(): Promise<void>;
  rowCount: ComputedRef<number>;
  columnCount: ComputedRef<number>;
}

export function useCsvData(options: UseCsvDataOptions): UseCsvDataReturn {
  const data = ref<RowData[]>([]);
  const headers = ref<string[]>([]);
  const originalHeaders = ref<string[]>([]);
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
