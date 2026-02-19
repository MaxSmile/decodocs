const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const pushWhen = (errors, condition, message) => {
  if (condition) errors.push(message);
};

export const validateConfigDoc = (docId, data) => {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(data)) {
    return { errors: ['Config must be a JSON object'], warnings };
  }

  if (docId === 'stripe') {
    if (data.mode !== undefined && data.mode !== 'test' && data.mode !== 'prod') {
      errors.push('mode must be "test" or "prod".');
    }

    pushWhen(errors, data.apiKey !== undefined && !String(data.apiKey).startsWith('sk_'), 'apiKey should start with "sk_".');
    pushWhen(errors, data.publishableKey !== undefined && !String(data.publishableKey).startsWith('pk_'), 'publishableKey should start with "pk_".');
    pushWhen(errors, data.webhookSecret !== undefined && !String(data.webhookSecret).startsWith('whsec_'), 'webhookSecret should start with "whsec_".');

    if (data.successUrl !== undefined && !isHttpUrl(data.successUrl)) {
      errors.push('successUrl must be a valid http(s) URL.');
    }
    if (data.cancelUrl !== undefined && !isHttpUrl(data.cancelUrl)) {
      errors.push('cancelUrl must be a valid http(s) URL.');
    }
    if (data.portalReturnUrl !== undefined && !isHttpUrl(data.portalReturnUrl)) {
      errors.push('portalReturnUrl must be a valid http(s) URL.');
    }

    if (data.priceIds !== undefined && !isPlainObject(data.priceIds)) {
      errors.push('priceIds must be an object.');
    }
    if (isPlainObject(data.priceIds) && Object.keys(data.priceIds).length === 0) {
      warnings.push('priceIds is empty; checkout session creation will fail without prices.');
    }
  }

  if (docId === 'plans') {
    if (!isPlainObject(data.free) && !isPlainObject(data.pro)) {
      warnings.push('Consider defining both free and pro plan objects.');
    }
    const badPlan = Object.entries(data).find(([k, v]) => !k.endsWith('At') && !k.startsWith('_') && !isPlainObject(v));
    if (badPlan) {
      errors.push(`${badPlan[0]} must be an object.`);
    }
  }

  if (docId === 'flags') {
    Object.entries(data).forEach(([k, v]) => {
      if (k.endsWith('At') || k.startsWith('_')) return;
      if (typeof v !== 'boolean') errors.push(`${k} must be true or false.`);
    });
  }

  if (docId === 'policies') {
    if (data.rateLimit !== undefined && !isPlainObject(data.rateLimit)) {
      errors.push('rateLimit must be an object.');
    }
    if (isPlainObject(data.rateLimit) && data.rateLimit.perMinute !== undefined) {
      const perMinute = Number(data.rateLimit.perMinute);
      if (!Number.isFinite(perMinute) || perMinute <= 0) {
        errors.push('rateLimit.perMinute must be a positive number.');
      }
    }
  }

  return { errors, warnings };
};

export const parseAndValidateConfig = (docId, raw) => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return {
      parsed: {},
      jsonError: null,
      ...validateConfigDoc(docId, {}),
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const validation = validateConfigDoc(docId, parsed);
    return { parsed, jsonError: null, ...validation };
  } catch (error) {
    return {
      parsed: null,
      jsonError: error?.message || 'Invalid JSON',
      errors: [],
      warnings: [],
    };
  }
};
