export default defineEventHandler(event => {
  const accept = getRequestHeader(event, 'accept') || '';
  const path = event.path;

  if (!accept.includes('text/markdown')) {
    return;
  }

  if (path !== '/' && path !== '/index.html') {
    return;
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown');

  return `# Orca CSV

Local-first CSV viewer and editor. Upload a CSV, or drop it anywhere on this page to view, filter, and edit large datasets in a focused local workspace.

## Features

- **Open and view instantly**: Drop one or many CSV files and move straight into a fast table view with pinned headers and large-row handling.
- **Edit like a grid**: Double-click cells, add rows, remove records, and keep the file clean without leaving the browser.
- **Filter without formulas**: Build visual filters across columns, scan results quickly, and keep the dataset readable.
- **Private by default**: CSV parsing and editing run locally. Your data does not need to be uploaded to view it.

## FAQ

**Can I use this page as the app home?**
Yes. The landing page is also the starting point: upload a CSV or drop files anywhere on the page to open the editor.

**Does OrcaQ upload my CSV files?**
No. Files are read locally in your browser so you can view and edit without sending data to a server.

**Can I open multiple files?**
Yes. Select or drop multiple CSV files and OrcaQ opens each file in its own tab.

[GitHub](https://github.com/cin12211/orca-q)
`;
});
