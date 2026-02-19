import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import ConfigEditor from './ConfigEditor.jsx';

// Mock json-edit-react so tests can drive data changes without rendering the full editor tree
vi.mock('json-edit-react', () => ({
  JsonEditor: ({ data, setData }) => (
    <textarea
      data-testid="json-editor"
      value={JSON.stringify(data)}
      onChange={(e) => {
        try { setData(JSON.parse(e.target.value)); } catch (_) {}
      }}
    />
  ),
}));

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

  it('loads existing config into the editor', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: true }),
    });

    renderEditor();
    const editor = await screen.findByTestId('json-editor');
    await waitFor(() => {
      expect(editor.value).toContain('enableOcr');
    });
  });

  it('triggers unsaved changes state when data changes', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: true }),
    });

    renderEditor();
    const editor = await screen.findByTestId('json-editor');
    fireEvent.change(editor, { target: { value: '{"enableOcr": false}' } });
    expect(await screen.findByText(/Unsaved changes/i)).toBeInTheDocument();
  });

  it('writes config through callable function', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ enableOcr: false }),
    });
    setAdminConfigMock.mockResolvedValue({ data: { ok: true } });

    renderEditor();
    const editor = await screen.findByTestId('json-editor');

    fireEvent.change(editor, { target: { value: '{ "enableOcr": true }' } });
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
