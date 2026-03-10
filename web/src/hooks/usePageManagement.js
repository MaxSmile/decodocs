/**
 * usePageManagement Hook
 * 
 * Provides page management functionality for PDF documents including:
 * - Duplicate, rotate, delete, and add pages
 * - Undo/redo support for page operations
 * - State management for page operations
 */

import { useState, useCallback, useRef } from 'react';
import {
  duplicatePage,
  rotatePage,
  deletePage,
  addBlankPage,
  movePage,
} from '../utils/pdfPageOperations';

/**
 * @typedef {Object} PageOperation
 * @property {string} type - Operation type: 'duplicate', 'rotate', 'delete', 'add', 'move'
 * @property {number} pageIndex - The page index affected
 * @property {Object} [data] - Additional data for the operation
 * @property {ArrayBuffer} previousState - PDF bytes before the operation
 */

/**
 * Custom hook for managing PDF page operations
 * @param {Object} options - Hook options
 * @param {Function} options.onPdfBytesChange - Callback when PDF bytes change
 * @param {Function} options.onPageCountChange - Callback when page count changes
 * @param {Function} options.onPageChange - Callback when current page should change
 * @returns {Object} Page management functions and state
 */
export const usePageManagement = ({
  onPdfBytesChange,
  onPageCountChange,
  onPageChange,
} = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Undo/redo stacks
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  
  // Current PDF bytes reference
  const pdfBytesRef = useRef(null);

  /**
   * Set the current PDF bytes for operations
   * @param {ArrayBuffer} bytes - The PDF bytes
   */
  const setPdfBytes = useCallback((bytes) => {
    pdfBytesRef.current = bytes;
  }, []);

  /**
   * Update canUndo and canRedo state based on stack lengths
   */
  const updateStackState = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  /**
   * Execute a page operation with undo support
   * @param {Function} operation - The operation function to execute
   * @param {string} type - Operation type for tracking
   * @param {number} pageIndex - The page index being operated on
   * @param {Object} [data] - Additional operation data
   */
  const executeOperation = useCallback(async (operation, type, pageIndex, data = {}) => {
    if (!pdfBytesRef.current) {
      throw new Error('No PDF loaded');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Save current state for undo
      const previousState = pdfBytesRef.current.slice(0);
      
      // Execute the operation
      const result = await operation(pdfBytesRef.current, pageIndex, data);
      
      // Push to undo stack
      undoStackRef.current.push({
        type,
        pageIndex,
        data,
        previousState,
      });
      
      // Clear redo stack on new operation
      redoStackRef.current = [];
      
      // Update the PDF bytes
      pdfBytesRef.current = result;
      
      // Update stack state
      updateStackState();
      
      // Notify parent of changes
      if (onPdfBytesChange) {
        await onPdfBytesChange(result);
      }
      
      return result;
    } catch (err) {
      console.error(`Page operation failed (${type}):`, err);
      setError(err.message || 'Operation failed');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [onPdfBytesChange, updateStackState]);

  /**
   * Duplicate a page
   * @param {number} pageIndex - The 0-based index of the page to duplicate
   */
  const handleDuplicatePage = useCallback(async (pageIndex) => {
    const result = await executeOperation(
      duplicatePage,
      'duplicate',
      pageIndex
    );
    
    if (onPageCountChange) {
      onPageCountChange(prev => prev + 1);
    }
    
    // Navigate to the new duplicated page (inserted right after original)
    if (onPageChange) {
      onPageChange(pageIndex + 2); // +2 because pageIndex is 0-based and new page is after
    }
    
    return result;
  }, [executeOperation, onPageCountChange, onPageChange]);

  /**
   * Rotate a page
   * @param {number} pageIndex - The 0-based index of the page to rotate
   * @param {number} rotation - Rotation angle (default: 90 degrees clockwise)
   */
  const handleRotatePage = useCallback(async (pageIndex, rotation = 90) => {
    return await executeOperation(
      (bytes, idx) => rotatePage(bytes, idx, rotation),
      'rotate',
      pageIndex,
      { rotation }
    );
  }, [executeOperation]);

  /**
   * Delete a page
   * @param {number} pageIndex - The 0-based index of the page to delete
   */
  const handleDeletePage = useCallback(async (pageIndex) => {
    const result = await executeOperation(
      deletePage,
      'delete',
      pageIndex
    );
    
    if (onPageCountChange) {
      const newCount = await onPageCountChange(prev => Math.max(1, prev - 1));
      
      // Adjust current page if needed
      if (onPageChange) {
        onPageChange(prev => Math.min(prev, newCount));
      }
    }
    
    return result;
  }, [executeOperation, onPageCountChange, onPageChange]);

  /**
   * Add a blank page
   * @param {number} insertIndex - The 0-based index where to insert the page
   * @param {Object} options - Page options (width, height)
   */
  const handleAddPage = useCallback(async (insertIndex, options = {}) => {
    const result = await executeOperation(
      (bytes, idx) => addBlankPage(bytes, idx, options),
      'add',
      insertIndex,
      options
    );
    
    if (onPageCountChange) {
      onPageCountChange(prev => prev + 1);
    }
    
    // Navigate to the new page
    if (onPageChange) {
      onPageChange(insertIndex + 1); // +1 because insertIndex is 0-based
    }
    
    return result;
  }, [executeOperation, onPageCountChange, onPageChange]);

  /**
   * Move a page
   * @param {number} fromIndex - Current page index
   * @param {number} toIndex - Target page index
   */
  const handleMovePage = useCallback(async (fromIndex, toIndex) => {
    return await executeOperation(
      (bytes, from, data) => movePage(bytes, from, data.toIndex),
      'move',
      fromIndex,
      { toIndex }
    );
  }, [executeOperation]);

  /**
   * Undo the last operation
   */
  const undo = useCallback(async () => {
    if (undoStackRef.current.length === 0) return false;
    
    const lastOperation = undoStackRef.current.pop();
    
    // Save current state to redo stack
    redoStackRef.current.push({
      ...lastOperation,
      previousState: pdfBytesRef.current,
    });
    
    // Restore previous state
    pdfBytesRef.current = lastOperation.previousState;
    
    // Update stack state
    updateStackState();
    
    if (onPdfBytesChange) {
      await onPdfBytesChange(lastOperation.previousState);
    }
    
    // Update page count if needed
    if (lastOperation.type === 'duplicate' || lastOperation.type === 'add') {
      if (onPageCountChange) onPageCountChange(prev => prev - 1);
    } else if (lastOperation.type === 'delete') {
      if (onPageCountChange) onPageCountChange(prev => prev + 1);
    }
    
    return true;
  }, [onPdfBytesChange, onPageCountChange, updateStackState]);

  /**
   * Redo the last undone operation
   */
  const redo = useCallback(async () => {
    if (redoStackRef.current.length === 0) return false;
    
    const lastRedo = redoStackRef.current.pop();
    
    // Restore the state
    pdfBytesRef.current = lastRedo.previousState;
    
    // Push back to undo stack
    undoStackRef.current.push(lastRedo);
    
    // Update stack state
    updateStackState();
    
    if (onPdfBytesChange) {
      await onPdfBytesChange(lastRedo.previousState);
    }
    
    // Update page count if needed
    if (lastRedo.type === 'duplicate' || lastRedo.type === 'add') {
      if (onPageCountChange) onPageCountChange(prev => prev + 1);
    } else if (lastRedo.type === 'delete') {
      if (onPageCountChange) onPageCountChange(prev => prev - 1);
    }
    
    return true;
  }, [onPdfBytesChange, onPageCountChange, updateStackState]);

  /**
   * Clear all undo/redo history
   */
  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    updateStackState();
  }, [updateStackState]);

  return {
    // State
    isProcessing,
    error,
    canUndo,
    canRedo,
    
    // PDF bytes management
    setPdfBytes,
    
    // Page operations
    duplicatePage: handleDuplicatePage,
    rotatePage: handleRotatePage,
    deletePage: handleDeletePage,
    addPage: handleAddPage,
    movePage: handleMovePage,
    
    // Undo/redo
    undo,
    redo,
    clearHistory,
  };
};

export default usePageManagement;
