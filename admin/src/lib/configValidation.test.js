import { describe, expect, it } from 'vitest';

import { parseAndValidateConfig, validateConfigDoc } from './configValidation.js';

describe('configValidation', () => {
  it('flags invalid stripe key prefixes', () => {
    const result = validateConfigDoc('stripe', {
      apiKey: 'bad-key',
      publishableKey: 'bad-pk',
      webhookSecret: 'bad-wh',
    });

    expect(result.errors.join(' ')).toContain('apiKey should start with "sk_"');
    expect(result.errors.join(' ')).toContain('publishableKey should start with "pk_"');
    expect(result.errors.join(' ')).toContain('webhookSecret should start with "whsec_"');
  });

  it('parses valid flags config with no errors', () => {
    const result = parseAndValidateConfig('flags', '{"enableOcr":true,"enableTypeSpecificAnalysis":false}');
    expect(result.jsonError).toBeNull();
    expect(result.errors).toHaveLength(0);
  });

  it('returns jsonError for malformed JSON', () => {
    const result = parseAndValidateConfig('plans', '{"free": {"maxPages": 10}');
    expect(result.jsonError).toBeTruthy();
    expect(result.parsed).toBeNull();
  });
});
