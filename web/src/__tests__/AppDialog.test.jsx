import { describe, test, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AppDialog from '../components/ui/AppDialog.jsx';

describe('AppDialog component', () => {
  test('renders nothing when dialog prop is null', () => {
    const { container } = render(<AppDialog dialog={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays title, message and buttons when provided', () => {
    const dialog = {
      title: 'Pro required',
      message: 'Upgrade to unlock OCR',
      primaryLabel: 'Upgrade',
      secondaryLabel: 'Cancel',
    };
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { getByText } = render(
      <AppDialog dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(getByText('Pro required')).toBeTruthy();
    expect(getByText('Upgrade to unlock OCR')).toBeTruthy();

    const primary = getByText('Upgrade');
    const secondary = getByText('Cancel');

    fireEvent.click(primary);
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(secondary);
    expect(onCancel).toHaveBeenCalled();
  });
});
