# CSV Editor - Technical Architecture

**Version:** 1.0  
**Date:** 2026-06-15

## Overview

This document describes the technical architecture for the dual-platform CSV editor supporting both Electron (desktop) and Web (browser) environments through a unified abstraction layer.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  (CsvEditor.vue, CsvEditorTable, CsvEditorControlBar)       │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  (useCsvData, useCsvEditedCells, useCsvMutation)            │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│              File System Abstraction Layer                   │
│         CsvFileSystemAPI (Platform-Agnostic Interface)       │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────────────────┐           ┌──────────────────────┐
│  Electron Platform  │           │    Web Platform      │
│ (IPC → Node.js fs)  │           │ (File System API)    │
└─────────────────────┘           └──────────────────────┘
```

## Layer Breakdown

### 1. User Interface Layer

**Components:**

- `CsvEditor.vue` - Main orchestrator component
- `CsvEditorTable.vue` - AG Grid wrapper
- `CsvEditorControlBar.vue` - Toolbar with actions
- `CsvEditorContextMenu.vue` - Right-click menu
- `CsvDropOverlay.vue` - Drag-drop visual feedback

**Responsibilities:**

- Render UI components
- Handle user interactions
- Display data in AG Grid
- Show loading/error states
- Route actions to business logic layer

**Key Dependencies:**

- `BaseDataGrid` from Quick Query
- AG Grid for table rendering
- Vue 3 Composition API

### 2. Business Logic Layer

**Composables:**

#### `useCsvData.ts`

```typescript
interface UseCsvData {
  // State
  data: Ref<RowData[]>;
  headers: Ref<string[]>;
  isLoading: Ref<boolean>;
  parseError: Ref<string | undefined>;
  fileHandle: Ref<CsvFileHandle | null>;

  // Actions
  loadCsvData(handle: CsvFileHandle): Promise<void>;
  refreshData(): Promise<void>;

  // Computed
  rowCount: ComputedRef<number>;
  columnCount: ComputedRef<number>;
}
```

**Responsibilities:**

- Call file system abstraction to read file
- Parse CSV using fast-csv
- Transform to AG Grid row format
- Cache parsed data
- Handle parsing errors

#### `useCsvEditedCells.ts`

```typescript
interface UseCsvEditedCells {
  // State
  editedCells: Ref<CsvEditedCell[]>;

  // Actions
  onCellValueChanged(event: CellValueChangedEvent): void;
  clearEdits(): void;
  hasEditedRows(): boolean;

  // Computed
  pendingChangesCount: ComputedRef<number>;
}

interface CsvEditedCell {
  rowId: number;
  changedData: Record<string, string>;
  isNewRow?: boolean;
}
```

**Responsibilities:**

- Track cell edits in memory
- Detect when cells revert to original
- Normalize cell values
- Provide pending changes count

#### `useCsvMutation.ts`

```typescript
interface UseCsvMutation {
  // State
  isSaving: Ref<boolean>;
  saveError: Ref<string | undefined>;

  // Actions
  onSaveData(): Promise<void>;
  onAddEmptyRow(): void;
  onAddRowAt(rowIndex: number, position: 'above' | 'below'): void;
  onAddColumn(columnName: string): void;
  onDeleteColumn(columnName: string): void;
  onDeleteRows(rowIds: number[]): void;
  onDiscardChanges(): void;
}
```

**Responsibilities:**

- Apply edits to data
- Format CSV using fast-csv
- Call file system abstraction to write
- Handle save errors
- Clear edits on success

#### `useCsvColumnDefs.ts`

```typescript
interface UseCsvColumnDefs {
  columnDefs: ComputedRef<ColDef[]>;
  updateColumnDefs(headers: string[]): void;
}
```

**Responsibilities:**

- Generate AG Grid column definitions
- Configure editable columns
- Set up cell editors
- Handle JSON columns

#### `useCsvGridOptions.ts`

```typescript
interface UseCsvGridOptions {
  gridOptions: ComputedRef<GridOptions>;
}
```

**Responsibilities:**

- Configure AG Grid behavior
- Set up cell styling (edited cells)
- Enable undo/redo
- Configure pagination

### 3. File System Abstraction Layer

**Core Interface:**

```typescript
interface CsvFileSystemAPI {
  // File access
  openFiles(): Promise<CsvFileHandle[]>;

  // File operations
  readFile(handle: CsvFileHandle): Promise<string>;
  writeFile(handle: CsvFileHandle, content: string): Promise<void>;

  // File watching (optional - Electron only v1)
  watchFile?(handle: CsvFileHandle, callback: () => void): () => void;

  // Validation
  validateFile(handle: CsvFileHandle): Promise<FileValidation>;

  // Metadata
  getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata>;
}

interface CsvFileHandle {
  id: string;
  name: string;
  path?: string; // Electron only
  size: number;
  lastModified: number;
  platform: 'electron' | 'web';

  // Platform-specific internals
  _electronPath?: string;
  _webHandle?: FileSystemFileHandle;
}

interface FileValidation {
  valid: boolean;
  error?: string;
  size?: number;
  lastModified?: number;
}

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
```

**Factory Function:**

```typescript
// core/services/csv/index.ts
export function createCsvFileSystem(): CsvFileSystemAPI {
  if (isElectron()) {
    return new ElectronCsvFileSystem();
  } else {
    return new WebCsvFileSystem();
  }
}
```

### 4. Platform Implementation Layer

#### Electron Implementation

**File:** `core/services/csv/ElectronCsvFileSystem.ts`

```typescript
export class ElectronCsvFileSystem implements CsvFileSystemAPI {
  async openFiles(): Promise<CsvFileHandle[]> {
    // Not used - Electron uses drag-drop with file paths
    return [];
  }

  async readFile(handle: CsvFileHandle): Promise<string> {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }

    const result = await window.electronAPI!.csv.readFile(handle._electronPath);

    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }

    return result.content!;
  }

  async writeFile(handle: CsvFileHandle, content: string): Promise<void> {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }

    const result = await window.electronAPI!.csv.writeFile(
      handle._electronPath,
      content
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  watchFile(handle: CsvFileHandle, callback: () => void): () => void {
    if (!handle._electronPath) {
      throw new Error('Invalid Electron file handle');
    }

    window.electronAPI!.csv.watchFile(handle._electronPath);

    const unwatch = window.electronAPI!.csv.onFileChanged(
      handle._electronPath,
      eventType => {
        if (eventType === 'change') {
          callback();
        }
      }
    );

    return () => {
      window.electronAPI!.csv.unwatchFile(handle._electronPath!);
      unwatch();
    };
  }

  async validateFile(handle: CsvFileHandle): Promise<FileValidation> {
    if (!handle._electronPath) {
      return { valid: false, error: 'Invalid file handle' };
    }

    return await window.electronAPI!.csv.validateFile(handle._electronPath);
  }

  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata> {
    return {
      name: handle.name,
      size: handle.size,
      type: 'text/csv',
      lastModified: handle.lastModified,
    };
  }
}
```

#### Web Implementation

**File:** `core/services/csv/WebCsvFileSystem.ts`

```typescript
export class WebCsvFileSystem implements CsvFileSystemAPI {
  async openFiles(): Promise<CsvFileHandle[]> {
    try {
      const handles = await window.showOpenFilePicker({
        types: [
          {
            description: 'CSV Files',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
        multiple: true,
      });

      return await Promise.all(
        handles.map(async handle => {
          const file = await handle.getFile();
          return this.createHandleFromWebHandle(handle, file);
        })
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []; // User cancelled
      }
      throw error;
    }
  }

  async readFile(handle: CsvFileHandle): Promise<string> {
    if (!handle._webHandle) {
      throw new Error('Invalid Web file handle');
    }

    const file = await handle._webHandle.getFile();
    return await file.text();
  }

  async writeFile(handle: CsvFileHandle, content: string): Promise<void> {
    if (!handle._webHandle) {
      throw new Error('Invalid Web file handle');
    }

    const writable = await handle._webHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async validateFile(handle: CsvFileHandle): Promise<FileValidation> {
    if (!handle._webHandle) {
      return { valid: false, error: 'Invalid file handle' };
    }

    try {
      const file = await handle._webHandle.getFile();

      if (!file.name.endsWith('.csv')) {
        return { valid: false, error: 'File is not a CSV file' };
      }

      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: 'File is too large (max 50MB)' };
      }

      return {
        valid: true,
        size: file.size,
        lastModified: file.lastModified,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFileMetadata(handle: CsvFileHandle): Promise<FileMetadata> {
    if (!handle._webHandle) {
      throw new Error('Invalid Web file handle');
    }

    const file = await handle._webHandle.getFile();

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  private createHandleFromWebHandle(
    webHandle: FileSystemFileHandle,
    file: File
  ): CsvFileHandle {
    return {
      id: `web-${file.name}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      platform: 'web',
      _webHandle: webHandle,
    };
  }
}
```

## Drag-Drop Flow

### Electron Platform

```
1. User drags CSV file over app window
   ↓
2. Drop zone detects dragenter event
   ↓
3. Extract file path from event.dataTransfer.files[0].path
   ↓
4. Call window.electronAPI.csv.validateFile(path)
   ↓
5. If valid, create CsvFileHandle with _electronPath
   ↓
6. Call openCsvEditorTab(handle)
   ↓
7. Tab opens, CsvEditor mounts
   ↓
8. useCsvData calls csvFileSystem.readFile(handle)
   ↓
9. ElectronCsvFileSystem calls IPC readFile
   ↓
10. Parse CSV and populate grid
```

### Web Platform

```
1. User drags CSV file over app window
   ↓
2. Drop zone detects drop event
   ↓
3. Call event.dataTransfer.items[0].getAsFileSystemHandle()
   ↓
4. Get FileSystemFileHandle
   ↓
5. Validate via handle.getFile() and check name/size
   ↓
6. Create CsvFileHandle with _webHandle
   ↓
7. Call openCsvEditorTab(handle)
   ↓
8. Tab opens, CsvEditor mounts
   ↓
9. useCsvData calls csvFileSystem.readFile(handle)
   ↓
10. WebCsvFileSystem calls handle.getFile().text()
   ↓
11. Parse CSV and populate grid
```

## Tab Persistence

### Electron

**Storage:**

```typescript
{
  id: 'csv-abc123',
  type: TabViewType.CSVEditor,
  metadata: {
    filePath: '/Users/cinny/Documents/data.csv',
    fileName: 'data.csv',
    hasHeaders: true,
    fileSize: 1024000,
    lastModified: 1718448000000
  }
}
```

**Restoration:**

1. Tab loads from IndexedDB
2. Recreate CsvFileHandle from filePath
3. Validate file still exists
4. If exists: Load data
5. If not: Show "File not found" error

### Web

**Storage:**

```typescript
{
  id: 'csv-xyz789',
  type: TabViewType.CSVEditor,
  metadata: {
    webHandleSerialized: <IndexedDB serialized FileSystemFileHandle>,
    fileName: 'data.csv',
    hasHeaders: true,
    fileSize: 1024000,
    lastModified: 1718448000000
  }
}
```

**Restoration:**

1. Tab loads from IndexedDB
2. Deserialize FileSystemFileHandle
3. Request permission via handle.queryPermission() / handle.requestPermission()
4. If granted: Load data
5. If denied: Show "Permission required" prompt with re-request button

**Note:** FileSystemFileHandle can be stored in IndexedDB using structured cloning.

## File Watching

### Electron (v1)

```typescript
// In tab component lifecycle
onMounted(() => {
  if (fileHandle.value && csvFileSystem.watchFile) {
    const unwatch = csvFileSystem.watchFile(fileHandle.value, () => {
      showFileChangedDialog();
    });

    onUnmounted(() => {
      unwatch();
    });
  }
});

function showFileChangedDialog() {
  // Show modal: "File modified externally. Reload or keep current?"
  // If reload: Call useCsvData.refreshData()
  // If keep: Continue with current data (user warned)
}
```

### Web (v1)

No automatic file watching. Provide manual refresh button in toolbar.

**Future (v2):** Implement FileSystemObserver when available:

```typescript
const observer = new FileSystemObserver(() => {
  showFileChangedDialog();
});

observer.observe(fileHandle._webHandle!);

onUnmounted(() => {
  observer.disconnect();
});
```

## Error Handling

### File System Errors

| Error                      | Electron Handling                              | Web Handling                               |
| -------------------------- | ---------------------------------------------- | ------------------------------------------ |
| File not found             | Show "File deleted" toast, disable save        | Show "File no longer accessible" toast     |
| Permission denied          | Show "Permission denied" error                 | Request permission via requestPermission() |
| File too large             | Validate before opening, reject > 50MB         | Same                                       |
| Parse error                | Show error with line number, allow manual edit | Same                                       |
| Save error                 | Show error toast, keep edits                   | Same + check permission                    |
| Network drive disconnected | "File unavailable" error                       | N/A                                        |

### User Experience

- **Non-blocking errors:** Show toast notification, keep UI functional
- **Blocking errors:** Show modal dialog with retry/cancel options
- **Unsaved changes:** Always warn before closing tab

## Performance Optimizations

### Large File Handling

1. **File size validation:** Reject files > 50MB immediately
2. **Streaming parsing:** For future enhancement (v2)
3. **AG Grid virtualization:** Handles 10k+ rows efficiently
4. **Pagination:** Optional for very large datasets

### Memory Management

1. **Dispose grid API:** On component unmount
2. **Clear file handles:** Remove references when tabs close
3. **Limit concurrent open files:** Max 10 CSV tabs
4. **Debounce saves:** Prevent rapid repeated writes

### Caching Strategy

1. **Parsed data:** Keep in memory while tab open
2. **File handles:** Store in tab metadata
3. **No persistent caching:** Always read fresh on tab open

## Security Considerations

### Web Platform

- **HTTPS only:** File System API requires secure context
- **User consent:** Explicit permission required for each file
- **No automatic re-access:** Must re-request permission after page reload
- **Origin isolation:** FileSystemHandle can't cross origins

### Electron Platform

- **Path validation:** Prevent directory traversal
- **File size limits:** Enforce 50MB maximum
- **Read-only validation:** Check write permissions before save

### Both Platforms

- **CSV injection prevention:** Escape formulas (=, +, -, @) in output
- **XSS prevention:** Sanitize cell values before display
- **No arbitrary code execution:** No eval() of cell contents

## Testing Strategy

### Unit Tests

- CSV parser with various formats
- File system abstraction mocks
- Edit tracking logic
- Column definition generation

### Integration Tests

- Platform service integration
- Tab persistence round-trip
- Save/reload cycle

### E2E Tests

- Drag-drop file opening (both platforms)
- Edit and save flow
- Multiple files handling
- Error scenarios

## Browser Compatibility Matrix

| Feature                        | Chrome 86+ | Edge 86+ | Safari 15.2+ | Firefox |
| ------------------------------ | ---------- | -------- | ------------ | ------- |
| File System API                | ✅         | ✅       | ✅           | ❌      |
| Drag-drop                      | ✅         | ✅       | ✅           | ✅\*    |
| FileSystemHandle serialization | ✅         | ✅       | ✅           | ❌      |

\*Firefox drag-drop works but no File System API support - would need fallback.

## Migration Path

### Phase 1: Electron Only

- Implement full feature set for Electron
- Test with real users
- Gather feedback

### Phase 2: Web Support

- Add Web implementation
- Feature parity with Electron (minus file watching)
- Cross-browser testing

### Phase 3: Enhanced Web

- Add FileSystemObserver when available
- Implement streaming for large files
- Progressive enhancement features

## Open Questions

1. Should Web version support "Open in native app" link for Electron users?
2. How to handle Firefox users (no File System API)?
3. Should we implement OPFS (Origin Private File System) as fallback?
4. File watching polling interval for Web (if manual polling)?
5. Should CSV tabs sync across devices (via cloud storage)?
