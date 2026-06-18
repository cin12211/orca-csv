import { ipcMain, type BrowserWindow } from 'electron';
import { existsSync, statSync } from 'node:fs';
import { readFile, writeFile, watch } from 'node:fs/promises';
import path from 'node:path';

interface CsvValidationResult {
  valid: boolean;
  error?: string;
  size?: number;
  lastModified?: number;
}

interface CsvReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

interface CsvWriteResult {
  success: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function registerCsvHandlers(
  getMainWindow: () => BrowserWindow | null
): void {
  ipcMain.handle(
    'csv:validate-file',
    async (_event, filePath: string): Promise<CsvValidationResult> => {
      try {
        if (!existsSync(filePath)) {
          return { valid: false, error: 'File does not exist' };
        }

        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.csv') {
          return { valid: false, error: 'File is not a CSV file' };
        }

        const stats = statSync(filePath);
        if (stats.size > MAX_FILE_SIZE) {
          return {
            valid: false,
            error: `File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
          };
        }

        return {
          valid: true,
          size: stats.size,
          lastModified: stats.mtimeMs,
        };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  ipcMain.handle(
    'csv:read-file',
    async (_event, filePath: string): Promise<CsvReadResult> => {
      try {
        const content = await readFile(filePath, 'utf-8');
        return { success: true, content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to read file',
        };
      }
    }
  );

  ipcMain.handle(
    'csv:write-file',
    async (
      _event,
      payload: { filePath: string; content: string }
    ): Promise<CsvWriteResult> => {
      try {
        await writeFile(payload.filePath, payload.content, 'utf-8');
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to write file',
        };
      }
    }
  );

  const fileWatchers = new Map<string, ReturnType<typeof watch>>();

  ipcMain.handle('csv:watch-file', async (_event, filePath: string) => {
    if (fileWatchers.has(filePath)) return;

    try {
      const watcher = watch(filePath);
      fileWatchers.set(filePath, watcher);

      (async () => {
        for await (const event of watcher) {
          const mainWindow = getMainWindow();
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(
              `csv:file-changed:${filePath}`,
              event.eventType
            );
          }
        }
      })();
    } catch (error) {
      console.error('Failed to watch file:', error);
    }
  });

  ipcMain.handle('csv:unwatch-file', async (_event, filePath: string) => {
    const watcher = fileWatchers.get(filePath);
    if (watcher) {
      await (watcher as any).close?.();
      fileWatchers.delete(filePath);
    }
  });
}
