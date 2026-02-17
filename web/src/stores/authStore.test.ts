import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type LoadOptions = {
  mockAuth?: boolean;
  mockAuthUser?: any;
  windowUndefined?: boolean;
  existingApp?: boolean;
  getAuthThrows?: boolean;
  getAuthThrowsNonError?: boolean;
  authModuleNull?: boolean;
  onAuthStateChangedImpl?: (next: (u: any) => void, onError: (e: Error) => void) => void;
  signInAnonymouslyReject?: boolean;
  signInAnonymouslyRejectNonError?: boolean;
};

const originalWindow = globalThis.window;

async function loadStore(options: LoadOptions = {}) {
  vi.resetModules();
  vi.clearAllMocks();

  const app = { name: 'mock-app' };
  const auth = { name: 'mock-auth' };

  const firebaseAppModule = {
    getApps: vi.fn(() => (options.existingApp ? [app] : [])),
    initializeApp: vi.fn(() => app),
    getApp: vi.fn(() => app),
  };

  const firebaseAuthModule = {
    getAuth: vi.fn(() => {
      if (options.getAuthThrowsNonError) throw 'non-error-auth-failure';
      if (options.getAuthThrows) throw new Error('getAuth failed');
      return auth;
    }),
    onAuthStateChanged: vi.fn((authArg: any, next: (u: any) => void, onError: (e: Error) => void) => {
      if (options.onAuthStateChangedImpl) {
        options.onAuthStateChangedImpl(next, onError);
      }
      return () => {};
    }),
    signInAnonymously: vi.fn(async () => {
      if (options.signInAnonymouslyRejectNonError) throw 'anon-non-error';
      if (options.signInAnonymouslyReject) throw new Error('anon failed');
      return { user: { uid: 'anon-user', isAnonymous: true } };
    }),
    signInWithPopup: vi.fn(async (...args: any[]) => ({ provider: args[1] })),
    signInWithEmailAndPassword: vi.fn(async (_auth: any, email: string) => ({ user: { email } })),
    createUserWithEmailAndPassword: vi.fn(async (_auth: any, email: string) => ({ user: { email } })),
    sendPasswordResetEmail: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    connectAuthEmulator: vi.fn(),
    GoogleAuthProvider: class GoogleAuthProvider {},
    OAuthProvider: class OAuthProvider {
      id: string;
      constructor(id: string) {
        this.id = id;
      }
    },
  };

  vi.doMock('firebase/app', () => firebaseAppModule);
  vi.doMock('firebase/auth', () => (
    options.authModuleNull
      ? { onAuthStateChanged: undefined }
      : firebaseAuthModule
  ));

  if (options.windowUndefined) {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  } else {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    (window as any).MOCK_AUTH = options.mockAuth === true;
    if (options.mockAuthUser !== undefined) {
      (window as any).MOCK_AUTH_USER = options.mockAuthUser;
    } else {
      delete (window as any).MOCK_AUTH_USER;
    }
  }

  const store = await import('./authStore');
  return { store, firebaseAppModule, firebaseAuthModule, app, auth };
}

describe('authStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    if (globalThis.window) {
      delete (window as any).MOCK_AUTH;
      delete (window as any).MOCK_AUTH_USER;
    }
  });

  it('exposes default snapshots and testable placeholder helper', async () => {
    const { store } = await loadStore();
    expect(store.getAuthStateSnapshot()).toEqual({
      status: 'pending',
      user: null,
      error: null,
    });
    expect(store.getFirebaseSnapshot()).toEqual({ app: null, auth: null });
    expect(store.__testables.isProbablyPlaceholder(undefined)).toBe(true);
    expect(store.__testables.isProbablyPlaceholder('your_key_here')).toBe(true);
    expect(store.__testables.isProbablyPlaceholder('replace_me_please')).toBe(true);
    expect(store.__testables.isProbablyPlaceholder('changeme')).toBe(true);
    expect(store.__testables.isProbablyPlaceholder('real-value')).toBe(false);
    expect(store.__testables.isTruthyEnvFlag('true')).toBe(true);
    expect(store.__testables.isTruthyEnvFlag('0')).toBe(false);
    expect(store.__testables.getFirebaseConfig().projectId).toBe('snapsign-au');
  });

  it('connects auth emulator when VITE_USE_FIREBASE_EMULATOR=true', async () => {
    vi.stubEnv('VITE_USE_FIREBASE_EMULATOR', 'true');
    vi.stubEnv('VITE_FIREBASE_AUTH_EMULATOR_URL', 'http://localhost:9199');

    const { store, firebaseAuthModule, auth } = await loadStore({
      onAuthStateChangedImpl: (next) => next({ uid: 'emulator-user', isAnonymous: false }),
    });
    await store.startAuthWatcher();

    expect(store.__testables.shouldUseAuthEmulator()).toBe(true);
    expect(store.__testables.getAuthEmulatorUrl()).toBe('http://localhost:9199');
    expect(firebaseAuthModule.connectAuthEmulator).toHaveBeenCalledWith(auth, 'http://localhost:9199', {
      disableWarnings: true,
    });
  });

  it('returns early when watcher already started or window is undefined', async () => {
    const { store, firebaseAuthModule } = await loadStore({
      onAuthStateChangedImpl: (next) => next({ uid: 'u1' }),
    });

    await store.startAuthWatcher();
    await store.startAuthWatcher();
    expect(firebaseAuthModule.onAuthStateChanged).toHaveBeenCalledTimes(1);

    const { store: noWindowStore } = await loadStore({ windowUndefined: true });
    await expect(noWindowStore.startAuthWatcher()).resolves.toBeUndefined();
  });

  it('handles MOCK_AUTH mode with default and explicit null user', async () => {
    const { store: mockDefault } = await loadStore({ mockAuth: true });
    await mockDefault.startAuthWatcher();
    expect(mockDefault.getAuthStateSnapshot().status).toBe('authenticated');
    expect(mockDefault.getAuthStateSnapshot().user?.uid).toBe('test-user');

    const { store: mockNull } = await loadStore({ mockAuth: true, mockAuthUser: null });
    await mockNull.startAuthWatcher();
    expect(mockNull.getAuthStateSnapshot().status).toBe('unauthenticated');
    expect(mockNull.getAuthStateSnapshot().user).toBeNull();
  });

  it('initializes firebase app/auth and processes auth state callbacks', async () => {
    const { store, firebaseAppModule, firebaseAuthModule } = await loadStore({
      onAuthStateChangedImpl: (next) => next({ uid: 'real-user', isAnonymous: false }),
    });
    await store.startAuthWatcher();

    expect(firebaseAppModule.initializeApp).toHaveBeenCalledTimes(1);
    expect(firebaseAuthModule.getAuth).toHaveBeenCalledTimes(1);
    expect(store.getAuthStateSnapshot().status).toBe('authenticated');
    expect(store.getAuthStateSnapshot().user?.uid).toBe('real-user');
    expect(store.getFirebaseSnapshot().app).toBeTruthy();
    expect(store.getFirebaseSnapshot().auth).toBeTruthy();
  });

  it('uses getApp branch when firebase already has initialized apps', async () => {
    const { store, firebaseAppModule } = await loadStore({
      existingApp: true,
      onAuthStateChangedImpl: (next) => next({ uid: 'existing-app-user' }),
    });
    await store.startAuthWatcher();
    expect(firebaseAppModule.initializeApp).not.toHaveBeenCalled();
    expect(firebaseAppModule.getApp).toHaveBeenCalledTimes(1);
  });

  it('reuses existing app/auth stores and signs in anonymously when no user', async () => {
    const { store, firebaseAuthModule, app, auth } = await loadStore({
      onAuthStateChangedImpl: (next) => next(null),
    });
    store.firebaseAppStore.set(app);
    store.firebaseAuthStore.set(auth);

    await store.startAuthWatcher();

    expect(firebaseAuthModule.getAuth).not.toHaveBeenCalled();
    expect(firebaseAuthModule.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(store.getAuthStateSnapshot().status).toBe('authenticated');
    expect(store.getAuthStateSnapshot().user?.uid).toBe('anon-user');
  });

  it('handles anonymous sign-in failure and auth listener error callback', async () => {
    const { store: anonFailStore } = await loadStore({
      signInAnonymouslyReject: true,
      onAuthStateChangedImpl: (next) => next(null),
    });
    await anonFailStore.startAuthWatcher();
    expect(anonFailStore.getAuthStateSnapshot().status).toBe('error');
    expect(anonFailStore.getAuthStateSnapshot().error?.message).toContain('anon failed');

    const authListenerError = new Error('listener failed');
    const { store: listenerErrStore } = await loadStore({
      onAuthStateChangedImpl: (_next, onError) => onError(authListenerError),
    });
    await listenerErrStore.startAuthWatcher();
    expect(listenerErrStore.getAuthStateSnapshot()).toEqual({
      status: 'error',
      user: null,
      error: authListenerError,
    });

    const { store: nonErrorAnonStore } = await loadStore({
      signInAnonymouslyRejectNonError: true,
      onAuthStateChangedImpl: (next) => next(null),
    });
    await nonErrorAnonStore.startAuthWatcher();
    expect(nonErrorAnonStore.getAuthStateSnapshot().status).toBe('error');
    expect(nonErrorAnonStore.getAuthStateSnapshot().error?.message).toBe('Authentication error');
  });

  it('sets error state and throws when firebase auth initialization fails', async () => {
    const { store } = await loadStore({ getAuthThrows: true });
    await expect(store.startAuthWatcher()).rejects.toThrow('Auth is not available');
    expect(store.getAuthStateSnapshot().status).toBe('error');
    expect(store.getAuthStateSnapshot().error?.message).toContain('getAuth failed');

    const { store: nonErrorInitStore } = await loadStore({ getAuthThrowsNonError: true });
    await expect(nonErrorInitStore.startAuthWatcher()).rejects.toThrow('Auth is not available');
    expect(nonErrorInitStore.getAuthStateSnapshot().status).toBe('error');
    expect(nonErrorInitStore.getAuthStateSnapshot().error?.message).toBe('Failed to initialize Firebase Auth');
  });

  it('covers auth-unavailable branches from initialize/getAuthClient/startAuthWatcher', async () => {
    const { store: noWindowStore } = await loadStore({ windowUndefined: true });
    await expect(noWindowStore.authActions.signOutUser()).rejects.toThrow('Auth is not available');

    const { store: missingModuleStore, app, auth } = await loadStore({
      existingApp: true,
      authModuleNull: true,
    });
    missingModuleStore.firebaseAppStore.set(app);
    missingModuleStore.firebaseAuthStore.set(auth);

    await missingModuleStore.startAuthWatcher();
    expect(missingModuleStore.getAuthStateSnapshot().status).toBe('error');
    expect(missingModuleStore.getAuthStateSnapshot().error?.message).toContain('Firebase Auth not available');
  });

  it('routes all auth actions to firebase auth module', async () => {
    const { store, firebaseAuthModule, auth } = await loadStore({
      onAuthStateChangedImpl: (next) => next({ uid: 'user-1' }),
    });

    await store.authActions.signInWithGoogle();
    await store.authActions.signInWithMicrosoft();
    await store.authActions.signInWithApple();
    await store.authActions.signInWithEmail('x@example.com', 'pass-1');
    await store.authActions.signUpWithEmail('y@example.com', 'pass-2');
    await store.authActions.resetPassword('z@example.com');
    await store.authActions.signOutUser();

    expect(firebaseAuthModule.signInWithPopup).toHaveBeenCalledTimes(3);
    expect(firebaseAuthModule.signInWithPopup.mock.calls[0][0]).toBe(auth);
    expect(firebaseAuthModule.signInWithPopup.mock.calls[0][1]).toBeInstanceOf(firebaseAuthModule.GoogleAuthProvider);
    expect(firebaseAuthModule.signInWithPopup.mock.calls[1][1].id).toBe('microsoft.com');
    expect(firebaseAuthModule.signInWithPopup.mock.calls[2][1].id).toBe('apple.com');
    expect(firebaseAuthModule.signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'x@example.com', 'pass-1');
    expect(firebaseAuthModule.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'y@example.com', 'pass-2');
    expect(firebaseAuthModule.sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'z@example.com');
    expect(firebaseAuthModule.signOut).toHaveBeenCalledWith(auth);
  });
});
