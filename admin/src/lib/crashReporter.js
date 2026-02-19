import { httpsCallable } from 'firebase/functions';

class CrashReporter {
  constructor() {
    this.functions = null;
    this.source = 'admin';
    this.installed = false;
    this.queue = [];
    this.lastSentByKey = new Map();
  }

  configure({ functions, source = 'admin' } = {}) {
    if (functions) this.functions = functions;
    this.source = source || this.source;
    void this.flushQueue();
  }

  installGlobalHandlers() {
    if (this.installed || typeof window === 'undefined') return;
    this.installed = true;

    window.addEventListener('error', (event) => {
      void this.report({
        eventType: 'window_error',
        message: event?.message || 'Unhandled window error',
        error: event?.error || null,
        extra: {
          filename: event?.filename || null,
          lineno: event?.lineno || null,
          colno: event?.colno || null,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event?.reason;
      const isError = reason instanceof Error;
      void this.report({
        eventType: 'unhandled_rejection',
        message: isError ? reason.message : String(reason || 'Unhandled promise rejection'),
        error: isError ? reason : null,
        extra: {
          reason: isError ? null : String(reason || ''),
        },
      });
    });
  }

  reportReactError(error, errorInfo) {
    return this.report({
      eventType: 'react_error_boundary',
      message: error?.message || 'React error boundary caught an error',
      error,
      extra: {
        componentStack: errorInfo?.componentStack || null,
      },
    });
  }

  async flushQueue() {
    if (!this.functions || this.queue.length === 0) return;
    const buffered = [...this.queue];
    this.queue = [];
    for (const payload of buffered) {
      await this.send(payload);
    }
  }

  async report({ eventType, message, error = null, extra = null }) {
    const payload = {
      source: this.source,
      eventType: String(eventType || 'unknown').slice(0, 80),
      message: String(message || 'Unknown client error').slice(0, 5000),
      errorName: error?.name || null,
      stack: error?.stack || null,
      pageUrl: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      extra: extra || null,
    };

    if (this.isDuplicate(payload)) return;

    if (!this.functions) {
      this.queue.push(payload);
      if (this.queue.length > 20) this.queue.shift();
      return;
    }

    await this.send(payload);
  }

  isDuplicate(payload) {
    const key = `${payload.eventType}|${payload.message}|${payload.pageUrl || ''}`;
    const now = Date.now();
    const last = this.lastSentByKey.get(key) || 0;
    if (now - last < 5000) return true;
    this.lastSentByKey.set(key, now);
    return false;
  }

  async send(payload) {
    if (!this.functions) return;
    try {
      const fn = httpsCallable(this.functions, 'submitClientCrash');
      await fn(payload);
    } catch (error) {
      console.error('Admin crash reporter failed to submit', error);
    }
  }
}

export const crashReporter = new CrashReporter();
