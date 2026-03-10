/**
 * PDF Page Operations Utility
 * 
 * Provides functions for manipulating PDF pages including:
 * - Duplicate pages
 * - Rotate pages
 * - Delete pages
 * - Add blank pages
 * 
 * Uses pdf-lib for PDF manipulation
 */

/**
 * Load a PDF document from ArrayBuffer using pdf-lib
 * @param {ArrayBuffer} pdfBytes - The PDF data as ArrayBuffer
 * @returns {Promise<PDFDocument>} The loaded PDF document
 */
export const loadPdfDocument = async (pdfBytes) => {
  const { PDFDocument } = await import('pdf-lib');
  return await PDFDocument.load(pdfBytes);
};

/**
 * Save a PDF document to ArrayBuffer
 * @param {PDFDocument} pdfDoc - The PDF document to save
 * @returns {Promise<Uint8Array>} The saved PDF data
 */
export const savePdfDocument = async (pdfDoc) => {
  return await pdfDoc.save();
};

/**
 * Duplicate a page in the PDF document
 * @param {ArrayBuffer} pdfBytes - The original PDF data
 * @param {number} pageIndex - The 0-based index of the page to duplicate
 * @returns {Promise<Uint8Array>} The modified PDF data
 */
export const duplicatePage = async (pdfBytes, pageIndex) => {
  const { PDFDocument } = await import('pdf-lib');
  const srcDoc = await PDFDocument.load(pdfBytes);
  const pageCount = srcDoc.getPageCount();
  
  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}. Document has ${pageCount} pages.`);
  }
  
  // Create a new document to hold the result
  const destDoc = await PDFDocument.create();
  
  // Copy all pages up to and including the page to duplicate
  const pagesBeforeAndTarget = await destDoc.copyPages(srcDoc, 
    Array.from({ length: pageIndex + 1 }, (_, i) => i)
  );
  pagesBeforeAndTarget.forEach(page => destDoc.addPage(page));
  
  // Copy the duplicated page
  const [duplicatedPage] = await destDoc.copyPages(srcDoc, [pageIndex]);
  destDoc.addPage(duplicatedPage);
  
  // Copy remaining pages after the target
  if (pageIndex + 1 < pageCount) {
    const pagesAfter = await destDoc.copyPages(srcDoc,
      Array.from({ length: pageCount - pageIndex - 1 }, (_, i) => pageIndex + 1 + i)
    );
    pagesAfter.forEach(page => destDoc.addPage(page));
  }
  
  return await destDoc.save();
};

/**
 * Rotate a page in the PDF document
 * @param {ArrayBuffer} pdfBytes - The original PDF data
 * @param {number} pageIndex - The 0-based index of the page to rotate
 * @param {number} rotation - Rotation angle in degrees (90, 180, 270, or -90)
 * @returns {Promise<Uint8Array>} The modified PDF data
 */
export const rotatePage = async (pdfBytes, pageIndex, rotation = 90) => {
  const pdfDoc = await loadPdfDocument(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}. Document has ${pageCount} pages.`);
  }
  
  const page = pdfDoc.getPage(pageIndex);
  const currentRotation = page.getRotation().angle;
  
  // Normalize rotation to 0, 90, 180, or 270
  let newRotation = (currentRotation + rotation) % 360;
  if (newRotation < 0) newRotation += 360;
  
  page.setRotation({ angle: newRotation });
  
  return await savePdfDocument(pdfDoc);
};

/**
 * Delete a page from the PDF document
 * @param {ArrayBuffer} pdfBytes - The original PDF data
 * @param {number} pageIndex - The 0-based index of the page to delete
 * @returns {Promise<Uint8Array>} The modified PDF data
 */
export const deletePage = async (pdfBytes, pageIndex) => {
  const pdfDoc = await loadPdfDocument(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  if (pageIndex < 0 || pageIndex >= pageCount) {
    throw new Error(`Invalid page index: ${pageIndex}. Document has ${pageCount} pages.`);
  }
  
  if (pageCount === 1) {
    throw new Error('Cannot delete the last page of a document.');
  }
  
  pdfDoc.removePage(pageIndex);
  
  return await savePdfDocument(pdfDoc);
};

/**
 * Add a blank page to the PDF document
 * @param {ArrayBuffer} pdfBytes - The original PDF data
 * @param {number} insertIndex - The 0-based index where to insert the new page
 * @param {Object} options - Options for the new page
 * @param {number} options.width - Page width in points (default: 612 for Letter)
 * @param {number} options.height - Page height in points (default: 792 for Letter)
 * @returns {Promise<Uint8Array>} The modified PDF data
 */
export const addBlankPage = async (pdfBytes, insertIndex, options = {}) => {
  const pdfDoc = await loadPdfDocument(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  // Default to Letter size (612 x 792 points)
  // If there are existing pages, use the size of the first page as default
  let width = options.width;
  let height = options.height;
  
  if (!width || !height) {
    if (pageCount > 0) {
      const firstPage = pdfDoc.getPage(0);
      const { width: existingWidth, height: existingHeight } = firstPage.getSize();
      width = width || existingWidth;
      height = height || existingHeight;
    } else {
      width = width || 612;
      height = height || 792;
    }
  }
  
  // Validate insert index
  const validInsertIndex = Math.max(0, Math.min(insertIndex, pageCount));
  
  // Add a blank page
  const blankPage = pdfDoc.insertPage(validInsertIndex, [width, height]);
  
  // Set white background
  const { rgb } = await import('pdf-lib');
  blankPage.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(1, 1, 1),
  });
  
  return await savePdfDocument(pdfDoc);
};

/**
 * Move a page from one position to another
 * @param {ArrayBuffer} pdfBytes - The original PDF data
 * @param {number} fromIndex - The current 0-based index of the page
 * @param {number} toIndex - The target 0-based index for the page
 * @returns {Promise<Uint8Array>} The modified PDF data
 */
export const movePage = async (pdfBytes, fromIndex, toIndex) => {
  const pdfDoc = await loadPdfDocument(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  if (fromIndex < 0 || fromIndex >= pageCount) {
    throw new Error(`Invalid from index: ${fromIndex}. Document has ${pageCount} pages.`);
  }
  
  if (toIndex < 0 || toIndex >= pageCount) {
    throw new Error(`Invalid to index: ${toIndex}. Document has ${pageCount} pages.`);
  }
  
  if (fromIndex === toIndex) {
    return pdfBytes instanceof ArrayBuffer ? new Uint8Array(pdfBytes) : pdfBytes;
  }
  
  // Get the page to move
  const pageToMove = pdfDoc.getPage(fromIndex);
  
  // Remove it from its current position
  pdfDoc.removePage(fromIndex);
  
  // Insert it at the new position
  // Note: After removal, indices shift, so we need to adjust
  const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  pdfDoc.insertPage(adjustedToIndex, pageToMove);
  
  return await savePdfDocument(pdfDoc);
};

/**
 * Get page dimensions
 * @param {ArrayBuffer} pdfBytes - The PDF data
 * @param {number} pageIndex - The 0-based page index
 * @returns {Promise<{width: number, height: number, rotation: number}>} Page dimensions
 */
export const getPageDimensions = async (pdfBytes, pageIndex) => {
  const pdfDoc = await loadPdfDocument(pdfBytes);
  const page = pdfDoc.getPage(pageIndex);
  const { width, height } = page.getSize();
  const rotation = page.getRotation().angle;
  
  return { width, height, rotation };
};

/**
 * Create a new PDF with pages from multiple sources
 * @param {Array<{bytes: ArrayBuffer, pages: number[]}>} sources - Array of source PDFs and page indices
 * @returns {Promise<Uint8Array>} The merged PDF data
 */
export const mergePages = async (sources) => {
  const { PDFDocument } = await import('pdf-lib');
  const destDoc = await PDFDocument.create();
  
  for (const source of sources) {
    const srcDoc = await PDFDocument.load(source.bytes);
    const copiedPages = await destDoc.copyPages(srcDoc, source.pages);
    copiedPages.forEach(page => destDoc.addPage(page));
  }
  
  return await destDoc.save();
};
