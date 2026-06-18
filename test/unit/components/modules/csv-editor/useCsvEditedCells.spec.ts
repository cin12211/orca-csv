import { ref } from 'vue';
import type { CellValueChangedEvent } from 'ag-grid-community';
import { describe, expect, it } from 'vitest';
import { useCsvEditedCells } from '~/components/modules/csv-editor/hooks/useCsvEditedCells';
import { HASH_INDEX_ID } from '~/core/constants';

describe('useCsvEditedCells hook', () => {
  it('tracks modifications relative to original data', () => {
    const originalData = ref([
      { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
      { [HASH_INDEX_ID]: 1, name: 'Bob', age: '25' },
    ]);

    const { editedCells, onCellValueChanged, pendingChangesCount } =
      useCsvEditedCells({
        originalData,
      });

    expect(pendingChangesCount.value).toBe(0);

    // Simulate change in Alice's age
    const event1 = {
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '31' },
      colDef: { field: 'age' },
      newValue: '31',
    } as unknown as CellValueChangedEvent;

    onCellValueChanged(event1);

    expect(pendingChangesCount.value).toBe(1);
    expect(editedCells.value[0]).toEqual({
      rowId: 0,
      changedData: { age: '31' },
    });

    // Simulate change back to original age
    const event2 = {
      data: { [HASH_INDEX_ID]: 0, name: 'Alice', age: '30' },
      colDef: { field: 'age' },
      newValue: '30',
    } as unknown as CellValueChangedEvent;

    onCellValueChanged(event2);

    expect(pendingChangesCount.value).toBe(0);
  });

  it('correctly reports hasEditedRows and clearEdits', () => {
    const originalData = ref([{ [HASH_INDEX_ID]: 0, name: 'Alice' }]);
    const { editedCells, onCellValueChanged, hasEditedRows, clearEdits } =
      useCsvEditedCells({
        originalData,
      });

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
});
