import { useEffect, useState } from 'react';

// Loads a validation spec JSON from static Hosting assets.
// The JSON currently contains { title, markdown, typeIds, version }.
export function useValidationSpec(validationSlug) {
  const [state, setState] = useState({ status: 'idle', spec: null, error: null });

  useEffect(() => {
    if (!validationSlug) {
      setState({ status: 'idle', spec: null, error: null });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState({ status: 'loading', spec: null, error: null });
      try {
        const resp = await fetch(`/classifications/validation/${validationSlug}.json`, { cache: 'force-cache' });
        if (!resp.ok) throw new Error(`Failed to load validation spec: ${resp.status}`);
        const json = await resp.json();
        if (!cancelled) setState({ status: 'ready', spec: json, error: null });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', spec: null, error: e });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [validationSlug]);

  return state;
}
