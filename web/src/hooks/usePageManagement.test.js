/**
 * Unit tests for usePageManagement hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageManagement } from './usePageManagement.js';

// Mock the pdfPageOperations module
vi.mock('../utils/pdfPageOperations.js', () => ({
  duplicatePage: vi.fn(async (bytes, pageIndex) => {
    // Simulate duplicating a page
    return new Uint8Array([...bytes, 5, 6, 7, 8]);
  }),
  rotatePage: vi.fn(async (bytes, pageIndex, rotation) => {
    // Simulate rotating a page
    return bytes;
  }),
  deletePage: vi.fn(async (bytes, pageIndex) => {
    // Simulate deleting a page
    return new Uint8Array(bytes.slice(0, 2));
  }),
  addBlankPage: vi.fn(async (bytes, insertIndex, options) => {
    // Simulate adding a blank page
    return new Uint8Array([...bytes, 0, 0, 0, 0]);
  }),
  movePage: vi.fn(async (bytes, fromIndex, toIndex) => {
    // Simulate moving a page
    return bytes;
  }),
}));

describe('usePageManagement', () => {
  let mockOnPdfBytesChange;
  let mockOnPageCountChange;
  let mockOnPageChange;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnPdfBytesChange = vi.fn();
    mockOnPageCountChange = vi.fn((updater) => {
      // Return the updated value
      const prev = 3;
      return typeof updater === 'function' ? updater(prev) : updater;
    });
    mockOnPageChange = vi.fn();
  });

  const renderUsePageManagement = (options = {}) => {
    return renderHook(() =>
      usePageManagement({
        onPdfBytesChange: options.onPdfBytesChange || mockOnPdfBytesChange,
        onPageCountChange: options.onPageCountChange || mockOnPageCountChange,
        onPageChange: options.onPageChange || mockOnPageChange,
      })
    );
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderUsePageManagement();

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('setPdfBytes', () => {
    it('should set the PDF bytes reference', () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // The bytes should be set internally (we can't directly check the ref)
      // But we can verify operations work after setting
    });
  });

  describe('duplicatePage', () => {
    it('should duplicate a page and call callbacks', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.duplicatePage(0);
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
      expect(mockOnPageCountChange).toHaveBeenCalled();
      expect(mockOnPageChange).toHaveBeenCalledWith(2); // pageIndex + 2
    });

    it('should throw error if no PDF is loaded', async () => {
      const { result } = renderUsePageManagement();

      await expect(
        act(async () => {
          await result.current.duplicatePage(0);
        })
      ).rejects.toThrow('No PDF loaded');
    });
  });

  describe('rotatePage', () => {
    it('should rotate a page by default 90 degrees', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.rotatePage(0);
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
    });

    it('should rotate a page by custom rotation value', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.rotatePage(0, 180);
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
    });
  });

  describe('deletePage', () => {
    it('should delete a page and call callbacks', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.deletePage(0);
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
      expect(mockOnPageCountChange).toHaveBeenCalled();
    });
  });

  describe('addPage', () => {
    it('should add a blank page and call callbacks', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.addPage(0);
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
      expect(mockOnPageCountChange).toHaveBeenCalled();
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should add a page with custom dimensions', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      await act(async () => {
        await result.current.addPage(0, { width: 800, height: 600 });
      });

      expect(mockOnPdfBytesChange).toHaveBeenCalled();
    });
  });

  describe('undo/redo', () => {
    it('should support undo after an operation', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // Perform an operation
      await act(async () => {
        await result.current.rotatePage(0);
      });

      // Undo should be available
      expect(result.current.canUndo).toBe(true);

      // Perform undo
      const undoResult = await act(async () => {
        return result.current.undo();
      });

      expect(undoResult).toBe(true);
      expect(mockOnPdfBytesChange).toHaveBeenCalled();
    });

    it('should support redo after undo', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // Perform an operation
      await act(async () => {
        await result.current.rotatePage(0);
      });

      // Undo
      await act(async () => {
        await result.current.undo();
      });

      // Redo should be available
      expect(result.current.canRedo).toBe(true);

      // Perform redo
      const redoResult = await act(async () => {
        return result.current.redo();
      });

      expect(redoResult).toBe(true);
    });

    it('should return false if no undo is available', async () => {
      const { result } = renderUsePageManagement();

      const undoResult = await act(async () => {
        return result.current.undo();
      });

      expect(undoResult).toBe(false);
    });

    it('should return false if no redo is available', async () => {
      const { result } = renderUsePageManagement();

      const redoResult = await act(async () => {
        return result.current.redo();
      });

      expect(redoResult).toBe(false);
    });

    it('should clear redo stack on new operation', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // Perform operation 1
      await act(async () => {
        await result.current.rotatePage(0);
      });

      // Undo
      await act(async () => {
        await result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Perform operation 2
      await act(async () => {
        await result.current.rotatePage(1);
      });

      // Redo should no longer be available
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear undo/redo history', async () => {
      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // Perform an operation
      await act(async () => {
        await result.current.rotatePage(0);
      });

      expect(result.current.canUndo).toBe(true);

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when operation fails', async () => {
      const { duplicatePage } = await import('../utils/pdfPageOperations.js');
      duplicatePage.mockRejectedValueOnce(new Error('Operation failed'));

      const { result } = renderUsePageManagement();
      const testBytes = new Uint8Array([1, 2, 3, 4]);

      act(() => {
        result.current.setPdfBytes(testBytes);
      });

      // The operation should throw the error
      await expect(
        act(async () => {
          await result.current.duplicatePage(0);
        })
      ).rejects.toThrow('Operation failed');
    });
  });
});
