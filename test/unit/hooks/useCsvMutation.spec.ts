import { ref, type Ref } from 'vue';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useCsvMutation } from '~/components/modules/csv-editor/hooks/useCsvMutation';
import { useCsvEditedCells } from '~/components/modules/csv-editor/hooks/useCsvEditedCells';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { CsvFileHandle, CsvFileSystemAPI } from '~/core/services/csv';

function createMockFileSystem(): CsvFileSystemAPI {
  return {
    readFile: vi.fn().mockResolvedValue('name,age\nAlice,30'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    openFiles: vi.fn().mockResolvedValue([]),
    validateFile: vi.fn().mockResolvedValue({ valid: true }),
    getFileMetadata: vi.fn().mockResolvedValue({ name: 'test.csv', size: 100, type: 'text/csv', lastModified: 0 }),
  };
}

function createMockFileHandle(): CsvFileHandle {
  return {
    id: 'web-test-1',
    name: 'test.csv',
    size: 100,
    lastModified: 0,
    platform: 'web',
    _webHandle: {} as FileSystemFileHandle,
  };
}

describe('useCsvMutation', () => {
  let mockFs: CsvFileSystemAPI;
  let fileHandle: Ref<CsvFileHandle | null>;

  beforeEach(() => {
    mockFs = createMockFileSystem();
    fileHandle = ref<CsvFileHandle | null>(createMockFileHandle()) as Ref<CsvFileHandle | null>;
  });

  it('blocks mutations when read-only', () => {
    const data = ref<any[]>([]);
    const headers = ref<string[]>(['name', 'age']);
    const isReadOnly = ref(true);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddEmptyRow } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddEmptyRow();
    expect(data.value).toHaveLength(0);
  });

  it('adds empty row', () => {
    const data = ref<any[]>([{ [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' }]);
    const headers = ref<string[]>(['name', 'age']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([{ [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' }]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddEmptyRow } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddEmptyRow();

    expect(data.value).toHaveLength(2);
    expect(data.value[1][HASH_INDEX_ID]).toBe(1);
    expect(data.value[1].name).toBe('');
    expect(data.value[1].age).toBe('');
    expect(editedCells.editedCells.value).toHaveLength(1);
    expect(editedCells.editedCells.value[0].isNewRow).toBe(true);
  });

  it('adds row at specific position above', () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
      { [HASH_INDEX_ID]: 1, name: 'Bob' },
    ]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
      { [HASH_INDEX_ID]: 1, name: 'Bob' },
    ]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddRowAt } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddRowAt(0, 'above');

    expect(data.value).toHaveLength(3);
    expect(data.value[0][HASH_INDEX_ID]).toBe(2); // New max ID
    expect(data.value[0].name).toBe('');
    expect(data.value[1].name).toBe('Alice');
  });

  it('adds row at specific position below', () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
      { [HASH_INDEX_ID]: 1, name: 'Bob' },
    ]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
      { [HASH_INDEX_ID]: 1, name: 'Bob' },
    ]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddRowAt } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddRowAt(0, 'below');

    expect(data.value).toHaveLength(3);
    expect(data.value[1][HASH_INDEX_ID]).toBe(2);
    expect(data.value[0].name).toBe('Alice');
  });

  it('adds column at end', () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
    ]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
    ]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddColumn } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddColumn('age');

    expect(headers.value).toEqual(['name', 'age']);
    expect(data.value[0].age).toBe('');
  });

  it('adds column at left of reference', () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice', city: 'NY' },
    ]);
    const headers = ref<string[]>(['name', 'city']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice', city: 'NY' },
    ]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddColumn } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddColumn('age', { position: 'left', referenceColumn: 'city' });

    expect(headers.value).toEqual(['name', 'age', 'city']);
  });

  it('does not add duplicate column name', () => {
    const data = ref<any[]>([]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onAddColumn } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onAddColumn('name');
    expect(headers.value).toEqual(['name']);
  });

  it('deletes a column', () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);
    const headers = ref<string[]>(['name', 'age']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onDeleteColumn } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onDeleteColumn('age');

    expect(headers.value).toEqual(['name']);
    expect(data.value[0].age).toBeUndefined();
  });

  it('does not delete non-existent column', () => {
    const data = ref<any[]>([]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([]);
    const editedCells = useCsvEditedCells({ originalData });

    const { onDeleteColumn } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
    });

    onDeleteColumn('nonexistent');
    expect(headers.value).toEqual(['name']);
  });

  it('deletes rows and saves', async () => {
    const data = ref<any[]>([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
      { [HASH_INDEX_ID]: 1, name: 'Bob' },
      { [HASH_INDEX_ID]: 2, name: 'Charlie' },
    ]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([]);
    const editedCells = useCsvEditedCells({ originalData });
    const onSaveSuccess = vi.fn();

    const { onDeleteRows } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
      onSaveSuccess,
    });

    await onDeleteRows([0, 2]);

    expect(data.value).toHaveLength(1);
    expect(data.value[0].name).toBe('Bob');
    expect(mockFs.writeFile).toHaveBeenCalled();
    expect(onSaveSuccess).toHaveBeenCalled();
  });

  it('discard changes calls clearEdits and onDiscard callback', () => {
    const data = ref<any[]>([]);
    const headers = ref<string[]>(['name']);
    const isReadOnly = ref(false);
    const hasHeaders = ref(true);
    const originalData = ref<any[]>([]);
    const editedCells = useCsvEditedCells({ originalData });
    const onDiscard = vi.fn();

    const { onDiscardChanges } = useCsvMutation({
      fileHandle,
      isReadOnly,
      data,
      headers,
      hasHeaders,
      editedCells,
      csvFileSystem: mockFs,
      onDiscard,
    });

    onDiscardChanges();
    expect(editedCells.editedCells.value).toHaveLength(0);
    expect(onDiscard).toHaveBeenCalled();
  });
});
