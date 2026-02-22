import { describe, test, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

/**
 * Test to ensure headers are NOT sticky per DECISIONS.md
 * Decision: no sticky headers anywhere in the project
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

  test('header has explicit static class on /view workspace route', () => {
    const { container: container2 } = render(
      <MemoryRouter initialEntries={['/view']}>
        <SiteHeader />
      </MemoryRouter>
    );
    const header = container2.querySelector('header');
    expect(header).toBeTruthy();
    // jsdom doesn't compute position, but our component should add the
    // `static` tailwind utility on workspace routes
    expect(header.className).toMatch(/\bstatic\b/);
  });

  test('header has explicit static class on /edit workspace route', () => {
    const { container: container3 } = render(
      <MemoryRouter initialEntries={['/edit']}>
        <SiteHeader />
      </MemoryRouter>
    );
    const header = container3.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.className).toMatch(/\bstatic\b/);
  });
});
