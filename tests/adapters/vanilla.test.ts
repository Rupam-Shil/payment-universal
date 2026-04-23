import { describe, expect, it } from 'vitest';
import { PaymentClient } from '../../src/adapters/vanilla/client';
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

describe('PaymentClient (vanilla)', () => {
  it('load() + isReady + open delegates to adapter', async () => {
    const adapter = makeFakeBrowserAdapter();
    const client = new PaymentClient(adapter);
    expect(client.isReady).toBe(false);
    await client.load();
    expect(client.isReady).toBe(true);

    const result = await client.open({ order: ORDER, mode: 'modal' });
    expect(result.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
  });

  it('close() delegates to adapter.close', () => {
    const adapter = makeFakeBrowserAdapter();
    const client = new PaymentClient(adapter);
    client.close();
    expect(adapter.closed).toBe(1);
  });
});
