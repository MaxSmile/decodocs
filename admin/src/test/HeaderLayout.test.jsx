import { describe, test, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App.jsx';

/**
 * Test to ensure admin app headers are NOT sticky per DECISIONS.md
 * Decision: no sticky headers anywhere in the project
 */
describe('Admin App Headers', () => {
  let container;

  beforeEach(() => {
    const { container: c } = render(<App />);
    container = c;
  });

  test('should not have any sticky positioned headers', () => {
    const headers = container.querySelectorAll('header, [role="banner"]');
    
    headers.forEach((header) => {
      const computedStyle = window.getComputedStyle(header);
      const position = computedStyle.position;
      
      expect(position).not.toBe('sticky');
      expect(position).not.toBe('fixed');
    });
  });
});
