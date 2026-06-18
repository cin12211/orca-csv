import { ref } from 'vue';
import type { CellValueChangedEvent } from 'ag-grid-community';
import { describe, expect, it } from 'vitest';
import { useCsvEditedCells } from '~/components/modules/csv-editor/hooks/useCsvEditedCells';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';

describe('useCsvEditedCells', () => {
  it('starts with no pending changes', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);

    const { editedCells, pendingChangesCount } = useCsvEditedCells({ originalData });

    expect(editedCells.value).toEqual([]);
    expect(pendingChangesCount.value).toBe(0);
  });

  it('tracks a cell value change', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);

    const { editedCells, onCellValueChanged } = useCsvEditedCells({ originalData });

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent);

    expect(editedCells.value).toHaveLength(1);
    expect(editedCells.value[0]).toEqual({
      rowId: 0,
      changedData: { age: '31' },
    });
  });

  it('removes change when value reverts to original', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);

    const { editedCells, onCellValueChanged } = useCsvEditedCells({ originalData });

    // Change
    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent);
    expect(editedCells.value).toHaveLength(1);

    // Revert
    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
      colDef: { field: 'age' },
      newValue: '30',
    } as unknown as CellValueChangedEvent);
    expect(editedCells.value).toHaveLength(0);
  });

  it('tracks changes across multiple cells in the same row', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30', city: 'NY' },
    ]);

    const { editedCells, onCellValueChanged } = useCsvEditedCells({ originalData });

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31', city: 'NY' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent);

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31', city: 'LA' },
      colDef: { field: 'city' },
      newValue: 'LA',
    } as unknown as CellValueChangedEvent);

    expect(editedCells.value).toHaveLength(1);
    expect(editedCells.value[0].changedData).toEqual({
      age: '31',
      city: 'LA',
    });
  });

  it('tracks changes across multiple rows', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
      { [HASH_INDEX_ID]: 1, name: 'Bob', age: '25' },
    ]);

    const { editedCells, onCellValueChanged, pendingChangesCount } = useCsvEditedCells({ originalData });

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent);

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 1, name: 'Bob', age: '26' },
      colDef: { field: 'age' },
      newValue: '26',
    } as unknown as CellValueChangedEvent);

    expect(pendingChangesCount.value).toBe(2);
  });

  it('hasEditedRows returns correct states', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
    ]);

    const { hasEditedRows, onCellValueChanged, clearEdits } = useCsvEditedCells({ originalData });

    expect(hasEditedRows()).toBe(false);

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Bob' },
      colDef: { field: 'name' },
      newValue: 'Bob',
    } as unknown as CellValueChangedEvent);

    expect(hasEditedRows()).toBe(true);

    clearEdits();
    expect(hasEditedRows()).toBe(false);
  });

  it('getPendingEditedRows returns current edits', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);

    const { getPendingEditedRows, onCellValueChanged } = useCsvEditedCells({ originalData });

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent);

    const pending = getPendingEditedRows();
    expect(pending).toHaveLength(1);
    expect(pending[0].rowId).toBe(0);
  });

  it('handles empty string values correctly', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
    ]);

    const { editedCells, onCellValueChanged } = useCsvEditedCells({ originalData });

    // Change to empty string — should still match (both empty string)
    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: '', age: '30' },
      colDef: { field: 'name' },
      newValue: '',
    } as unknown as CellValueChangedEvent);

    // 'Alice' !== '' so it should be tracked
    expect(editedCells.value).toHaveLength(1);
    expect(editedCells.value[0].changedData).toEqual({ name: '' });
  });

  it('ignores changes when field is missing', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice' },
    ]);

    const { editedCells, onCellValueChanged } = useCsvEditedCells({ originalData });

    onCellValueChanged({
      data: { [HASH_INDEX_ID]: 0, name: 'Alice' },
      colDef: { field: undefined },
      newValue: 'test',
    } as unknown as CellValueChangedEvent);

    expect(editedCells.value).toHaveLength(0);
  });
});
