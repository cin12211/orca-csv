/**
 * CSV Filter operators - simplified compared to SQL operators
 */
export enum CsvFilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
}

export const CSV_FILTER_OPERATOR_LABELS: Record<CsvFilterOperator, string> = {
  [CsvFilterOperator.EQUALS]: 'Equals',
  [CsvFilterOperator.NOT_EQUALS]: 'Not equals',
  [CsvFilterOperator.CONTAINS]: 'Contains',
  [CsvFilterOperator.NOT_CONTAINS]: 'Not contains',
  [CsvFilterOperator.STARTS_WITH]: 'Starts with',
  [CsvFilterOperator.ENDS_WITH]: 'Ends with',
  [CsvFilterOperator.GREATER_THAN]: 'Greater than',
  [CsvFilterOperator.LESS_THAN]: 'Less than',
  [CsvFilterOperator.GREATER_THAN_OR_EQUAL]: 'Greater than or equal',
  [CsvFilterOperator.LESS_THAN_OR_EQUAL]: 'Less than or equal',
  [CsvFilterOperator.IS_EMPTY]: 'Is empty',
  [CsvFilterOperator.IS_NOT_EMPTY]: 'Is not empty',
};

export const CSV_FILTER_OPERATORS_NO_VALUE = [
  CsvFilterOperator.IS_EMPTY,
  CsvFilterOperator.IS_NOT_EMPTY,
];

export enum CsvFilterCompose {
  AND = 'AND',
  OR = 'OR',
}
