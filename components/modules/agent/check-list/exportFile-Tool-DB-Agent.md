# exportFile Tool — DB Agent

## Overview

A tool that allows the agent to export database query results into user-friendly file formats.
The agent automatically infers the desired format from natural language and triggers a file download on the client side.

---

## Supported Formats

| Format | Use Case                                                           |
| ------ | ------------------------------------------------------------------ |
| `csv`  | Export query result rows — easy to open in Excel / Google Sheets   |
| `json` | Structured data for developers or API consumption                  |
| `sql`  | Export schema or data as `CREATE TABLE` / `INSERT INTO` statements |
| `xlsx` | Business users who want a formatted spreadsheet                    |

---

## Input Schema

```ts
{
  data:       object[]   // query result rows
  format:     "csv" | "json" | "sql" | "xlsx"
  filename?:  string     // optional — defaults to table name or "export"
  tableName?: string     // required for SQL format (used in INSERT INTO / CREATE TABLE)
}
```

---

## Agent Behavior

- Agent calls this tool after executing a query when the user requests an export
- Format is inferred from natural language — no need for exact keywords
  - _"export ra excel"_ → `xlsx`
  - _"save thành CSV"_ → `csv`
  - _"dump SQL"_ → `sql`
  - _"trả về JSON"_ → `json`
- `filename` defaults to the queried table name if not provided
- `tableName` is passed automatically from the query context when format is `sql`

---

## Implementation Tasks

### 1. Tool Definition (`tools/exportFile.ts`)

- [ ] Define input schema using Zod
- [ ] Write `execute()` function that converts `data` to the target format
- [ ] Return `{ filename, mimeType, content, format }` to the client

### 2. Format Converters

- [ ] **CSV** — use `Papa.unparse()` or manual join
- [ ] **JSON** — `JSON.stringify(data, null, 2)`
- [ ] **SQL** — generate `INSERT INTO {tableName} VALUES (...)` from rows, include `CREATE TABLE` header
- [ ] **XLSX** — use `SheetJS (xlsx)` to generate binary buffer

### 3. Client Download Hook (`hooks/useFileDownload.ts`)

- [ ] Accept tool result from `useChat()` message parts
- [ ] Create `Blob` → `URL.createObjectURL` → trigger `<a download>`
- [ ] Support binary content for XLSX (base64 decode before Blob)

### 4. UI Components

**`ExportToolResult`** — chat bubble

- [ ] Render inside chat as a clickable result bubble
- [ ] Show: format icon, filename, file size
- [ ] On click → open `ExportPreviewModal`
- [ ] Handle error state from tool result

**`ExportPreviewModal`** — preview before download

- [ ] `csv` / `xlsx` → render rows as a table
- [ ] `json` / `sql` → syntax-highlighted code block
- [ ] Footer: **Download** button + **Close** button
- [ ] Close on `Esc` / backdrop click

### 5. Wire into Agent Route (`app/api/chat/route.ts`)

- [ ] Register `exportFile` in the `tools` object of `streamText()`
- [ ] Add instruction in system prompt: when to call the tool and how to pass `data`

---

## File Structure

Place files following your existing source base convention:

- Tool definition → alongside other tools
- Hook → alongside other hooks
- Component → alongside other chat components
- API route → alongside the existing chat route

---

## Preview Modal

When the tool result renders in chat, clicking the result bubble opens a **modal preview** before downloading.

### Behavior

- Click result bubble → open modal
- Modal shows a preview of the file content based on format:
  - `csv` / `xlsx` → rendered as a table
  - `json` → syntax-highlighted code block
  - `sql` → syntax-highlighted code block
- Modal footer has two actions:
  - **Download** → triggers file download then closes modal
  - **Close** → dismiss without downloading

### Component (`ExportPreviewModal`)

- [ ] Accept `result` prop (same shape as tool result)
- [ ] Render correct preview per format
- [ ] Download button calls `useFileDownload()` hook
- [ ] Trap focus, close on `Esc` / backdrop click

---

## Notes

- XLSX requires binary encoding — return as `base64` string, decode on client before creating `Blob`
- SQL export should sanitize column names and escape string values
- Do not support `txt`, `html`, `xml`, `yaml`, `pdf` — no practical use case for a DB agent
