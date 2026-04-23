import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { razorpayBrowser } from '../../../src/gateways/razorpay/browser';
import { CheckoutDismissedError, UnsupportedModeError } from '../../../src/core';

interface MockInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  _listeners: Record<string, (payload: unknown) => void>;
  _options: Record<string, unknown>;
}

function stubRazorpay(): { lastInstance: () => MockInstance | null; calls: number } {
  let lastInstance: MockInstance | null = null;
  let calls = 0;

  const Ctor = function (this: MockInstance, options: Record<string, unknown>) {
    calls += 1;
    this._listeners = {};
    this._options = options;
    this.open = vi.fn(() => {
      // trigger handler on next tick to simulate user completing payment
      queueMicrotask(() => {
        const handler = options.handler as
          | ((r: Record<string, string>) => void)
          | undefined;
        handler?.({
          razorpay_order_id: 'order_X',
          razorpay_payment_id: 'pay_Y',
          razorpay_signature: 'sig_Z',
        });
      });
    }) as unknown as MockInstance['open'];
    this.close = vi.fn();
    this.on = vi.fn((event: string, handler: (payload: unknown) => void) => {
      this._listeners[event] = handler;
    });
    lastInstance = this;
  } as unknown as new (opts: Record<string, unknown>) => MockInstance;

  (window as unknown as { Razorpay?: typeof Ctor }).Razorpay = Ctor;
  return { lastInstance: () => lastInstance, calls: 0 /* referenced for shape */ };
}

describe('razorpayBrowser', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  });
  afterEach(() => {
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  });

  it('reports capabilities { modal: true, redirect: true }', () => {
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    expect(adapter.gateway).toBe('razorpay');
    expect(adapter.capabilities.modal).toBe(true);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode: opens Razorpay, resolves with normalized PaymentResult on handler', async () => {
    stubRazorpay();
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    // Bypass script injection by marking loader as ready
    adapter.load = async () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

    const result = await adapter.openCheckout({
      order: {
        id: 'order_X',
        amount: 49900,
        currency: 'INR',
        status: 'created',
        gateway: 'razorpay',
        clientPayload: { key: 'rzp_test_123', order_id: 'order_X', amount: 49900, currency: 'INR' },
        raw: {},
      },
      mode: 'modal',
      prefill: { email: 'a@b.com' },
    });

    expect(result).toEqual({
      status: 'success',
      orderId: 'order_X',
      paymentId: 'pay_Y',
      signature: 'sig_Z',
      gateway: 'razorpay',
      raw: expect.any(Object),
    });
  });

  it('modal dismiss rejects with CheckoutDismissedError', async () => {
    // Stub that does NOT call handler — instead fires modal.ondismiss
    const Ctor = function (this: Record<string, unknown>, options: Record<string, unknown>) {
      this._options = options;
      this.open = () => {
        queueMicrotask(() => {
          const modal = options.modal as { ondismiss?: () => void } | undefined;
          modal?.ondismiss?.();
        });
      };
      this.close = () => {};
      this.on = () => {};
    } as unknown as new (opts: Record<string, unknown>) => unknown;
    (window as unknown as { Razorpay?: typeof Ctor }).Razorpay = Ctor;

    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    adapter.load = async () => {};

    await expect(
      adapter.openCheckout({
        order: {
          id: 'order_X',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: { key: 'rzp_test_123', order_id: 'order_X' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(CheckoutDismissedError);
  });

  it('redirect mode: builds Razorpay hosted checkout URL and assigns window.location', async () => {
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });

    try {
      const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
      adapter.load = async () => {};

      // redirect mode Promise never resolves, so fire-and-check
      void adapter.openCheckout({
        order: {
          id: 'order_X',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: { key: 'rzp_test_123', order_id: 'order_X', amount: 49900, currency: 'INR' },
          raw: {},
        },
        mode: 'redirect',
        returnUrl: 'https://merchant.test/return',
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(assignMock).toHaveBeenCalledTimes(1);
      const url: string = assignMock.mock.calls[0][0];
      expect(url.startsWith('https://api.razorpay.com/v1/checkout/embedded')).toBe(true);
      expect(url).toContain('key_id=rzp_test_123');
      expect(url).toContain('order_id=order_X');
      expect(url).toContain('callback_url=');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }
  });

  it('throws UnsupportedModeError sync when invalid mode is requested', async () => {
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    adapter.load = async () => {};
    await expect(
      adapter.openCheckout({
        order: {
          id: 'o',
          amount: 1,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: {},
          raw: {},
        },
        // @ts-expect-error testing invalid mode
        mode: 'bogus',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });
});
