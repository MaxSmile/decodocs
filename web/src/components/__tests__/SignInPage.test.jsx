import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

const mockAuthApi = {
  authState: { status: 'idle', user: null },
  auth: { currentUser: null },
  signInWithGoogle: vi.fn(),
  signInWithMicrosoft: vi.fn(),
  signInWithApple: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
};

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => mockAuthApi,
}));

const { trackAuthEventMock } = vi.hoisted(() => ({
  trackAuthEventMock: vi.fn(),
}));

vi.mock('../../lib/authTelemetry.js', () => ({
  trackAuthEvent: trackAuthEventMock,
}));

import SignInPage from '../SignInPage.jsx';
import { MemoryRouter } from 'react-router-dom';

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthApi.authState = { status: 'idle', user: null };
    mockAuthApi.auth = { currentUser: null };
    mockAuthApi.signInWithGoogle.mockResolvedValue(undefined);
    mockAuthApi.signInWithMicrosoft.mockResolvedValue(undefined);
    mockAuthApi.signInWithApple.mockResolvedValue(undefined);
    mockAuthApi.signInWithEmail.mockResolvedValue(undefined);
    mockAuthApi.signUpWithEmail.mockResolvedValue(undefined);
    mockAuthApi.resetPassword.mockResolvedValue(undefined);
  });

  it('shows error when attempting email sign-in with empty fields', async () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(btn);

    // status message should appear
    const err = await screen.findByText(/Email and password are required\./i);
    expect(err).toBeTruthy();
  });

  it('tracks Google button click and success', async () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await screen.findByText(/signed in\. your accounts are linked\./i);
    expect(mockAuthApi.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(trackAuthEventMock).toHaveBeenCalledWith('auth_google_click');
    expect(trackAuthEventMock).toHaveBeenCalledWith('auth_google_success');
  });

  it('shows mapped provider errors and tracks Google error', async () => {
    mockAuthApi.signInWithGoogle.mockRejectedValue({
      code: 'auth/popup-blocked',
      message: 'Popup blocked by browser',
    });

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await screen.findByText(/browser blocked the sign-in popup/i);
    expect(trackAuthEventMock).toHaveBeenCalledWith('auth_google_click');
    expect(trackAuthEventMock).toHaveBeenCalledWith(
      'auth_google_error',
      expect.objectContaining({ auth_error_code: 'auth/popup-blocked' })
    );
  });
});
