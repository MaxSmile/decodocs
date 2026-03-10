/**
 * Unit tests for PDF Page Operations utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  duplicatePage,
  rotatePage,
  deletePage,
  addBlankPage,
  movePage,
  getPageDimensions,
  loadPdfDocument,
  savePdfDocument,
} from './pdfPageOperations.js';

// Mock pdf-lib module
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn(),
    create: vi.fn(),
  },
  rgb: vi.fn((r, g, b) => ({ r, g, b })),
}));

describe('pdfPageOperations', () => {
  let mockPdfBytes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfBytes = new Uint8Array([1, 2, 3, 4]);
  });

  describe('loadPdfDocument', () => {
    it('should load a PDF document from bytes', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 3 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      const result = await loadPdfDocument(mockPdfBytes);

      expect(PDFDocument.load).toHaveBeenCalledWith(mockPdfBytes);
      expect(result).toBe(mockDoc);
    });
  });

  describe('savePdfDocument', () => {
    it('should save a PDF document to bytes', async () => {
      const mockDoc = {
        save: vi.fn().mockResolvedValue(new Uint8Array([5, 6, 7, 8]))
      };

      const result = await savePdfDocument(mockDoc);

      expect(mockDoc.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('duplicatePage', () => {
    it('should duplicate a page at the specified index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockSrcDoc = {
        getPageCount: () => 3,
      };
      
      const mockDestDoc = {
        copyPages: vi.fn().mockResolvedValue([
          { getSize: () => ({ width: 612, height: 792 }) },
          { getSize: () => ({ width: 612, height: 792 }) },
          { getSize: () => ({ width: 612, height: 792 }) },
        ]),
        addPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
      };

      PDFDocument.load.mockResolvedValue(mockSrcDoc);
      PDFDocument.create.mockResolvedValue(mockDestDoc);

      const result = await duplicatePage(mockPdfBytes, 1);

      expect(mockDestDoc.copyPages).toHaveBeenCalled();
      expect(mockDestDoc.addPage).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for invalid page index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 2 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(duplicatePage(mockPdfBytes, 5)).rejects.toThrow('Invalid page index');
    });
  });

  describe('rotatePage', () => {
    it('should rotate a page by 90 degrees', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getRotation: () => ({ angle: 0 }),
        setRotation: vi.fn(),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      const result = await rotatePage(mockPdfBytes, 0, 90);

      expect(mockDoc.getPage).toHaveBeenCalledWith(0);
      expect(mockPage.setRotation).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle negative rotation', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getRotation: () => ({ angle: 90 }),
        setRotation: vi.fn(),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      const result = await rotatePage(mockPdfBytes, 0, -90);

      expect(mockPage.setRotation).toHaveBeenCalledWith({ angle: 0 });
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for invalid page index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 2 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(rotatePage(mockPdfBytes, 5)).rejects.toThrow('Invalid page index');
    });
  });

  describe('deletePage', () => {
    it('should delete a page at the specified index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockDoc = {
        getPageCount: () => 3,
        removePage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await deletePage(mockPdfBytes, 1);

      expect(mockDoc.removePage).toHaveBeenCalledWith(1);
    });

    it('should throw error when trying to delete the last page', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 1 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(deletePage(mockPdfBytes, 0)).rejects.toThrow('Cannot delete the last page');
    });

    it('should throw error for invalid page index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 2 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(deletePage(mockPdfBytes, 5)).rejects.toThrow('Invalid page index');
    });
  });

  describe('addBlankPage', () => {
    it('should add a blank page at the specified index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getSize: () => ({ width: 612, height: 792 }),
        drawRectangle: vi.fn(),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
        insertPage: vi.fn().mockReturnValue({
          drawRectangle: vi.fn(),
        }),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await addBlankPage(mockPdfBytes, 1);

      expect(mockDoc.insertPage).toHaveBeenCalled();
    });

    it('should use existing page dimensions if not specified', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getSize: () => ({ width: 612, height: 792 }),
        drawRectangle: vi.fn(),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
        insertPage: vi.fn().mockReturnValue({
          drawRectangle: vi.fn(),
        }),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await addBlankPage(mockPdfBytes, 0);

      expect(mockDoc.insertPage).toHaveBeenCalledWith(0, [612, 792]);
    });

    it('should use default dimensions for empty document', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockDoc = {
        getPageCount: () => 0,
        insertPage: vi.fn().mockReturnValue({
          drawRectangle: vi.fn(),
        }),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await addBlankPage(mockPdfBytes, 0);

      expect(mockDoc.insertPage).toHaveBeenCalledWith(0, [612, 792]);
    });

    it('should use custom dimensions when provided', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getSize: () => ({ width: 612, height: 792 }),
        drawRectangle: vi.fn(),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
        insertPage: vi.fn().mockReturnValue({
          drawRectangle: vi.fn(),
        }),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await addBlankPage(mockPdfBytes, 0, { width: 800, height: 600 });

      expect(mockDoc.insertPage).toHaveBeenCalledWith(0, [800, 600]);
    });
  });

  describe('movePage', () => {
    it('should move a page from one position to another', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = { getSize: () => ({ width: 612, height: 792 }) };
      
      const mockDoc = {
        getPageCount: () => 5,
        getPage: vi.fn().mockReturnValue(mockPage),
        removePage: vi.fn(),
        insertPage: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      await movePage(mockPdfBytes, 0, 2);

      expect(mockDoc.removePage).toHaveBeenCalledWith(0);
      expect(mockDoc.insertPage).toHaveBeenCalled();
    });

    it('should return same bytes if from and to indices are the same', async () => {
      const result = await movePage(mockPdfBytes, 1, 1);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for invalid from index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 2 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(movePage(mockPdfBytes, 5, 0)).rejects.toThrow('Invalid from index');
    });

    it('should throw error for invalid to index', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockDoc = { getPageCount: () => 2 };
      PDFDocument.load.mockResolvedValue(mockDoc);

      await expect(movePage(mockPdfBytes, 0, 5)).rejects.toThrow('Invalid to index');
    });
  });

  describe('getPageDimensions', () => {
    it('should return page dimensions and rotation', async () => {
      const { PDFDocument } = await import('pdf-lib');
      
      const mockPage = {
        getSize: () => ({ width: 612, height: 792 }),
        getRotation: () => ({ angle: 0 }),
      };
      
      const mockDoc = {
        getPageCount: () => 3,
        getPage: vi.fn().mockReturnValue(mockPage),
      };
      
      PDFDocument.load.mockResolvedValue(mockDoc);

      const result = await getPageDimensions(mockPdfBytes, 0);

      expect(result).toEqual({
        width: 612,
        height: 792,
        rotation: 0,
      });
    });
  });
});
