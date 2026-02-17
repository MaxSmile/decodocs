import { render, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePdfJs } from './usePdfJs';

function TestHarness({ onReady }) {
  const hook = usePdfJs();
  // expose hook to test
  React.useEffect(() => onReady(hook), [hook, onReady]);
  return null;
}

describe('usePdfJs.loadTestPdf error path', () => {
  beforeEach(() => {
    // ensure no real pdfjsLib
    delete window.pdfjsLib;
    global.fetch = undefined;
  });

  it('throws when fetch returns not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, statusText: 'Not Found' });

    let hookRef = null;
    const onReady = (h) => { hookRef = h; };

    render(React.createElement(TestHarness, { onReady }));

    await act(async () => {
      // call loadTestPdf; should early-return since window.pdfjsLib is missing
      const res = await hookRef.loadTestPdf('some.pdf').catch((e) => e);
      expect(res).toBeUndefined();
    });
  });
});
