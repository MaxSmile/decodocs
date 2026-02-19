class ActionLogger {
  constructor() {
    this.installed = false;
  }

  resolveEnabled() {
    if (typeof window === 'undefined') return false;

    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get('debugClicks');
    if (queryValue === '1') {
      window.localStorage.setItem('dd:debugClicks', '1');
      return true;
    }
    if (queryValue === '0') {
      window.localStorage.setItem('dd:debugClicks', '0');
      return false;
    }

    const persisted = window.localStorage.getItem('dd:debugClicks');
    if (persisted === '0') return false;
    if (persisted === '1') return true;

    // Enable by default for the current development stage.
    return true;
  }

  install() {
    if (this.installed || typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!this.resolveEnabled()) return;
    this.installed = true;

    document.addEventListener(
      'click',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        this.logEvent('click', target);
      },
      { capture: true }
    );

    document.addEventListener(
      'submit',
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        this.logEvent('submit', target);
      },
      { capture: true }
    );
  }

  logEvent(kind, target) {
    const label =
      target.getAttribute('aria-label')
      || target.getAttribute('data-testid')
      || target.getAttribute('name')
      || target.textContent
      || '';

    const payload = {
      kind,
      tag: target.tagName.toLowerCase(),
      id: target.id || null,
      className: (target.className || '').toString().slice(0, 180) || null,
      label: String(label).replace(/\s+/g, ' ').trim().slice(0, 160) || null,
      href: target instanceof HTMLAnchorElement ? target.href : null,
      path: window.location.pathname + window.location.search + window.location.hash,
      ts: new Date().toISOString(),
    };

    console.log('[action-log]', payload);
  }
}

export const actionLogger = new ActionLogger();
