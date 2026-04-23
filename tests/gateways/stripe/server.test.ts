import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeServer } from '../../../src/gateways/stripe/server';
import { GatewayApiError } from '../../../src/core';

const SECRET = 'sk_test_123';

describe('stripeServer.createOrder', () => {
  let captured: { url?: RequestInfo | URL; init?: RequestInit } = {};

  beforeEach(() => {
    captured = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        captured = { url, init };
        return new Response(
          JSON.stringify({
            id: 'cs_test_abc',
            object: 'checkout.session',
            amount_total: 4999,
            currency: 'usd',
            payment_status: 'unpaid',
            status: 'open',
            payment_intent: null,
            url: 'https://checkout.stripe.com/pay/cs_test_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /v1/checkout/sessions form-encoded with Basic auth', async () => {
    const adapter = stripeServer({ secretKey: SECRET });
    const order = await adapter.createOrder({
      amount: 4999,
      currency: 'USD',
      customer: { email: 'a@b.com' },
    });

    expect(captured.url).toBe('https://api.stripe.com/v1/checkout/sessions');
    const headers = new Headers(captured.init?.headers);
    const expectedAuth = `Basic ${Buffer.from(`${SECRET}:`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    const params = new URLSearchParams(String(captured.init?.body));
    expect(params.get('mode')).toBe('payment');
    expect(params.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('4999');
    expect(params.get('line_items[0][quantity]')).toBe('1');
    expect(params.get('customer_email')).toBe('a@b.com');

    expect(order.id).toBe('cs_test_abc');
    expect(order.clientPayload).toMatchObject({
      sessionId: 'cs_test_abc',
      url: 'https://checkout.stripe.com/pay/cs_test_abc',
    });
  });

  it('wraps non-2xx in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":{"message":"bad"}}', { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = stripeServer({ secretKey: SECRET });
    await expect(
      adapter.createOrder({ amount: 100, currency: 'USD' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('stripeServer.verifyPayment', () => {
  it('retrieves session and returns paid when payment_status=paid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: 'cs_test_abc',
            object: 'checkout.session',
            amount_total: 4999,
            currency: 'usd',
            payment_status: 'paid',
            status: 'complete',
            payment_intent: 'pi_123',
            url: 'https://checkout.stripe.com/pay/cs_test_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );

    const adapter = stripeServer({ secretKey: SECRET });
    const r = await adapter.verifyPayment({ sessionId: 'cs_test_abc' });
    expect(r).toMatchObject({
      verified: true,
      orderId: 'cs_test_abc',
      paymentId: 'pi_123',
      amount: 4999,
      status: 'paid',
      gateway: 'stripe',
    });
    vi.unstubAllGlobals();
  });
});
