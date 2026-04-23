import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeBrowser } from '../../../src/gateways/stripe/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('stripeBrowser', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => vi.restoreAllMocks());

  it('capabilities: modal false, redirect true', () => {
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => null,
    });
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError', async () => {
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => null,
    });
    await expect(
      adapter.openCheckout({
        order: {
          id: 'cs_1',
          amount: 1,
          currency: 'USD',
          status: 'created',
          gateway: 'stripe',
          clientPayload: { sessionId: 'cs_1' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode calls stripe.redirectToCheckout({ sessionId })', async () => {
    const redirectToCheckout = vi.fn(async () => ({ error: null }));
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => ({ redirectToCheckout } as unknown as {
        redirectToCheckout: typeof redirectToCheckout;
      }),
    });
    void adapter.openCheckout({
      order: {
        id: 'cs_abc',
        amount: 100,
        currency: 'USD',
        status: 'created',
        gateway: 'stripe',
        clientPayload: { sessionId: 'cs_abc' },
        raw: {},
      },
      mode: 'redirect',
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(redirectToCheckout).toHaveBeenCalledWith({ sessionId: 'cs_abc' });
  });
});
