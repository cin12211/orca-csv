import { describe, expect, it, vi } from 'vitest';
import { useCsvFilter } from '~/components/modules/csv-editor/hooks/useCsvFilter';
import { CsvFilterOperator, CsvFilterCompose } from '~/components/modules/csv-editor/constants/csv-filter.constants';
import type { CsvFilterRow } from '~/components/modules/csv-editor/types/csv-filter.types';

describe('useCsvFilter', () => {
  it('clears filter when no active filters', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    applyFilterToGrid(gridApi, [], CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith(null);
  });

  it('clears filter when all filters are inactive', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.CONTAINS, value: 'test', isActive: false },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith(null);
  });

  it('applies single active filter', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.CONTAINS, value: 'Alice', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith({
      name: { filterType: 'text', type: 'contains', filter: 'Alice' },
    });
  });

  it('applies equals filter', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.EQUALS, value: 'Alice', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith({
      name: { filterType: 'text', type: 'equals', filter: 'Alice' },
    });
  });

  it('applies not-equals filter', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.NOT_EQUALS, value: 'Bob', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith({
      name: { filterType: 'text', type: 'notEqual', filter: 'Bob' },
    });
  });

  it('applies blank/is-empty filter', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.IS_EMPTY, isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith({
      name: { filterType: 'text', type: 'blank' },
    });
  });

  it('applies not-blank filter', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.IS_NOT_EMPTY, isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    expect(setFilterModel).toHaveBeenCalledWith({
      name: { filterType: 'text', type: 'notBlank' },
    });
  });

  it('combines two filters on same column with AND by default', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.STARTS_WITH, value: 'A', isActive: true },
      { column: 'name', operator: CsvFilterOperator.ENDS_WITH, value: 'e', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    const call = setFilterModel.mock.calls[0][0] as any;
    expect(call.name.filterType).toBe('text');
    expect(call.name.operator).toBe('and');
    // condition1 = the first added filter (with filterType from previous aggregation)
    expect(call.name.condition1).toEqual({ filterType: 'text', type: 'startsWith', filter: 'A' });
    // condition2 = the new agGridFilter (no filterType wrapper)
    expect(call.name.condition2).toEqual({ type: 'endsWith', filter: 'e' });
  });

  it('combines two filters on same column with OR', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.EQUALS, value: 'Alice', isActive: true },
      { column: 'name', operator: CsvFilterOperator.EQUALS, value: 'Bob', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.OR);

    const call = setFilterModel.mock.calls[0][0] as any;
    expect(call.name.operator).toBe('or');
  });

  it('filters on different columns independently', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.CONTAINS, value: 'A', isActive: true },
      { column: 'age', operator: CsvFilterOperator.GREATER_THAN, value: '20', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    const call = setFilterModel.mock.calls[0][0] as any;
    expect(call.name).toEqual({ filterType: 'text', type: 'contains', filter: 'A' });
    expect(call.age).toEqual({ filterType: 'text', type: 'greaterThan', filter: '20' });
  });

  it('handles null gridApi gracefully', () => {
    const { applyFilterToGrid } = useCsvFilter();

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.CONTAINS, value: 'A', isActive: true },
    ];

    expect(() => applyFilterToGrid(null, filters, CsvFilterCompose.AND)).not.toThrow();
  });

  it('skips inactive filters', () => {
    const { applyFilterToGrid } = useCsvFilter();
    const setFilterModel = vi.fn();
    const gridApi = { setFilterModel };

    const filters: CsvFilterRow[] = [
      { column: 'name', operator: CsvFilterOperator.CONTAINS, value: 'A', isActive: true },
      { column: 'age', operator: CsvFilterOperator.GREATER_THAN, value: '20', isActive: false },
      { column: 'city', operator: CsvFilterOperator.EQUALS, value: 'NY', isActive: true },
    ];

    applyFilterToGrid(gridApi, filters, CsvFilterCompose.AND);

    const call = setFilterModel.mock.calls[0][0] as any;
    expect(Object.keys(call)).toHaveLength(2);
    expect(call.name).toBeDefined();
    expect(call.city).toBeDefined();
    expect(call.age).toBeUndefined();
  });
});
