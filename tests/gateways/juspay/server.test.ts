import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { juspayServer } from '../../../src/gateways/juspay/server';
import { GatewayApiError } from '../../../src/core';

const API_KEY = 'JP_API_KEY';
const MERCHANT_ID = 'merchant_123';

describe('juspayServer.createOrder', () => {
  let captured: { url?: RequestInfo | URL; init?: RequestInit }[] = [];

  beforeEach(() => {
    captured = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        captured.push({ url, init });
        return new Response(
          JSON.stringify({
            id: 'ord_abc',
            order_id: 'ord_abc',
            merchant_id: MERCHANT_ID,
            amount: 499,
            currency: 'INR',
            status: 'NEW',
            payment_links: { web: 'https://api.juspay.in/payments/ord_abc/web' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /orders with Basic auth and form-encoded body', async () => {
    const adapter = juspayServer({
      apiKey: API_KEY,
      merchantId: MERCHANT_ID,
      mode: 'sandbox',
    });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: { id: 'cust_1', email: 'a@b.com' },
      receipt: 'ord_abc',
    });

    const { url, init } = captured[0];
    expect(url).toBe('https://sandbox.juspay.in/orders');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    const expectedAuth = `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(headers.get('x-merchantid')).toBe(MERCHANT_ID);
    expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    const params = new URLSearchParams(String(init?.body));
    expect(params.get('order_id')).toBe('ord_abc');
    expect(params.get('amount')).toBe('499.00');
    expect(params.get('currency')).toBe('INR');
    expect(params.get('customer_id')).toBe('cust_1');

    expect(order.gateway).toBe('juspay');
    expect(order.clientPayload).toMatchObject({
      url: 'https://api.juspay.in/payments/ord_abc/web',
    });
  });

  it('wraps non-2xx in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":"x"}', { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = juspayServer({ apiKey: API_KEY, merchantId: MERCHANT_ID, mode: 'sandbox' });
    await expect(
      adapter.createOrder({ amount: 1, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('juspayServer.verifyPayment', () => {
  it('GETs /orders/{id} and returns paid when status=CHARGED', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            order_id: 'ord_abc',
            merchant_id: MERCHANT_ID,
            amount: 499,
            currency: 'INR',
            status: 'CHARGED',
            txn_id: 'txn_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );
    const adapter = juspayServer({ apiKey: API_KEY, merchantId: MERCHANT_ID, mode: 'sandbox' });
    const r = await adapter.verifyPayment({ order_id: 'ord_abc' });
    expect(r).toMatchObject({
      verified: true,
      orderId: 'ord_abc',
      paymentId: 'txn_abc',
      amount: 49900,
      status: 'paid',
      gateway: 'juspay',
    });
    vi.unstubAllGlobals();
  });
});
