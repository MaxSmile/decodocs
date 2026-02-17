import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePDFRenderer } from './usePDFRenderer';

function HookHarness({ pdfDoc, pageScale = 1, onReady }) {
  const hook = usePDFRenderer(pdfDoc, pageScale);
  React.useEffect(() => onReady(hook), [hook, onReady]);
  return null;
}

const makeCanvas = () => {
  const canvas = document.createElement('canvas');
  const ctx = { clearRect: vi.fn() };
  canvas.getContext = vi.fn(() => ctx);
  return { canvas, ctx };
};

describe('usePDFRenderer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.alert = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns early when pdfDoc/canvas is not available', async () => {
    let hookRef;
    render(React.createElement(HookHarness, { pdfDoc: null, onReady: (h) => { hookRef = h; } }));

    await act(async () => {
      await hookRef.renderPage(1);
    });

    expect(console.error).not.toHaveBeenCalled();
  });

  it('renders page, text layer and annotation overlays including click handlers', async () => {
    const page = {
      getViewport: vi.fn(() => ({
        width: 400,
        height: 600,
        transform: [1, 0, 0, 1, 10, 20],
      })),
      getTextContent: vi.fn(async () => ({
        items: [
          { str: 'Clause A', height: 12, width: 40, transform: [1, 0, 0, 1, 5, 8] },
          { str: 'Clause B', height: 10, width: 30, transform: [1, 0, 0, 1, 15, 18] },
        ],
      })),
      render: vi.fn(() => ({ promise: Promise.resolve() })),
    };

    const pdfDoc = {
      getPage: vi.fn(async () => page),
    };

    let hookRef;
    render(React.createElement(HookHarness, { pdfDoc, onReady: (h) => { hookRef = h; } }));

    const { canvas, ctx } = makeCanvas();
    const textLayer = document.createElement('div');
    const annotations = document.createElement('div');

    hookRef.canvasRef.current = canvas;
    hookRef.textLayerRef.current = textLayer;
    hookRef.annotationsRef.current = annotations;

    const highlights = [{ pageNum: 1, x: 11, y: 22, width: 33, height: 44 }];
    const clauseMarkers = [{ pageNum: 1, x: 50, y: 60, text: 'Termination', details: 'Check termination notice period' }];
    const riskBadges = [
      { pageNum: 1, x: 70, y: 80, level: 'high', description: 'High risk', explanation: 'Pay attention' },
      { pageNum: 1, x: 90, y: 100, level: 'medium', description: 'Medium risk' },
      { pageNum: 1, x: 110, y: 120, level: 'low', description: 'Low risk', explanation: 'Minor issue' },
    ];

    await act(async () => {
      await hookRef.renderPage(1, highlights, clauseMarkers, riskBadges);
    });

    expect(pdfDoc.getPage).toHaveBeenCalledWith(1);
    expect(page.getViewport).toHaveBeenCalledWith({ scale: 1 });
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 600);
    expect(page.render).toHaveBeenCalled();
    expect(textLayer.children.length).toBe(2);
    expect(annotations.querySelectorAll('.highlight-overlay').length).toBe(1);
    expect(annotations.querySelectorAll('.clause-marker').length).toBe(1);
    expect(annotations.querySelectorAll('.risk-badge').length).toBe(3);

    annotations.querySelector('.clause-marker').onclick();
    expect(global.alert).toHaveBeenCalledWith(
      'Clause: Termination\n\nCheck termination notice period'
    );

    const badges = [...annotations.querySelectorAll('.risk-badge')];
    badges[1].onclick();
    expect(global.alert).toHaveBeenCalledWith(
      'Risk: Medium risk\n\nNo explanation available.'
    );
    expect(badges[0].style.backgroundColor).toBe('rgb(220, 53, 69)');
    expect(badges[1].style.backgroundColor).toBe('rgb(253, 126, 20)');
    expect(badges[2].style.backgroundColor).toBe('rgb(255, 193, 7)');

    await act(async () => {
      await hookRef.renderPage(
        1,
        highlights,
        [{ pageNum: 1, x: 12, y: 22, text: 'No details clause' }],
        [{ pageNum: 1, x: 10, y: 10, level: 'low', description: 'Low risk' }]
      );
    });
    annotations.querySelector('.clause-marker').onclick();
    expect(global.alert).toHaveBeenCalledWith(
      'Clause: No details clause\n\nNo details available.'
    );
  });

  it('handles renderTextLayer and renderPage failures gracefully', async () => {
    const textErrorPage = {
      getViewport: vi.fn(() => ({ width: 100, height: 100, transform: [1, 0, 0, 1, 0, 0] })),
      getTextContent: vi.fn(async () => {
        throw new Error('text-layer-failed');
      }),
      render: vi.fn(() => ({ promise: Promise.resolve() })),
    };
    const pdfDoc = { getPage: vi.fn(async () => textErrorPage) };

    let hookRef;
    render(React.createElement(HookHarness, { pdfDoc, onReady: (h) => { hookRef = h; } }));
    const { canvas } = makeCanvas();
    const textLayer = document.createElement('div');
    hookRef.canvasRef.current = canvas;
    hookRef.textLayerRef.current = null; // cover early return in renderTextLayer
    hookRef.annotationsRef.current = null; // cover early return in renderAnnotations

    await act(async () => {
      await hookRef.renderPage(1);
    });

    hookRef.textLayerRef.current = textLayer;
    await act(async () => {
      await hookRef.renderPage(1);
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error rendering text layer:',
      expect.any(Error)
    );

    const failingPdfDoc = {
      getPage: vi.fn(async () => {
        throw new Error('page-failed');
      }),
    };

    render(React.createElement(HookHarness, { pdfDoc: failingPdfDoc, onReady: (h) => { hookRef = h; } }));
    hookRef.canvasRef.current = canvas;

    await act(async () => {
      await hookRef.renderPage(2);
    });
    expect(console.error).toHaveBeenCalledWith(
      'Error rendering page:',
      expect.any(Error)
    );
  });
});
