# Page Management Feature Documentation

## Overview

The Page Management feature provides comprehensive page manipulation capabilities within the document thumbnail sidebar for both `/view` and `/edit` routes. Users can duplicate, rotate, delete, and add pages through an intuitive UI with hover-based action controls.

## Features

### 1. Thumbnail Sidebar Fold/Unfold

The thumbnail sidebar can be collapsed to provide more screen space for document viewing:

- **Collapse**: Click the chevron-left button at the top of the sidebar
- **Expand**: Click the chevron-right button on the collapsed sidebar
- **Collapsed State**: Shows current page indicator (e.g., "2 / 5")

### 2. Page Duplication

Duplicates a page and inserts the copy immediately after the original:

- Hover over a thumbnail to reveal action buttons
- Click the duplicate icon (two overlapping documents)
- The new page is inserted at position `originalIndex + 1`
- Automatically navigates to the duplicated page

### 3. Page Rotation

Rotates a page 90° clockwise:

- Hover over a thumbnail to reveal action buttons
- Click the rotate icon (circular arrow)
- Rotation is cumulative (90° → 180° → 270° → 0°)
- Thumbnail updates to reflect the rotation

### 4. Page Deletion

Removes a page from the document with confirmation:

- Hover over a thumbnail to reveal action buttons
- Click the delete icon (trash can) - first click shows confirmation
- Click again within 3 seconds to confirm deletion
- Cannot delete the last remaining page
- Automatically adjusts current page if needed

### 5. Add Blank Page

Adds a blank page at the end of the document:

- Click "Add Page" button at the bottom of the sidebar
- New page uses the same dimensions as existing pages
- Automatically navigates to the new page

## Architecture

### Component Structure

```
PageThumbnails.jsx
├── CollapsedSidebar (collapsed state)
├── PageThumbnail (individual thumbnail)
│   └── PageActionButton (action buttons)
└── AddPageButton (add page control)
```

### File Structure

```
Decodocs/web/src/
├── components/
│   ├── PageThumbnails.jsx      # Main thumbnail sidebar component
│   ├── DocumentViewer.jsx      # Integration in view mode
│   └── DocumentEditor.jsx      # Integration in edit mode
├── hooks/
│   └── usePageManagement.js    # Page operations hook with undo/redo
└── utils/
    └── pdfPageOperations.js    # Low-level PDF manipulation functions
```

## API Reference

### PageThumbnails Component

```jsx
<PageThumbnails
  pdfDoc={pdfDoc}              // PDF.js document object
  numPages={numPages}          // Total page count
  currentPage={pageNumber}     // Current page (1-indexed)
  onPageClick={handlePageClick}          // Page navigation callback
  onDuplicatePage={handleDuplicatePage}  // Duplicate callback
  onRotatePage={handleRotatePage}        // Rotate callback
  onDeletePage={handleDeletePage}        // Delete callback
  onAddPage={handleAddPage}              // Add page callback
  isProcessing={isProcessing}            // Processing state
  pageRotations={pageRotations}          // Rotation state object
/>
```

### usePageManagement Hook

```jsx
const {
  // State
  isProcessing,    // Boolean - operation in progress
  error,           // Error message or null
  canUndo,         // Boolean - undo available
  canRedo,         // Boolean - redo available

  // PDF bytes management
  setPdfBytes,     // Set current PDF bytes

  // Page operations
  duplicatePage,   // (pageIndex: number) => Promise<void>
  rotatePage,      // (pageIndex: number, rotation?: number) => Promise<void>
  deletePage,      // (pageIndex: number) => Promise<void>
  addPage,         // (insertIndex: number, options?: object) => Promise<void>
  movePage,        // (fromIndex: number, toIndex: number) => Promise<void>

  // Undo/redo
  undo,            // () => Promise<boolean>
  redo,            // () => Promise<boolean>
  clearHistory,    // () => void
} = usePageManagement({
  onPdfBytesChange,    // Callback when PDF bytes change
  onPageCountChange,   // Callback when page count changes
  onPageChange,        // Callback to navigate to a page
});
```

### pdfPageOperations Utility

```javascript
// Duplicate a page
await duplicatePage(pdfBytes, pageIndex);

// Rotate a page (90, 180, 270, or -90)
await rotatePage(pdfBytes, pageIndex, rotation);

// Delete a page
await deletePage(pdfBytes, pageIndex);

// Add a blank page
await addBlankPage(pdfBytes, insertIndex, { width, height });

// Move a page
await movePage(pdfBytes, fromIndex, toIndex);

// Get page dimensions
const { width, height, rotation } = await getPageDimensions(pdfBytes, pageIndex);
```

## State Management

### Page Rotations

Page rotations are tracked separately from the PDF to enable immediate UI updates:

```jsx
const [pageRotations, setPageRotations] = useState({});

// After rotation
setPageRotations(prev => ({
  ...prev,
  [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
}));
```

### PDF Bytes

PDF bytes are stored and passed to the page management hook:

```jsx
const [pdfBytes, setPdfBytes] = useState(null);

// When document loads
useEffect(() => {
  if (pdfDoc && selectedDocument?.file) {
    selectedDocument.file.arrayBuffer().then(buffer => {
      setPdfBytes(new Uint8Array(buffer));
    });
  }
}, [pdfDoc, selectedDocument]);
```

## Undo/Redo Support

The `usePageManagement` hook maintains an undo stack:

1. Each operation saves the previous PDF state
2. `undo()` restores the previous state
3. `redo()` re-applies undone operations
4. New operations clear the redo stack

## Error Handling

### User-Facing Errors

Errors are displayed via the `AppDialog` component:

```jsx
try {
  await handleDuplicatePage(pageIndex);
} catch (err) {
  setDialog({
    title: 'Duplicate Failed',
    message: err.message || 'Failed to duplicate the page.',
    primaryLabel: 'OK',
    primaryTo: null,
  });
}
```

### Validation

- **Invalid page index**: Throws error with message
- **Delete last page**: Prevented by disabled button state
- **No PDF loaded**: Throws "No PDF loaded" error

## Testing

### Unit Tests

Located in:
- `src/utils/pdfPageOperations.test.js`
- `src/hooks/usePageManagement.test.js`
- `src/components/PageThumbnails.test.jsx`

Run with:
```bash
npm run test
```

### Integration Tests

Located in:
- `playwright-tests/page-management.spec.js`

Run with:
```bash
npx playwright test page-management.spec.js
```

## Accessibility

- All interactive elements are keyboard accessible
- Action buttons have descriptive `title` attributes
- Focus management follows logical tab order
- ARIA labels for screen readers

## Performance Considerations

1. **Thumbnail Rendering**: Uses PDF.js at 0.15 scale for efficient rendering
2. **Render Cancellation**: Previous render tasks are cancelled when re-rendering
3. **Lazy Loading**: Thumbnails render on-demand as they scroll into view
4. **Debounced Operations**: Page operations are processed sequentially

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- Canvas API
- Web Crypto API (for SHA-256 hashing)
- ES2020 features (optional chaining, nullish coalescing)

## Future Enhancements

1. **Drag and Drop**: Reorder pages by dragging thumbnails
2. **Multi-Select**: Select multiple pages for batch operations
3. **Page Extraction**: Extract selected pages to new document
4. **Undo/Redo UI**: Visual undo/redo buttons in toolbar
5. **Page Labels**: Custom page labels (e.g., "i, ii, iii, 1, 2, 3")
