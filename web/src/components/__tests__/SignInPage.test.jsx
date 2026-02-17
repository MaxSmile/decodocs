import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

// Mock useAuth
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    authState: { status: 'idle', user: null },
    auth: { currentUser: null },
    signInWithGoogle: vi.fn(),
    signInWithMicrosoft: vi.fn(),
    signInWithApple: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

import SignInPage from '../SignInPage.jsx';
import { MemoryRouter } from 'react-router-dom';

describe('SignInPage', () => {
  beforeEach(() => vi.clearAllMocks());

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
});
