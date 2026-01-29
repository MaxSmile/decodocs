/**
 * Utility functions for PDF operations
 */

// Utility function to compute SHA-256 hash
export const computeSHA256 = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Function to detect scanned documents
export const detectScannedDocument = (textContent, numPages) => {
  if (!textContent || numPages === 0) return 0;

  const MIN_CHARS_PER_PAGE = 50; // Threshold for determining if a page is scanned
  const pages = textContent.split('\f'); // Assuming form feed character separates pages
  let pagesWithLowText = 0;

  for (let i = 0; i < Math.min(pages.length, numPages); i++) {
    const pageText = pages[i] || '';
    if (pageText.trim().length < MIN_CHARS_PER_PAGE) {
      pagesWithLowText++;
    }
  }

  return pagesWithLowText / numPages; // Return ratio of pages with low text
};

// Extract text content from PDF
export const extractPdfText = async (pdf) => {
  try {
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\f'; // Form feed character to separate pages
    }
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'PDF text content';
  }
};
