// utils/pdfUtils.js
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source using CDN for compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

/**
 * Loads a PDF document from a URL
 * @param {string} url - The URL of the PDF document
 * @returns {Promise<Object>} The loaded PDF document
 */
export const loadPdf = async (url) => {
  try {
    // Configure CORS handling and other options
    const loadingTask = pdfjsLib.getDocument({
      url: url,
      // Enable CORS handling
      withCredentials: false,
      // Handle potential CORS issues
      httpHeaders: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      // Enable CMap for character encoding
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
};

/**
 * Renders a specific page of a PDF to a canvas
 * @param {Object} pdf - The loaded PDF document
 * @param {number} pageNumber - The page number to render (1-indexed)
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @param {number} scale - Scale factor for rendering
 * @returns {Promise<Object>} Object containing page information
 */
export const renderPdfPage = async (pdf, pageNumber, canvas, scale = 1.0) => {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Set canvas dimensions
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    const renderTask = page.render(renderContext);
    await renderTask.promise;
    
    return {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
      scale
    };
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    throw error;
  }
};

/**
 * Extracts text content from a PDF page
 * @param {Object} pdf - The loaded PDF document
 * @param {number} pageNumber - The page number to extract text from
 * @returns {Promise<string>} The extracted text
 */
export const extractPdfText = async (pdf, pageNumber) => {
  try {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    // Concatenate all text items
    const text = textContent.items.map(item => item.str).join(' ');
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
};