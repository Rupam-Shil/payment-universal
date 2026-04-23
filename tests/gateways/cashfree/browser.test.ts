import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cashfreeBrowser } from '../../../src/gateways/cashfree/browser';
import { CheckoutDismissedError } from '../../../src/core';

interface CashfreeClient {
  checkout: (opts: { paymentSessionId: string; redirectTarget: string }) =>
    Promise<{ error?: { message?: string }; paymentDetails?: unknown; redirect?: boolean }>;
}

function stubCashfree(impl: CashfreeClient['checkout']): { calls: Array<Parameters<CashfreeClient['checkout']>[0]> } {
  const calls: Array<Parameters<CashfreeClient['checkout']>[0]> = [];
  const Factory = vi.fn((_config: { mode: string }) => ({
    checkout: (opts: Parameters<CashfreeClient['checkout']>[0]) => {
      calls.push(opts);
      return impl(opts);
    },
  }));
  (window as unknown as { Cashfree?: typeof Factory }).Cashfree = Factory;
  return { calls };
}

describe('cashfreeBrowser', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
    delete (window as unknown as { Cashfree?: unknown }).Cashfree;
  });
  afterEach(() => {
    delete (window as unknown as { Cashfree?: unknown }).Cashfree;
  });

  it('capabilities reports modal + redirect', () => {
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    expect(adapter.capabilities.modal).toBe(true);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode: passes payment_session_id and resolves success', async () => {
    const stub = stubCashfree(async () => ({ paymentDetails: { paymentStatus: 'SUCCESS' } }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    const result = await adapter.openCheckout({
      order: {
        id: 'order_1',
        amount: 100,
        currency: 'INR',
        status: 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: 'sess_1' },
        raw: {},
      },
      mode: 'modal',
    });

    expect(stub.calls[0]).toMatchObject({
      paymentSessionId: 'sess_1',
      redirectTarget: '_modal',
    });
    expect(result.status).toBe('success');
    expect(result.orderId).toBe('order_1');
  });

  it('modal mode: user-dropped / error rejects with CheckoutDismissedError', async () => {
    stubCashfree(async () => ({ error: { message: 'user dropped' } }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    await expect(
      adapter.openCheckout({
        order: {
          id: 'order_1',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'cashfree',
          clientPayload: { payment_session_id: 'sess_1' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(CheckoutDismissedError);
  });

  it('redirect mode: invokes checkout with redirectTarget _self', async () => {
    const stub = stubCashfree(async () => ({ redirect: true }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    void adapter.openCheckout({
      order: {
        id: 'order_1',
        amount: 100,
        currency: 'INR',
        status: 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: 'sess_1' },
        raw: {},
      },
      mode: 'redirect',
      returnUrl: 'https://merchant.test/return',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(stub.calls[0]).toMatchObject({
      paymentSessionId: 'sess_1',
      redirectTarget: '_self',
    });
  });
});
