import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import ConfigEditor from './ConfigEditor.jsx';

const getDocMock = vi.fn();
const setAdminConfigMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'admin/stripe' })),
  getDoc: (...args) => getDocMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => setAdminConfigMock),
}));

vi.mock('../firebase.js', () => ({
  db: {},
  fn: {},
}));

const renderEditor = () =>
  render(
    <MemoryRouter initialEntries={['/config/stripe']}>
      <Routes>
        <Route path="/config/:key" element={<ConfigEditor />} />
      </Routes>
    </MemoryRouter>
  );

describe('ConfigEditor', () => {
  beforeEach(() => {
    getDocMock.mockReset();
    setAdminConfigMock.mockReset();
  });

  it('loads existing config JSON', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: true }),
    });

    renderEditor();
    const textarea = await screen.findByRole('textbox');
    await waitFor(() => {
      expect(textarea.value).toContain('"enableOcr": true');
    });
  });

  it('blocks save when JSON is invalid', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: true }),
    });

    renderEditor();
    const textarea = await screen.findByRole('textbox');

    fireEvent.change(textarea, { target: { value: '{"broken":' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/Invalid JSON/i)).toBeInTheDocument();
    expect(setAdminConfigMock).not.toHaveBeenCalled();
  });

  it('writes config through callable function', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: false }),
    });
    setAdminConfigMock.mockResolvedValue({ data: { ok: true } });

    renderEditor();
    const textarea = await screen.findByRole('textbox');

    fireEvent.change(textarea, { target: { value: '{ "enableOcr": true }' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(setAdminConfigMock).toHaveBeenCalledWith({
        docId: 'stripe',
        config: { enableOcr: true },
        merge: true,
      });
    });
  });
});
