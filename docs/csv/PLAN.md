# CSV Drag-Drop Editor - Implementation Plan

**Version:** 1.0  
**Date:** 2026-06-15  
**Status:** Planning Phase

## Overview

Implement a CSV file editor in HeraQ that works on both **Electron desktop** and **web browsers** using a unified abstraction layer. Users can drag-drop CSV files, view/edit data in an AG Grid interface similar to Quick Query, and save changes back to the original file.

## Platform Support

| Platform     | File Access        | Save Method                  | File Watching              |
| ------------ | ------------------ | ---------------------------- | -------------------------- |
| **Electron** | Node.js fs via IPC | Direct file write            | fs.watch()                 |
| **Web**      | File System API    | FileSystemWritableFileStream | Poll or FileSystemObserver |

## Requirements

### Functional

- ✅ Drag-drop CSV files into app (both platforms)
- ✅ Auto-create and open new tab for each CSV
- ✅ View CSV data in AG Grid (Quick Query-like UI)
- ✅ Edit cells inline, add/delete rows
- ✅ Save changes back to original file
- ✅ Track unsaved changes with visual indicators
- ✅ Works with any open workspace (connection-independent)
- ✅ Detect external file changes (Electron only for v1)

### Technical Constraints

- Must work on both Electron and web browsers
- Reuse Quick Query UI patterns and BaseDataGrid
- Use fast-csv library for parsing/formatting
- File operations abstracted behind unified API
- Web version requires HTTPS (secure context)

## Architecture: Dual-Platform Design

### File System Abstraction Layer

Create a platform-agnostic file system service:

```typescript
interface CsvFileSystemAPI {
  // File access
  openFiles(): Promise<CsvFileHandle[]>;

  // File operations
  readFile(handle: CsvFileHandle): Promise<string>;
  writeFile(handle: CsvFileHandle, content: string): Promise<void>;

  // File watching (optional)
  watchFile?(handle: CsvFileHandle, callback: () => void): () => void;

  // Validation
  validateFile(handle: CsvFileHandle): Promise<FileValidation>;
}

interface CsvFileHandle {
  id: string; // Unique identifier
  name: string; // File name
  path?: string; // Full path (Electron only)
  size: number;
  lastModified: number;
  platform: 'electron' | 'web';

  // Platform-specific storage
  _electronPath?: string;
  _webHandle?: FileSystemFileHandle;
}
```

### Platform Implementations

**Electron Implementation** (`core/services/csv/ElectronCsvFileSystem.ts`):

- Uses IPC to call Node.js fs methods
- Stores full file paths
- Supports file watching with fs.watch()

**Web Implementation** (`core/services/csv/WebCsvFileSystem.ts`):

- Uses File System API (showOpenFilePicker, FileSystemFileHandle)
- Stores FileSystemFileHandle in memory (serializable to IndexedDB)
- No file watching in v1 (add FileSystemObserver later if available)

### Service Factory

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

## Module Structure

```
components/modules/csv-editor/
├── CsvEditor.vue                    # Main orchestrator
├── csv-editor-control-bar/
│   └── CsvEditorControlBar.vue      # Toolbar (save/add/delete)
├── csv-editor-table/
│   ├── CsvEditorTable.vue           # Grid wrapper
│   └── CsvEditorContextMenu.vue     # Copy/export menu
├── hooks/
│   ├── useCsvData.ts                # Load/parse CSV (platform-agnostic)
│   ├── useCsvEditedCells.ts         # Track edits
│   ├── useCsvMutation.ts            # Save to file (platform-agnostic)
│   ├── useCsvColumnDefs.ts          # Generate AG Grid columns
│   └── useCsvGridOptions.ts         # Grid config
└── utils/
    ├── csvParser.ts                 # fast-csv wrapper
    └── csvFormatter.ts              # CSV writing

core/services/csv/
├── index.ts                         # Factory function
├── ElectronCsvFileSystem.ts         # Electron implementation
├── WebCsvFileSystem.ts              # Web implementation
└── types.ts                         # Shared interfaces

electron/ipc/csv.ts                  # Electron IPC handlers (already created)
```

## Tab Integration

### Route Design

Since CSV tabs are workspace-level (not connection-specific):

**Route:** `/[workspaceId]/csv/[tabViewId]`

**Tab metadata:**

```typescript
interface CsvEditorMetadata extends BaseTabMetadata {
  type: TabViewType.CSVEditor;
  fileHandle: CsvFileHandle; // Abstracted handle
  fileName: string;
  hasHeaders?: boolean;
  rowCount?: number;
  lastModified?: number;
}
```

**Tab persistence:**

- Electron: Store file path in IndexedDB, reopen on app restart
- Web: Serialize FileSystemFileHandle to IndexedDB (supported by File System API)

## Data Flow

### Open Flow (Drag-Drop)

**Electron:**

1. User drops file → Drop zone detects event
2. Extract file path from DataTransfer
3. Call `window.electronAPI.csv.validateFile(path)`
4. If valid, create CsvFileHandle with path
5. Call `openCsvEditorTab(handle)`
6. Tab opens → `useCsvData` reads via IPC

**Web:**

1. User drops file → Drop zone calls `dataTransferItem.getAsFileSystemHandle()`
2. Get FileSystemFileHandle
3. Validate file (check name, size via handle.getFile())
4. Create CsvFileHandle with web handle
5. Call `openCsvEditorTab(handle)`
6. Tab opens → `useCsvData` reads via File System API

### Edit Flow (Platform-Agnostic)

1. User edits cell → AG Grid fires `onCellValueChanged`
2. `useCsvEditedCells` tracks change
3. Cell background turns orange
4. User clicks Save → `useCsvMutation.saveFile()`
5. `useCsvMutation` calls `csvFileSystem.writeFile(handle, csvContent)`
6. Platform service handles write (IPC for Electron, FileSystemWritableFileStream for Web)
7. Success → clear edits, refresh data

### File Watching

**Electron (v1):**

- Start watching on tab open via `window.electronAPI.csv.watchFile(path)`
- Main process uses fs.watch()
- On change: Send IPC event → Show dialog "Reload or Keep Current?"

**Web (v1):**

- No automatic watching
- Optional: Manual refresh button
- Future: FileSystemObserver when widely supported

## Drag-Drop Implementation

### Global Drop Zone

Add to `app.vue` or `layouts/default.vue`:

```vue
<template>
  <div
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Existing layout -->

    <!-- Drop overlay (shown when dragging files) -->
    <CsvDropOverlay v-if="showDropOverlay" />
  </div>
</template>
```

**Electron-specific:** Extract file paths from `event.dataTransfer.files`

**Web-specific:** Use `event.dataTransfer.items[i].getAsFileSystemHandle()`

### Multiple Files

- Accept all valid CSV files (limit to 10)
- Validate each file
- Open tabs sequentially
- Show toast: "Opened 5/7 CSV files (2 invalid)"

## Implementation Phases

### Phase 1: Foundation ✓

1. ✅ Install fast-csv dependency
2. ✅ Add TabViewType.CSVEditor to tab system
3. ✅ Create Electron IPC handlers (electron/ipc/csv.ts)
4. ✅ Update preload.ts with CSV API
5. ✅ Add route mapping + openCsvEditorTab()
6. ✅ Create file system abstraction layer
7. ✅ Implement ElectronCsvFileSystem
8. ✅ Implement WebCsvFileSystem
9. ✅ Add platform detection and factory

### Phase 2: CSV Module Core ✓

10. ✅ Create csv-editor folder structure
11. ✅ Implement csvParser.ts + csvFormatter.ts
12. ✅ Create useCsvData (using file system abstraction)
13. ✅ Create useCsvEditedCells (adapted from Quick Query)
14. ✅ Create useCsvColumnDefs
15. ✅ Create useCsvGridOptions

### Phase 3: UI Components ✓

16. ✅ Implement CsvEditorTable.vue
17. ✅ Implement CsvEditorControlBar.vue
18. ✅ Implement CsvEditorContextMenu.vue
19. ✅ Implement CsvEditor.vue (orchestrator)
20. ✅ Create route page: pages/[workspaceId]/csv/[tabViewId].vue

### Phase 4: Drag-Drop Integration ✓

21. ✅ Add global drop zone to layout
22. ✅ Implement Electron drop handler (file paths)
23. ✅ Implement Web drop handler (FileSystemHandle)
24. ✅ Add visual feedback (drop overlay)
25. ✅ Connect to openCsvEditorTab()

### Phase 5: Save & Lifecycle ✓

26. ✅ Implement useCsvMutation (using file system abstraction)
27. ✅ Add unsaved changes tracking
28. ✅ Hook tab close warning
29. ✅ Implement file watching (Electron only v1)
30. ✅ Tab persistence (serialize handles to IndexedDB)

### Phase 6: Polish

31. [ ] Add encoding detection/selector
32. ✅ Implement delimiter selection/auto-detection
33. ✅ File size validation (50MB limit)
34. ✅ Handle no-headers case
35. ✅ Comprehensive error handling
36. [ ] Cross-browser testing (Chrome, Edge, Safari)

## Browser Compatibility

### File System API Support

| Browser      | showOpenFilePicker | FileSystemFileHandle | FileSystemWritableFileStream |
| ------------ | ------------------ | -------------------- | ---------------------------- |
| Chrome 86+   | ✅                 | ✅                   | ✅                           |
| Edge 86+     | ✅                 | ✅                   | ✅                           |
| Safari 15.2+ | ✅                 | ✅                   | ✅                           |
| Firefox      | ❌                 | ❌                   | ❌                           |

**Fallback for unsupported browsers:**

- Show message: "CSV editor requires a modern browser with File System API support"
- Provide download link to Chrome/Edge
- OR: Implement fallback using traditional file input + in-memory only (no save)

## Security Considerations

### Web Platform

- **HTTPS required** - File System API only works in secure contexts
- **User permission** - User must explicitly grant access via picker or drag-drop
- **No automatic re-access** - FileSystemFileHandle must be re-authorized on page reload (unless serialized to IndexedDB with user consent)

### Electron Platform

- File paths validated before access
- No arbitrary file system traversal
- File size limits enforced (50MB)

## Edge Cases

| Case                                 | Solution                                            |
| ------------------------------------ | --------------------------------------------------- |
| No workspace open                    | Reject drop, show toast: "Open workspace first"     |
| Multiple files dropped               | Accept all valid CSVs (max 10), show summary toast  |
| File > 50MB                          | Reject, suggest database import                     |
| No headers                           | Auto-detect + toolbar toggle, generate column names |
| **File deleted (Electron)**          | Disable save, offer "Save As"                       |
| **File deleted (Web)**               | FileSystemHandle becomes invalid, show error        |
| **External modification (Electron)** | fs.watch detects → prompt reload                    |
| **External modification (Web)**      | No detection in v1, manual refresh button           |
| Encoding issues                      | Default UTF-8, fallback UTF-16                      |
| Invalid CSV                          | Show parse error with line number                   |
| **Browser unsupported (Web)**        | Check for File System API, show upgrade message     |

## Testing Strategy

### Unit Tests

- CSV parser/formatter utilities
- Edit tracking logic
- Column definition generation
- File validation logic
- Platform service mocks

### Integration Tests

- File system abstraction (mock both platforms)
- Tab creation/persistence
- Save flow end-to-end
- Multiple file handling

### E2E Tests

- **Electron:** Drag-drop, edit, save, external changes
- **Web:** File picker, drag-drop, edit, save
- Cross-browser testing (Chrome, Edge, Safari)

### Manual Testing

- Large files (30-50MB)
- Special characters/Unicode
- Different delimiters
- No headers case
- Platform switching (same tab structure on both)

## Dependencies

```json
{
  "dependencies": {
    "fast-csv": "^5.0.1"
  }
}
```

## Performance Considerations

### Large Files

| File Size | Strategy                                      |
| --------- | --------------------------------------------- |
| < 10MB    | Load fully into memory                        |
| 10-50MB   | Load with warning, use AG Grid virtualization |
| > 50MB    | Reject, recommend database import             |

### Memory Management

- Dispose grid API on unmount
- Unwatch files on tab close
- Clear file handles from memory when tabs close
- Web: Explicitly release FileSystemHandle references

## Future Enhancements

### V2 Features

- **Web file watching:** Use FileSystemObserver API when available
- **Streaming for large files:** Process chunks instead of loading all
- **Column type inference:** Auto-detect numbers, dates, booleans
- **Advanced filtering:** Full Quick Query filter UI
- **Export formats:** Excel, JSON, SQL
- **Collaboration:** Share FileSystemHandle via URL (if supported)

### V3 Features

- **Virtual scrolling:** For files with millions of rows
- **Compressed CSV:** Support .csv.gz files
- **Schema validation:** Define expected columns/types
- **Undo/redo stack:** Independent of AG Grid's built-in
- **Diff view:** Compare two CSV files side-by-side

## Success Metrics

- [ ] Works on both Electron and web with same UI
- [ ] Can open/edit/save 1MB CSV in < 3 seconds
- [ ] No memory leaks after opening/closing 10 files
- [ ] All unit tests pass
- [ ] E2E tests pass on Chrome, Edge, Safari
- [ ] Zero data loss scenarios in normal operation

## Risk Assessment

| Risk                                | Severity | Mitigation                              |
| ----------------------------------- | -------- | --------------------------------------- |
| File System API browser support     | High     | Feature detection + upgrade message     |
| Large file performance              | Medium   | File size limits + virtualization       |
| Data loss on save failure           | High     | Write to temp file first, atomic rename |
| FileSystemHandle serialization bugs | Medium   | Thorough testing, fallback to re-pick   |
| Memory leaks (file handles)         | Medium   | Proper cleanup on unmount/close         |
| Cross-platform inconsistencies      | Medium   | Abstraction layer + extensive testing   |

## Rollout Plan

1. **Alpha (Internal):** Electron only, team testing
2. **Beta (Limited):** Both platforms, select users
3. **GA (General):** Full rollout with feature flag
4. **Monitor:** Error rates, performance metrics, user feedback
