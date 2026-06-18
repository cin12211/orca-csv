import type { CsvFilterOperator, CsvFilterCompose } from '../constants/csv-filter.constants';

export interface CsvFilterRow {
  column: string;
  operator: CsvFilterOperator;
  value?: string;
  isActive: boolean;
}

export interface CsvFilterState {
  filters: CsvFilterRow[];
  compose: CsvFilterCompose;
}
