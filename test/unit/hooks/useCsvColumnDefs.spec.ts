import { ref } from 'vue';
import type { ColDef } from 'ag-grid-community';
import { describe, expect, it } from 'vitest';
import { useCsvColumnDefs } from '~/components/modules/csv-editor/hooks/useCsvColumnDefs';
import { HASH_INDEX_ID, HASH_INDEX_HEADER, DEFAULT_HASH_INDEX_WIDTH } from '~/components/base/data-grid/constants';

describe('useCsvColumnDefs', () => {
  it('generates column defs with HashIndex column first', () => {
    const headers = ref(['name', 'age', 'city']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const defs = columnDefs.value;
    expect(defs).toHaveLength(4);

    // First column is the index column
    expect(defs[0].colId).toBe(HASH_INDEX_ID);
    expect(defs[0].headerName).toBe(HASH_INDEX_HEADER);
    expect(defs[0].field).toBe(HASH_INDEX_ID);
    expect(defs[0].editable).toBe(false);
    expect(defs[0].pinned).toBe('left');
    expect(defs[0].width).toBe(DEFAULT_HASH_INDEX_WIDTH);
  });

  it('creates editable columns for each header', () => {
    const headers = ref(['name', 'age']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const defs = columnDefs.value;
    expect(defs[1].headerName).toBe('name');
    expect(defs[1].field).toBe('name');
    expect(defs[1].editable).toBe(true);
    expect(defs[1].resizable).toBe(true);
    expect(defs[1].sortable).toBe(true);
    expect(defs[1].cellEditor).toBe('agTextCellEditor');
    expect(defs[1].filter).toBe('agTextColumnFilter');
  });

  it('returns empty columns when headers are empty', () => {
    const headers = ref<string[]>([]);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const defs = columnDefs.value;
    // Should have exactly 1 column (the hashIndex column)
    expect(defs).toHaveLength(1);
    expect(defs[0].colId).toBe(HASH_INDEX_ID);
  });

  it('valueFormatter returns empty string for null/undefined', () => {
    const headers = ref(['val']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const formatter = columnDefs.value[1].valueFormatter as (params: any) => string;

    expect(formatter({ value: null })).toBe('');
    expect(formatter({ value: undefined })).toBe('');
    expect(formatter({ value: 'hello' })).toBe('hello');
    expect(formatter({ value: 42 })).toBe('42');
  });

  it('valueSetter updates row data', () => {
    const headers = ref(['name']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const setter = columnDefs.value[1].valueSetter as (params: any) => boolean;
    const row = { name: 'Alice' };

    expect(setter({ newValue: 'Bob', data: row, colDef: {} as ColDef })).toBe(true);
    expect(row.name).toBe('Bob');
  });

  it('valueSetter handles null data', () => {
    const headers = ref(['name']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    const setter = columnDefs.value[1].valueSetter as (params: any) => boolean;
    expect(setter({ newValue: 'Bob', data: null, colDef: {} as ColDef })).toBe(false);
  });

  it('reacts to header changes', () => {
    const headers = ref(['name']);
    const { columnDefs } = useCsvColumnDefs({ headers });

    expect(columnDefs.value).toHaveLength(2);

    headers.value = ['name', 'age', 'city'];
    expect(columnDefs.value).toHaveLength(4);

    headers.value = [];
    expect(columnDefs.value).toHaveLength(1);
  });
});
