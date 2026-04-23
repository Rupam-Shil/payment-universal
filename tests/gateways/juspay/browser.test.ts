import { describe, expect, it, vi } from 'vitest';
import { juspayBrowser } from '../../../src/gateways/juspay/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('juspayBrowser', () => {
  it('capabilities: modal false, redirect true', () => {
    const adapter = juspayBrowser();
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError', async () => {
    const adapter = juspayBrowser();
    await expect(
      adapter.openCheckout({
        order: {
          id: 'o',
          amount: 1,
          currency: 'INR',
          status: 'created',
          gateway: 'juspay',
          clientPayload: {},
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode navigates window.location to clientPayload.url', async () => {
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });
    try {
      const adapter = juspayBrowser();
      void adapter.openCheckout({
        order: {
          id: 'ord',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'juspay',
          clientPayload: { url: 'https://api.juspay.in/payments/ord/web' },
          raw: {},
        },
        mode: 'redirect',
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(assignMock).toHaveBeenCalledWith('https://api.juspay.in/payments/ord/web');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }
  });
});
