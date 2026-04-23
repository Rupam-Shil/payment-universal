import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { razorpayServer } from '../../../src/gateways/razorpay/server';
import { GatewayApiError, VerificationError } from '../../../src/core';

const KEY_ID = 'rzp_test_123';
const KEY_SECRET = 'secret_abc';

function makeFetchMock(impl: typeof fetch): typeof fetch {
  return vi.fn(impl) as unknown as typeof fetch;
}

describe('razorpayServer.createOrder', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock(async () => new Response('{}', { status: 500 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /v1/orders with Basic auth and JSON body', async () => {
    const captured: { url?: RequestInfo | URL; init?: RequestInit } = {};
    vi.stubGlobal(
      'fetch',
      makeFetchMock(async (url, init) => {
        captured.url = url;
        captured.init = init;
        return new Response(
          JSON.stringify({
            id: 'order_Abc',
            entity: 'order',
            amount: 49900,
            amount_paid: 0,
            amount_due: 49900,
            currency: 'INR',
            receipt: 'rcpt_1',
            status: 'created',
            attempts: 0,
            notes: {},
            created_at: 1_700_000_000,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      receipt: 'rcpt_1',
      notes: { purpose: 'course-fee' },
    });

    expect(captured.url).toBe('https://api.razorpay.com/v1/orders');
    expect(captured.init?.method).toBe('POST');
    const headers = new Headers(captured.init?.headers);
    expect(headers.get('content-type')).toBe('application/json');
    const expectedAuth = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(JSON.parse(String(captured.init?.body))).toEqual({
      amount: 49900,
      currency: 'INR',
      receipt: 'rcpt_1',
      notes: { purpose: 'course-fee' },
      payment_capture: 1,
    });

    expect(order).toMatchObject({
      id: 'order_Abc',
      amount: 49900,
      currency: 'INR',
      status: 'created',
      gateway: 'razorpay',
      clientPayload: { key: KEY_ID, order_id: 'order_Abc', amount: 49900, currency: 'INR' },
    });
    expect(order.raw).toBeDefined();
  });

  it('wraps non-2xx responses in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock(
        async () =>
          new Response(JSON.stringify({ error: { description: 'Amount must be at least 100' } }), {
            status: 400,
          }),
      ),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(
      adapter.createOrder({ amount: 1, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('razorpayServer.verifyPayment', () => {
  it('verifies signature correctly', async () => {
    const crypto = await import('node:crypto');
    const orderId = 'order_Abc';
    const paymentId = 'pay_Xyz';
    const signature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    vi.stubGlobal(
      'fetch',
      makeFetchMock(
        async () =>
          new Response(
            JSON.stringify({
              id: paymentId,
              entity: 'payment',
              amount: 49900,
              currency: 'INR',
              status: 'captured',
              order_id: orderId,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    const result = await adapter.verifyPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    expect(result).toEqual({
      verified: true,
      orderId,
      paymentId,
      amount: 49900,
      status: 'paid',
      gateway: 'razorpay',
    });
    vi.unstubAllGlobals();
  });

  it('throws VerificationError on bad signature', async () => {
    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(
      adapter.verifyPayment({
        razorpay_order_id: 'order_Abc',
        razorpay_payment_id: 'pay_Xyz',
        razorpay_signature: 'not-a-real-signature',
      }),
    ).rejects.toBeInstanceOf(VerificationError);
  });

  it('throws VerificationError on missing fields', async () => {
    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(adapter.verifyPayment({})).rejects.toBeInstanceOf(VerificationError);
  });
});
