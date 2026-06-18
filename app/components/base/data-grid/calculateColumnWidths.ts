import type { Column } from 'ag-grid-community';
import {
  DEFAULT_COLUMN_GAP_WIDTH,
  DEFAULT_COLUMN_MAX_WIDTH,
  DEFAULT_COLUMN_MIN_WIDTH,
} from './constants';
import { cellValueFormatter, type RowData } from './cellValueFormatter';

const canvas: HTMLCanvasElement = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

export function measureTextWidth(text: string, font: string): number {
  ctx.font = font;
  return Math.round(ctx.measureText(text).width);
}

function estimateCellContentWidth(field: string, rows: RowData[]): number {
  const formattedValues = rows.map(row => cellValueFormatter(row[field]));
  const longestValue = formattedValues.reduce((a, b) => a.length >= b.length ? a : b);
  return measureTextWidth(longestValue, '500 12px system-ui');
}

export function estimateColumnWidth({
  rows,
  headerName,
  field,
  maxWidth = DEFAULT_COLUMN_MAX_WIDTH,
  minWidth = DEFAULT_COLUMN_MIN_WIDTH,
  gapWidth = DEFAULT_COLUMN_GAP_WIDTH,
}: {
  rows: RowData[];
  headerName: string;
  field: string;
  maxWidth?: number;
  minWidth?: number;
  gapWidth?: number;
}): number {
  const headerWidth = measureTextWidth(headerName, '700 14px system-ui');
  const contentWidth = rows.length ? estimateCellContentWidth(field, rows) : 0;
  const finalWidth = Math.max(headerWidth, contentWidth) + gapWidth;
  return Math.min(maxWidth, Math.max(minWidth, finalWidth));
}

export function estimateAllColumnWidths({
  rows,
  columns,
  maxWidth = DEFAULT_COLUMN_MAX_WIDTH,
  minWidth = DEFAULT_COLUMN_MIN_WIDTH,
  gapWidth = DEFAULT_COLUMN_GAP_WIDTH,
}: {
  rows: RowData[];
  columns: Column[];
  maxWidth?: number;
  minWidth?: number;
  gapWidth?: number;
}): Record<string, number> {
  const widths: Record<string, number> = {};
  columns.forEach((column: Column) => {
    const { headerName = '', field } = column.getColDef();
    if (!field) return;
    widths[field] = estimateColumnWidth({ rows, headerName, field, maxWidth, minWidth, gapWidth });
  });
  return widths;
}
