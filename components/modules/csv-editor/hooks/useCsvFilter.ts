import { ref } from 'vue';
import {
  CsvFilterOperator,
  CsvFilterCompose,
} from '../constants/csv-filter.constants';
import type { CsvFilterRow } from '../types/csv-filter.types';

export function useCsvFilter() {
  const applyFilterToGrid = (
    gridApi: any,
    filters: CsvFilterRow[],
    compose: CsvFilterCompose
  ) => {
    if (!gridApi) return;

    const activeFilters = filters.filter(f => f.isActive);

    if (activeFilters.length === 0) {
      gridApi.setFilterModel(null);
      return;
    }

    const filterModel: Record<string, any> = {};

    activeFilters.forEach(filter => {
      const { column, operator, value } = filter;

      let agGridFilter: any = {};

      switch (operator) {
        case CsvFilterOperator.EQUALS:
          agGridFilter = { type: 'equals', filter: value };
          break;
        case CsvFilterOperator.NOT_EQUALS:
          agGridFilter = { type: 'notEqual', filter: value };
          break;
        case CsvFilterOperator.CONTAINS:
          agGridFilter = { type: 'contains', filter: value };
          break;
        case CsvFilterOperator.NOT_CONTAINS:
          agGridFilter = { type: 'notContains', filter: value };
          break;
        case CsvFilterOperator.STARTS_WITH:
          agGridFilter = { type: 'startsWith', filter: value };
          break;
        case CsvFilterOperator.ENDS_WITH:
          agGridFilter = { type: 'endsWith', filter: value };
          break;
        case CsvFilterOperator.GREATER_THAN:
          agGridFilter = { type: 'greaterThan', filter: value };
          break;
        case CsvFilterOperator.LESS_THAN:
          agGridFilter = { type: 'lessThan', filter: value };
          break;
        case CsvFilterOperator.GREATER_THAN_OR_EQUAL:
          agGridFilter = { type: 'greaterThanOrEqual', filter: value };
          break;
        case CsvFilterOperator.LESS_THAN_OR_EQUAL:
          agGridFilter = { type: 'lessThanOrEqual', filter: value };
          break;
        case CsvFilterOperator.IS_EMPTY:
          agGridFilter = { type: 'blank' };
          break;
        case CsvFilterOperator.IS_NOT_EMPTY:
          agGridFilter = { type: 'notBlank' };
          break;
      }

      if (filterModel[column]) {
        // Multiple filters on same column - combine with AND/OR
        const existing = filterModel[column];
        filterModel[column] = {
          filterType: 'text',
          operator: compose.toLowerCase(),
          condition1: existing,
          condition2: agGridFilter,
        };
      } else {
        filterModel[column] = {
          filterType: 'text',
          ...agGridFilter,
        };
      }
    });

    gridApi.setFilterModel(filterModel);
  };

  return {
    applyFilterToGrid,
  };
}
