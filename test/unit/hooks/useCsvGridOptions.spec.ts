import { ref } from 'vue';
import type { CellValueChangedEvent } from 'ag-grid-community';
import { describe, expect, it, vi } from 'vitest';
import { useCsvGridOptions } from '~/components/modules/csv-editor/hooks/useCsvGridOptions';
import { HASH_INDEX_ID } from '~/components/base/data-grid/constants';
import type { CsvEditedCell } from '~/components/modules/csv-editor/types';

describe('useCsvGridOptions', () => {
  const makeEvent = (data: Record<string, any>): CellValueChangedEvent =>
    ({ data } as unknown as CellValueChangedEvent);

  it('configures editing behaviour', () => {
    const editedCells = ref<CsvEditedCell[]>([]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    expect(gridOptions.value.singleClickEdit).toBe(false);
    expect(gridOptions.value.stopEditingWhenCellsLoseFocus).toBe(true);
    expect(gridOptions.value.undoRedoCellEditing).toBe(true);
    expect(gridOptions.value.undoRedoCellEditingLimit).toBe(50);
    expect(gridOptions.value.enableCellTextSelection).toBe(true);
    expect(gridOptions.value.animateRows).toBe(false);
  });

  it('configures multi-row selection', () => {
    const editedCells = ref<CsvEditedCell[]>([]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const selection = gridOptions.value.rowSelection!;
    expect(selection).toEqual({
      mode: 'multiRow',
      checkboxes: false,
      headerCheckbox: false,
    });
    expect(gridOptions.value.suppressRowClickSelection).toBe(true);
  });

  it('styles new rows with green background', () => {
    const editedCells = ref<CsvEditedCell[]>([
      { rowId: 0, changedData: {}, isNewRow: true },
    ]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const style = gridOptions.value.getRowStyle!({ data: { [HASH_INDEX_ID]: 0 } } as any);
    expect(style).toEqual({ backgroundColor: 'rgba(212, 244, 221, 0.4)' });
  });

  it('styles edited rows with orange background', () => {
    const editedCells = ref<CsvEditedCell[]>([
      { rowId: 0, changedData: { name: 'Bob' } },
    ]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const style = gridOptions.value.getRowStyle!({ data: { [HASH_INDEX_ID]: 0 } } as any);
    expect(style).toEqual({ backgroundColor: 'rgba(255, 243, 205, 0.4)' });
  });

  it('returns undefined style for unedited rows', () => {
    const editedCells = ref<CsvEditedCell[]>([]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const style = gridOptions.value.getRowStyle!({ data: { [HASH_INDEX_ID]: 0 } } as any);
    expect(style).toBeUndefined();
  });

  it('returns undefined style when data is missing', () => {
    const editedCells = ref<CsvEditedCell[]>([
      { rowId: 0, changedData: { name: 'Bob' } },
    ]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const style = gridOptions.value.getRowStyle!({ data: undefined } as any);
    expect(style).toBeUndefined();
  });

  it('returns undefined style when rowId is missing', () => {
    const editedCells = ref<CsvEditedCell[]>([
      { rowId: 0, changedData: { name: 'Bob' } },
    ]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const style = gridOptions.value.getRowStyle!({ data: { name: 'Alice' } } as any);
    expect(style).toBeUndefined();
  });

  it('calls onCellValueChanged callback', () => {
    const editedCells = ref<CsvEditedCell[]>([]);
    const onCellValueChanged = vi.fn();

    const { gridOptions } = useCsvGridOptions({ editedCells, onCellValueChanged });

    const event = makeEvent({ [HASH_INDEX_ID]: 0 });
    gridOptions.value.onCellValueChanged!(event);
    expect(onCellValueChanged).toHaveBeenCalledWith(event);
  });
});
