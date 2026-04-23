import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScriptLoader,
  type ScriptLoader,
} from '../../src/core/loader';
import { CheckoutLoadError } from '../../src/core/errors';

const GATEWAY = 'razorpay' as const;
const URL_A = 'https://example.test/a.js';

function removeAllInjectedScripts(): void {
  document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
}

describe('createScriptLoader', () => {
  let loader: ScriptLoader;
  let ready = false;

  beforeEach(() => {
    ready = false;
    loader = createScriptLoader({
      gateway: GATEWAY,
      defaultUrl: URL_A,
      isReady: () => ready,
    });
    removeAllInjectedScripts();
  });

  afterEach(() => {
    removeAllInjectedScripts();
    vi.useRealTimers();
  });

  it('rejects with CheckoutLoadError in a non-browser env', async () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error simulate SSR
    delete globalThis.document;
    try {
      await expect(loader.load()).rejects.toBeInstanceOf(CheckoutLoadError);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it('resolves immediately when isReady() is already true', async () => {
    ready = true;
    await expect(loader.load()).resolves.toBeUndefined();
    expect(document.querySelector('script[data-payment-universal]')).toBeNull();
  });

  it('injects script, resolves on load when isReady flips true', async () => {
    const p = loader.load();
    // Script should have been appended
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    expect(el).not.toBeNull();
    expect(el.src).toBe(URL_A);
    // Simulate external SDK becoming ready and 'load' event firing
    ready = true;
    el.dispatchEvent(new Event('load'));
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects when script tag fires error', async () => {
    const p = loader.load();
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    el.dispatchEvent(new Event('error'));
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('rejects when script loads but isReady stays false', async () => {
    const p = loader.load();
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    el.dispatchEvent(new Event('load'));
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const p = loader.load({ timeout: 100 });
    vi.advanceTimersByTime(150);
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('is idempotent: same URL returns same promise', () => {
    const p1 = loader.load();
    const p2 = loader.load();
    expect(p1).toBe(p2);
  });

  it('rejects when URL is not https', async () => {
    await expect(loader.load({ scriptUrl: 'http://example.test/x.js' })).rejects.toBeInstanceOf(
      CheckoutLoadError,
    );
  });

  it('rejects when URL is invalid', async () => {
    await expect(loader.load({ scriptUrl: 'not a url' })).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('reuses existing script tag rather than creating a duplicate', async () => {
    // First call injects a script
    const p1 = loader.load();
    expect(document.querySelectorAll('script[data-payment-universal]').length).toBe(1);
    // Reset state to simulate a second loader instance encountering the existing tag
    loader.reset();
    const p2 = loader.load();
    expect(document.querySelectorAll('script[data-payment-universal]').length).toBe(1);
    // Resolve both via the same tag
    ready = true;
    document
      .querySelector<HTMLScriptElement>('script[data-payment-universal]')!
      .dispatchEvent(new Event('load'));
    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBeUndefined();
  });
});
