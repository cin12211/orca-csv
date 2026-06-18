export interface RowData {
  [key: string]: unknown;
}

export const cellValueFormatter = (content: unknown): string => {
  if (content === null) return 'NULL';
  if (typeof content === 'object' && content !== null) {
    return JSON.stringify(content, null, 2);
  }
  return String(content ?? '');
};
