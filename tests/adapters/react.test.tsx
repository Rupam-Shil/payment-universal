import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCheckout } from '../../src/adapters/react/useCheckout';
import { makeFakeBrowserAdapter } from '../test-utils/fakeAdapter';
import type { NormalizedOrder } from '../../src/core';

const ORDER: NormalizedOrder = {
  id: 'order_1',
  amount: 100,
  currency: 'INR',
  status: 'created',
  gateway: 'razorpay',
  clientPayload: {},
  raw: {},
};

describe('useCheckout (React)', () => {
  it('transitions from loading → ready after adapter.load resolves', async () => {
    const adapter = makeFakeBrowserAdapter({ loadDelayMs: 10 });
    const { result } = renderHook(() => useCheckout(adapter));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('open() delegates to adapter.openCheckout and returns the PaymentResult', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { result } = renderHook(() => useCheckout(adapter));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    const payment = await act(async () => result.current.open({ order: ORDER, mode: 'modal' }));
    expect(payment.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
  });

  it('surfaces load errors into `error`', async () => {
    const adapter = makeFakeBrowserAdapter();
    adapter.load = () => Promise.reject(new Error('bad script'));

    const { result } = renderHook(() => useCheckout(adapter));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('bad script');
    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('close() invokes adapter.close()', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { result } = renderHook(() => useCheckout(adapter));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    act(() => result.current.close());
    expect(adapter.closed).toBe(1);
  });
});
