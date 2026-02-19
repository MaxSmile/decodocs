import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import App from './App.jsx';
import { useAuth } from './AuthContext.jsx';

vi.mock('./AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth;

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('App auth gating', () => {
  it('redirects signed-out users to login', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'signed_out', user: null, error: null },
      isAdmin: () => false,
      signIn: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/');
    expect(await screen.findByText('Sign in with email/password.')).toBeInTheDocument();
  });

  it('shows access denied for signed-in non-admin users', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'signed_in', user: { email: 'user@example.com' }, error: null },
      isAdmin: () => false,
      signIn: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/');
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('allows signed-in admin users into dashboard', async () => {
    mockUseAuth.mockReturnValue({
      state: { status: 'signed_in', user: { email: 'admin@snapsign.com.au' }, error: null },
      isAdmin: () => true,
      signIn: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/');
    expect(await screen.findByText('DecoDocs Admin')).toBeInTheDocument();
    expect(await screen.findByText('Edit admin/stripe')).toBeInTheDocument();
  });
});
