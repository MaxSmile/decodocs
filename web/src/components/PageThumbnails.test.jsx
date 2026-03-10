/**
 * Unit tests for PageThumbnails component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageThumbnails from './PageThumbnails.jsx';

// Mock PDF.js document
const createMockPdfDoc = (pageCount = 3) => ({
  numPages: pageCount,
  getPage: vi.fn(async (pageNum) => ({
    getViewport: vi.fn(({ scale, rotation }) => ({
      width: 612 * scale,
      height: 792 * scale,
      rotation: rotation || 0,
    })),
    render: vi.fn(() => ({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    })),
    rotate: 0,
  })),
  destroy: vi.fn(),
});

describe('PageThumbnails', () => {
  let mockPdfDoc;
  let mockOnPageClick;
  let mockOnDuplicatePage;
  let mockOnRotatePage;
  let mockOnDeletePage;
  let mockOnAddPage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPdfDoc = createMockPdfDoc(3);
    mockOnPageClick = vi.fn();
    mockOnDuplicatePage = vi.fn(async () => {});
    mockOnRotatePage = vi.fn(async () => {});
    mockOnDeletePage = vi.fn(async () => {});
    mockOnAddPage = vi.fn(async () => {});
  });

  const renderPageThumbnails = (props = {}) => {
    return render(
      <PageThumbnails
        pdfDoc={mockPdfDoc}
        numPages={3}
        currentPage={1}
        onPageClick={mockOnPageClick}
        onDuplicatePage={mockOnDuplicatePage}
        onRotatePage={mockOnRotatePage}
        onDeletePage={mockOnDeletePage}
        onAddPage={mockOnAddPage}
        isProcessing={false}
        pageRotations={{}}
        {...props}
      />
    );
  };

  describe('rendering', () => {
    it('should render nothing if no pdfDoc', () => {
      const { container } = renderPageThumbnails({ pdfDoc: null });
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing if no numPages', () => {
      const { container } = renderPageThumbnails({ numPages: null });
      expect(container.firstChild).toBeNull();
    });

    it('should render thumbnails for each page', () => {
      renderPageThumbnails();
      
      // Should have 3 page thumbnails
      const thumbnails = screen.getAllByRole('button', { name: /thumb-/i });
      expect(thumbnails).toHaveLength(3);
    });

    it('should highlight the current page', () => {
      renderPageThumbnails({ currentPage: 2 });
      
      const thumb2 = screen.getByRole('button', { name: 'thumb-2' });
      expect(thumb2.closest('.relative')).toHaveClass('bg-blue-50');
    });

    it('should render Add Page button', () => {
      renderPageThumbnails();
      
      expect(screen.getByText('Add Page')).toBeInTheDocument();
    });

    it('should render collapse button', () => {
      renderPageThumbnails();
      
      expect(screen.getByTitle('Collapse thumbnails')).toBeInTheDocument();
    });
  });

  describe('page navigation', () => {
    it('should call onPageClick when thumbnail is clicked', async () => {
      renderPageThumbnails();
      
      const thumb2 = screen.getByRole('button', { name: 'thumb-2' });
      await userEvent.click(thumb2);
      
      expect(mockOnPageClick).toHaveBeenCalledWith(2);
    });
  });

  describe('fold/unfold mechanism', () => {
    it('should collapse when collapse button is clicked', async () => {
      renderPageThumbnails();
      
      const collapseBtn = screen.getByTitle('Collapse thumbnails');
      await userEvent.click(collapseBtn);
      
      // Should show collapsed sidebar with expand button
      expect(screen.getByTitle('Expand thumbnails')).toBeInTheDocument();
    });

    it('should expand when expand button is clicked', async () => {
      renderPageThumbnails();
      
      // Collapse first
      const collapseBtn = screen.getByTitle('Collapse thumbnails');
      await userEvent.click(collapseBtn);
      
      // Then expand
      const expandBtn = screen.getByTitle('Expand thumbnails');
      await userEvent.click(expandBtn);
      
      // Should show full thumbnails again
      expect(screen.getByTitle('Collapse thumbnails')).toBeInTheDocument();
    });

    it('should show page indicator when collapsed', async () => {
      renderPageThumbnails({ currentPage: 2, numPages: 5 });
      
      // Collapse
      const collapseBtn = screen.getByTitle('Collapse thumbnails');
      await userEvent.click(collapseBtn);
      
      // Should show current page indicator
      expect(screen.getByText(/2.*5/)).toBeInTheDocument();
    });
  });

  describe('page actions', () => {
    it('should show action buttons on hover', async () => {
      renderPageThumbnails();
      
      const thumb1 = screen.getByRole('button', { name: 'thumb-1' }).closest('.relative');
      
      // Simulate hover
      fireEvent.mouseEnter(thumb1);
      
      // Action buttons should appear
      await waitFor(() => {
        expect(screen.getByTitle('Duplicate page')).toBeInTheDocument();
        expect(screen.getByTitle('Rotate 90° clockwise')).toBeInTheDocument();
        expect(screen.getByTitle('Delete page')).toBeInTheDocument();
      });
    });

    it('should call onDuplicatePage when duplicate is clicked', async () => {
      renderPageThumbnails();
      
      const thumb1 = screen.getByRole('button', { name: 'thumb-1' }).closest('.relative');
      fireEvent.mouseEnter(thumb1);
      
      await waitFor(() => {
        expect(screen.getByTitle('Duplicate page')).toBeInTheDocument();
      });
      
      const duplicateBtn = screen.getByTitle('Duplicate page');
      await userEvent.click(duplicateBtn);
      
      expect(mockOnDuplicatePage).toHaveBeenCalledWith(0);
    });

    it('should call onRotatePage when rotate is clicked', async () => {
      renderPageThumbnails();
      
      const thumb2 = screen.getByRole('button', { name: 'thumb-2' }).closest('.relative');
      fireEvent.mouseEnter(thumb2);
      
      await waitFor(() => {
        expect(screen.getByTitle('Rotate 90° clockwise')).toBeInTheDocument();
      });
      
      const rotateBtn = screen.getByTitle('Rotate 90° clockwise');
      await userEvent.click(rotateBtn);
      
      expect(mockOnRotatePage).toHaveBeenCalledWith(1);
    });

    it('should require confirmation for delete', async () => {
      renderPageThumbnails();
      
      const thumb1 = screen.getByRole('button', { name: 'thumb-1' }).closest('.relative');
      fireEvent.mouseEnter(thumb1);
      
      await waitFor(() => {
        expect(screen.getByTitle('Delete page')).toBeInTheDocument();
      });
      
      const deleteBtn = screen.getByTitle('Delete page');
      
      // First click - should show confirmation
      await userEvent.click(deleteBtn);
      expect(mockOnDeletePage).not.toHaveBeenCalled();
      
      // Second click - should confirm delete
      await userEvent.click(deleteBtn);
      expect(mockOnDeletePage).toHaveBeenCalledWith(0);
    });

    it('should disable delete button for single page document', async () => {
      renderPageThumbnails({ numPages: 1 });
      
      const thumb1 = screen.getByRole('button', { name: 'thumb-1' }).closest('.relative');
      fireEvent.mouseEnter(thumb1);
      
      await waitFor(() => {
        expect(screen.getByTitle('Delete page')).toBeInTheDocument();
      });
      
      const deleteBtn = screen.getByTitle('Delete page');
      expect(deleteBtn).toBeDisabled();
    });
  });

  describe('add page', () => {
    it('should call onAddPage when Add Page button is clicked', async () => {
      renderPageThumbnails();
      
      const addBtn = screen.getByText('Add Page').closest('button');
      await userEvent.click(addBtn);
      
      expect(mockOnAddPage).toHaveBeenCalledWith(3); // numPages
    });

    it('should disable Add Page button when processing', async () => {
      renderPageThumbnails({ isProcessing: true });
      
      const addBtn = screen.getByText('Add Page').closest('button');
      expect(addBtn).toBeDisabled();
    });
  });

  describe('processing state', () => {
    it('should disable buttons when processing', async () => {
      renderPageThumbnails({ isProcessing: true });
      
      const thumb1 = screen.getByRole('button', { name: 'thumb-1' });
      expect(thumb1).toBeDisabled();
    });
  });

  describe('page rotations', () => {
    it('should apply rotation to thumbnail rendering', async () => {
      const pageRotations = { 1: 90 };
      renderPageThumbnails({ pageRotations });
      
      // The rotation should be passed to getViewport
      await waitFor(() => {
        expect(mockPdfDoc.getPage).toHaveBeenCalled();
      });
    });
  });
});
