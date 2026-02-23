import { describe, test, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

/**
 * SiteHeader is non-sticky by default.
 * Workspace routes may opt into sticky behavior via the `sticky` prop
 * (used by the document workspace layout).
 */
describe('SiteHeader Component', () => {
  let container;

  beforeEach(() => {
    const { container: c } = render(
      <BrowserRouter>
        <SiteHeader />
      </BrowserRouter>
    );
    container = c;
  });

  test('should render header without sticky positioning', () => {
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    
    const computedStyle = window.getComputedStyle(header);
    const position = computedStyle.position;
    
    // Header must NOT be sticky or fixed
    expect(position).not.toBe('sticky');
    expect(position).not.toBe('fixed');
  });

  test('should NOT have sticky Tailwind class', () => {
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    
    // Verify that sticky class is not present
    const classString = header.className;
    expect(classString).not.toMatch(/sticky/);
  });

  test('should have proper z-index for layering', () => {
    const header = container.querySelector('header');

    // In jsdom, Tailwind utilities are not resolved to computed styles.
    // Assert utility class presence instead of computed z-index.
    expect(header.className).toMatch(/\bz-30\b/);
  });

  test('adds sticky positioning when sticky prop is enabled', () => {
    const { container: container2 } = render(
      <MemoryRouter initialEntries={['/view']}>
        <SiteHeader sticky />
      </MemoryRouter>
    );
    const header = container2.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.className).toMatch(/\bsticky\b/);
    expect(header.className).toMatch(/\btop-0\b/);
  });
});
