# CSV Editor - API Specification

**Version:** 1.0  
**Date:** 2026-06-15

## Overview

This document specifies the APIs for the CSV editor's file system abstraction layer, supporting both Electron and Web platforms.

## Core Interfaces

### CsvFileSystemAPI

Platform-agnostic interface for file operations.

```typescript
interface CsvFileSystemAPI {
  /**
   * Open file picker dialog to select CSV files
   * @returns Array of file handles (empty if user cancels)
   * @throws Error if file picker not supported (Electron)
   */
  openFiles(): Promise<CsvFileHandle[]>;

  /**
   * Read file contents as string
   * @param handle File handle to read
   * @returns File content as UTF-8 string
   * @throws Error if file not found, permission denied, or read fails
   */
  readFile(handle: CsvFileHandle): Promise<string>;

  /**
   * Write content to file
   * @param handle File handle to write to
   * @param content CSV content as string
   * @throws Error if permission denied or write fails
   */
  writeFile(handle: CsvFileHandle, content: string): Promise<void>;

  /**
   * Watch file for external changes (optional - Electron only in v1)
   * @param handle File handle to watch
   * @param callback Function called when file changes
   * @returns Unwatch function to stop watching
   */
  watchFile?(handle: CsvFileHandle, callback: () => void): () => void;

  /**
   * Validate file handle and check if accessible
   * @param handle File handle to validate
   * @returns Validation result with error details if invalid
   */
  validateFile(handle: CsvFileHandle): Promise<FileValidation>;

  /**
   * Get file metadata (size, name, last modified)
   * @param handle File handle
   * @returns File metadata
   * @throws Error if file not accessible
   */
  getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata>;
}
```

### CsvFileHandle

Abstracted file handle supporting both platforms.

```typescript
interface CsvFileHandle {
  /** Unique identifier for this handle */
  id: string;

  /** File name (e.g., "data.csv") */
  name: string;

  /** Full file path (Electron only) */
  path?: string;

  /** File size in bytes */
  size: number;

  /** Last modified timestamp (milliseconds since epoch) */
  lastModified: number;

  /** Platform this handle belongs to */
  platform: 'electron' | 'web';

  /**
   * Internal: Full file path for Electron
   * @internal
   */
  _electronPath?: string;

  /**
   * Internal: FileSystemFileHandle for Web
   * @internal
   */
  _webHandle?: FileSystemFileHandle;
}
```

### FileValidation

Result of file validation.

```typescript
interface FileValidation {
  /** Whether file is valid and accessible */
  valid: boolean;

  /** Error message if validation failed */
  error?: string;

  /** File size in bytes (if valid) */
  size?: number;

  /** Last modified timestamp (if valid) */
  lastModified?: number;
}
```

### FileMetadata

File metadata information.

```typescript
interface FileMetadata {
  /** File name */
  name: string;

  /** File size in bytes */
  size: number;

  /** MIME type (e.g., "text/csv") */
  type: string;

  /** Last modified timestamp */
  lastModified: number;
}
```

## Platform Implementations

### ElectronCsvFileSystem

Electron-specific implementation using IPC.

```typescript
class ElectronCsvFileSystem implements CsvFileSystemAPI {
  /**
   * Not used for Electron - files accessed via drag-drop
   * @returns Empty array
   */
  async openFiles(): Promise<CsvFileHandle[]>;

  /**
   * Read file via Electron IPC
   * @param handle Must have _electronPath set
   * @throws Error if handle invalid or IPC call fails
   */
  async readFile(handle: CsvFileHandle): Promise<string>;

  /**
   * Write file via Electron IPC
   * @param handle Must have _electronPath set
   * @throws Error if handle invalid or IPC call fails
   */
  async writeFile(handle: CsvFileHandle, content: string): Promise<void>;

  /**
   * Start watching file for changes using fs.watch
   * @param handle Must have _electronPath set
   * @param callback Called on file change
   * @returns Function to stop watching
   */
  watchFile(handle: CsvFileHandle, callback: () => void): () => void;

  /**
   * Validate file via Electron IPC
   * Checks: file exists, is .csv, size < 50MB
   */
  async validateFile(handle: CsvFileHandle): Promise<FileValidation>;

  /**
   * Get file metadata from handle
   */
  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata>;
}
```

**IPC Dependencies:**

- `window.electronAPI.csv.readFile(path: string)`
- `window.electronAPI.csv.writeFile(path: string, content: string)`
- `window.electronAPI.csv.validateFile(path: string)`
- `window.electronAPI.csv.watchFile(path: string)`
- `window.electronAPI.csv.unwatchFile(path: string)`
- `window.electronAPI.csv.onFileChanged(path: string, callback)`

### WebCsvFileSystem

Web-specific implementation using File System API.

```typescript
class WebCsvFileSystem implements CsvFileSystemAPI {
  /**
   * Show file picker dialog
   * @returns Array of selected file handles
   * @throws Error if File System API not supported
   * @returns Empty array if user cancels
   */
  async openFiles(): Promise<CsvFileHandle[]>;

  /**
   * Read file via FileSystemFileHandle
   * @param handle Must have _webHandle set
   * @throws Error if handle invalid or permission denied
   */
  async readFile(handle: CsvFileHandle): Promise<string>;

  /**
   * Write file via FileSystemWritableFileStream
   * @param handle Must have _webHandle set
   * @throws Error if handle invalid or permission denied
   */
  async writeFile(handle: CsvFileHandle, content: string): Promise<void>;

  /**
   * File watching not implemented in v1
   * @returns undefined
   */
  watchFile?: undefined;

  /**
   * Validate file via FileSystemFileHandle
   * Checks: file accessible, is .csv, size < 50MB
   */
  async validateFile(handle: CsvFileHandle): Promise<FileValidation>;

  /**
   * Get file metadata from FileSystemFileHandle
   */
  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata>;
}
```

**Browser API Dependencies:**

- `window.showOpenFilePicker()`
- `FileSystemFileHandle.getFile()`
- `FileSystemFileHandle.createWritable()`
- `FileSystemWritableFileStream.write()`
- `FileSystemWritableFileStream.close()`

## Factory Function

```typescript
/**
 * Create appropriate file system implementation for current platform
 * @returns Platform-specific CsvFileSystemAPI instance
 * @throws Error if neither platform is available
 */
function createCsvFileSystem(): CsvFileSystemAPI {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  } else if (isFileSystemAPISupported()) {
    return new WebCsvFileSystem();
  } else {
    throw new Error('CSV editor not supported on this platform');
  }
}

/**
 * Check if File System API is available
 */
function isFileSystemAPISupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}
```

## Composables

### useCsvData

Handle CSV loading and parsing.

```typescript
interface UseCsvDataOptions {
  /** File handle to load */
  fileHandle: Ref<CsvFileHandle | null>;

  /** Whether first row is headers */
  hasHeaders?: Ref<boolean>;

  /** File system implementation */
  csvFileSystem: CsvFileSystemAPI;
}

interface UseCsvDataReturn {
  // State
  data: Ref<RowData[]>;
  headers: Ref<string[]>;
  isLoading: Ref<boolean>;
  parseError: Ref<string | undefined>;

  // Actions
  loadCsvData(): Promise<void>;
  refreshData(): Promise<void>;

  // Computed
  rowCount: ComputedRef<number>;
  columnCount: ComputedRef<number>;
}

/**
 * Composable for loading and managing CSV data
 */
function useCsvData(options: UseCsvDataOptions): UseCsvDataReturn;
```

**Row Data Format:**

```typescript
interface RowData {
  /** Unique row identifier for AG Grid */
  [HASH_INDEX_ID]: number;

  /** CSV column values keyed by header name */
  [columnName: string]: any;
}
```

**Example Usage:**

```typescript
const { data, headers, loadCsvData, isLoading } = useCsvData({
  fileHandle: ref(myFileHandle),
  hasHeaders: ref(true),
  csvFileSystem: createCsvFileSystem(),
});

await loadCsvData();
```

### useCsvEditedCells

Track cell edits in memory.

```typescript
interface UseCsvEditedCellsOptions {
  /** Original data for comparison */
  originalData: Ref<RowData[]>;
}

interface UseCsvEditedCellsReturn {
  // State
  editedCells: Ref<CsvEditedCell[]>;

  // Actions
  onCellValueChanged(event: CellValueChangedEvent): void;
  clearEdits(): void;
  hasEditedRows(): boolean;
  getPendingEditedRows(): CsvEditedCell[];

  // Computed
  pendingChangesCount: ComputedRef<number>;
}

interface CsvEditedCell {
  /** Row index in data array */
  rowId: number;

  /** Changed column values */
  changedData: Record<string, string>;

  /** True if this is a newly added row */
  isNewRow?: boolean;
}

/**
 * Track CSV cell edits
 */
function useCsvEditedCells(
  options: UseCsvEditedCellsOptions
): UseCsvEditedCellsReturn;
```

### useCsvMutation

Handle save operations.

```typescript
interface UseCsvMutationOptions {
  /** File handle to save to */
  fileHandle: Ref<CsvFileHandle | null>;

  /** Current data */
  data: Ref<RowData[]>;

  /** CSV headers */
  headers: Ref<string[]>;

  /** Has headers row */
  hasHeaders: Ref<boolean>;

  /** Edited cells tracker */
  editedCells: UseCsvEditedCellsReturn;

  /** File system implementation */
  csvFileSystem: CsvFileSystemAPI;

  /** Callback after successful save */
  onSaveSuccess?: () => void;
}

interface UseCsvMutationReturn {
  // State
  isSaving: Ref<boolean>;
  saveError: Ref<string | undefined>;

  // Actions
  onSaveData(): Promise<void>;
  onAddEmptyRow(): void;
  onAddRowAt(rowIndex: number, position: 'above' | 'below'): void;
  onAddColumn(columnName: string): void;
  onDeleteColumn(columnName: string): void;
  onDeleteRows(rowIds: number[]): Promise<void>;
  onDiscardChanges(): void;
}

/**
 * Handle CSV save operations
 */
function useCsvMutation(options: UseCsvMutationOptions): UseCsvMutationReturn;
```

### useCsvColumnDefs

Generate AG Grid column definitions.

```typescript
interface UseCsvColumnDefsOptions {
  /** CSV headers */
  headers: Ref<string[]>;
}

interface UseCsvColumnDefsReturn {
  /** AG Grid column definitions */
  columnDefs: ComputedRef<ColDef[]>;
}

/**
 * Generate AG Grid column definitions from CSV headers
 */
function useCsvColumnDefs(
  options: UseCsvColumnDefsOptions
): UseCsvColumnDefsReturn;
```

**Column Definition Structure:**

```typescript
{
  headerName: string       // CSV column header
  field: string           // Same as headerName
  editable: true          // All columns editable
  resizable: true         // User can resize
  sortable: true          // User can sort
  cellEditor: 'agTextCellEditor'  // Default text editor
  valueFormatter?: Function       // For display formatting
  valueSetter?: Function          // For value normalization
}
```

### useCsvGridOptions

Configure AG Grid behavior.

```typescript
interface UseCsvGridOptionsOptions {
  /** Edited cells tracker for styling */
  editedCells: Ref<CsvEditedCell[]>;

  /** Cell value change handler */
  onCellValueChanged: (event: CellValueChangedEvent) => void;
}

interface UseCsvGridOptionsReturn {
  /** AG Grid options */
  gridOptions: ComputedRef<GridOptions>;
}

/**
 * Configure AG Grid for CSV editing
 */
function useCsvGridOptions(
  options: UseCsvGridOptionsOptions
): UseCsvGridOptionsReturn;
```

**Grid Options:**

```typescript
{
  // Data
  rowData: data.value,
  columnDefs: columnDefs.value,

  // Editing
  editable: true,
  singleClickEdit: false,
  stopEditingWhenCellsLoseFocus: true,
  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 50,

  // Selection
  rowSelection: 'multiple',
  suppressRowClickSelection: true,

  // Styling
  getRowStyle: (params) => {
    if (isNewRow(params.node.rowIndex)) {
      return { backgroundColor: '#d4f4dd' } // Green for new
    }
    if (hasEdits(params.node.rowIndex)) {
      return { backgroundColor: '#fff3cd' } // Orange for edited
    }
  },

  // Events
  onCellValueChanged: options.onCellValueChanged,

  // Performance
  animateRows: false,
  enableCellTextSelection: true,
}
```

## CSV Utilities

### csvParser

Wrapper around fast-csv for parsing.

```typescript
interface CsvParseOptions {
  /** First row contains headers */
  headers?: boolean;

  /** CSV delimiter character */
  delimiter?: string;

  /** Skip empty lines */
  skipEmptyLines?: boolean;

  /** Trim whitespace */
  trim?: boolean;
}

interface CsvParseResult {
  /** Parsed rows as objects */
  rows: Record<string, string>[];

  /** Column headers */
  headers: string[];
}

/**
 * Parse CSV string to objects
 * @param content CSV file content
 * @param options Parse options
 * @returns Parsed rows and headers
 * @throws Error if parsing fails
 */
async function parseCsv(
  content: string,
  options?: CsvParseOptions
): Promise<CsvParseResult>;
```

### csvFormatter

Wrapper around fast-csv for formatting.

```typescript
interface CsvFormatOptions {
  /** Include headers row */
  includeHeaders?: boolean;

  /** Column headers */
  headers?: string[];

  /** CSV delimiter */
  delimiter?: string;

  /** Quote character */
  quote?: string;
}

/**
 * Format objects to CSV string
 * @param rows Data rows
 * @param options Format options
 * @returns CSV formatted string
 * @throws Error if formatting fails
 */
async function formatCsv(
  rows: Record<string, any>[],
  options?: CsvFormatOptions
): Promise<string>;
```

## Drag-Drop API

### createCsvFileHandleFromDrop (Electron)

```typescript
/**
 * Create file handle from Electron drag-drop event
 * @param file File from DataTransfer
 * @returns File handle or null if invalid
 */
async function createCsvFileHandleFromDrop(
  file: File & { path: string }
): Promise<CsvFileHandle | null> {
  const path = file.path;

  // Validate via IPC
  const validation = await window.electronAPI!.csv.validateFile(path);

  if (!validation.valid) {
    return null;
  }

  return {
    id: `electron-${path}`,
    name: file.name,
    path,
    size: validation.size!,
    lastModified: validation.lastModified!,
    platform: 'electron',
    _electronPath: path,
  };
}
```

### createCsvFileHandleFromDrop (Web)

```typescript
/**
 * Create file handle from Web drag-drop event
 * @param item DataTransferItem from drop event
 * @returns File handle or null if invalid
 */
async function createCsvFileHandleFromDrop(
  item: DataTransferItem
): Promise<CsvFileHandle | null> {
  const handle = await item.getAsFileSystemHandle();

  if (!handle || handle.kind !== 'file') {
    return null;
  }

  const fileHandle = handle as FileSystemFileHandle;
  const file = await fileHandle.getFile();

  // Validate
  if (!file.name.endsWith('.csv')) {
    return null;
  }

  if (file.size > 50 * 1024 * 1024) {
    return null;
  }

  return {
    id: `web-${file.name}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    platform: 'web',
    _webHandle: fileHandle,
  };
}
```

## Tab Management API

### openCsvEditorTab

```typescript
interface OpenCsvEditorTabParams {
  /** File handle */
  fileHandle: CsvFileHandle;

  /** Whether first row is headers */
  hasHeaders?: boolean;
}

/**
 * Open CSV editor tab
 * @param params Tab parameters
 * @returns Promise that resolves when tab is created
 */
async function openCsvEditorTab(params: OpenCsvEditorTabParams): Promise<void> {
  const { fileHandle, hasHeaders = true } = params;

  // Generate stable tab ID from file path/handle
  const tabId = `csv-${hashString(fileHandle.id)}`;

  await openTab({
    id: tabId,
    name: fileHandle.name,
    icon: 'hugeicons:file-02',
    type: TabViewType.CSVEditor,
    routeName: 'workspaceId-csv-tabViewId',
    routeParams: { tabViewId: tabId },
    metadata: {
      type: TabViewType.CSVEditor,
      fileHandle,
      fileName: fileHandle.name,
      hasHeaders,
      fileSize: fileHandle.size,
      lastModified: fileHandle.lastModified,
    },
  });
}
```

## Error Types

### CsvFileSystemError

```typescript
class CsvFileSystemError extends Error {
  constructor(
    message: string,
    public code: CsvErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CsvFileSystemError';
  }
}

enum CsvErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PARSE_ERROR = 'PARSE_ERROR',
  WRITE_ERROR = 'WRITE_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
}
```

## Constants

```typescript
/** Maximum file size (50MB) */
export const MAX_CSV_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum concurrent open CSV tabs */
export const MAX_CSV_TABS = 10;

/** AG Grid row ID field */
export const HASH_INDEX_ID = '_____#';

/** Supported file extensions */
export const CSV_EXTENSIONS = ['.csv'];

/** MIME types */
export const CSV_MIME_TYPES = ['text/csv', 'application/csv'];
```

## Browser Compatibility

### Feature Detection

```typescript
/**
 * Check if File System API is supported
 */
function isFileSystemAPISupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'FileSystemFileHandle' in window
  );
}

/**
 * Check if FileSystemObserver is supported (file watching)
 */
function isFileSystemObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'FileSystemObserver' in window;
}
```

### Graceful Degradation

```typescript
/**
 * Get file system implementation with fallback
 */
function getCsvFileSystemOrFallback(): CsvFileSystemAPI | null {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  }

  if (isFileSystemAPISupported()) {
    return new WebCsvFileSystem();
  }

  // No support - show upgrade message
  return null;
}
```

## Security

### Input Validation

```typescript
/**
 * Validate CSV file before processing
 */
async function validateCsvFile(
  handle: CsvFileHandle
): Promise<ValidationResult> {
  // Check extension
  if (!CSV_EXTENSIONS.some(ext => handle.name.endsWith(ext))) {
    return {
      valid: false,
      error: 'File must be a CSV file (.csv)',
    };
  }

  // Check size
  if (handle.size > MAX_CSV_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (max ${MAX_CSV_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Platform-specific validation
  const csvFileSystem = createCsvFileSystem();
  return await csvFileSystem.validateFile(handle);
}
```

### CSV Injection Prevention

```typescript
/**
 * Sanitize CSV cell values to prevent formula injection
 */
function sanitizeCsvCell(value: string): string {
  // Escape formula prefixes
  if (
    value.startsWith('=') ||
    value.startsWith('+') ||
    value.startsWith('-') ||
    value.startsWith('@')
  ) {
    return `'${value}`;
  }

  return value;
}
```

## Performance

### Large File Handling

```typescript
/**
 * Check if file requires special handling
 */
function requiresLargeFileHandling(fileSize: number): boolean {
  return fileSize > 10 * 1024 * 1024; // 10MB
}

/**
 * Show warning for large files
 */
function shouldWarnLargeFile(fileSize: number): boolean {
  return fileSize > 10 * 1024 * 1024 && fileSize <= MAX_CSV_FILE_SIZE;
}
```

## Type Exports

```typescript
// Core types
export type {
  CsvFileSystemAPI,
  CsvFileHandle,
  FileValidation,
  FileMetadata,
}

// Composables
export type {
  UseCsvDataOptions,
  UseCsvDataReturn,
  UseCsvEditedCellsOptions,
  UseCsvEditedCellsReturn,
  CsvEditedCell,
  UseCsvMutationOptions,
  UseCsvMutationReturn,
  UseCsvColumnDefsOptions,
  UseCsvColumnDefsReturn,
  UseCsvGridOptionsOptions,
  UseCsvGridOptionsReturn,
}

// Utilities
export type {
  CsvParseOptions,
  CsvParseResult,
  CsvFormatOptions,
}

// Errors
export {
  CsvFileSystemError,
  CsvErrorCode,
}

// Constants
export {
  MAX_CSV_FILE_SIZE,
  MAX_CSV_TABS,
  HASH_INDEX_ID,
  CSV_EXTENSIONS,
  CSV_MIME_TYPES,
}
```
