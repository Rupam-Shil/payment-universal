import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cashfreeServer } from '../../../src/gateways/cashfree/server';
import { GatewayApiError } from '../../../src/core';

const APP_ID = 'TEST_APP_ID';
const SECRET_KEY = 'TEST_SECRET';

describe('cashfreeServer.createOrder', () => {
  let capturedRequests: Array<{ url: RequestInfo | URL; init?: RequestInit }> = [];

  beforeEach(() => {
    capturedRequests = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        capturedRequests.push({ url, init });
        return new Response(
          JSON.stringify({
            cf_order_id: 12345,
            order_id: 'order_abc',
            entity: 'order',
            order_currency: 'INR',
            order_amount: 499,
            order_status: 'ACTIVE',
            payment_session_id: 'session_xyz',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /pg/orders with the right headers and body', async () => {
    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: {
        id: 'cust_1',
        email: 'a@b.com',
        phone: '+919999999999',
        name: 'Test User',
      },
      receipt: 'rcpt_1',
    });

    expect(capturedRequests).toHaveLength(1);
    const { url, init } = capturedRequests[0];
    expect(url).toBe('https://api.cashfree.com/pg/orders');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('x-client-id')).toBe(APP_ID);
    expect(headers.get('x-client-secret')).toBe(SECRET_KEY);
    expect(headers.get('x-api-version')).toBe('2023-08-01');
    expect(headers.get('content-type')).toBe('application/json');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      order_amount: 499, // smallest-unit 49900 paise → 499 rupees (Cashfree uses major units)
      order_currency: 'INR',
      customer_details: {
        customer_id: 'cust_1',
        customer_email: 'a@b.com',
        customer_phone: '+919999999999',
        customer_name: 'Test User',
      },
    });
    expect(typeof body.order_id).toBe('string');

    expect(order.gateway).toBe('cashfree');
    expect(order.clientPayload).toEqual({ payment_session_id: 'session_xyz' });
  });

  it('wraps non-2xx responses in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'bad' }), { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    await expect(
      adapter.createOrder({ amount: 100, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('cashfreeServer.verifyPayment', () => {
  it('fetches /pg/orders/{id}/payments and returns verified=true on SUCCESS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              cf_payment_id: 'cfp_1',
              order_id: 'order_abc',
              payment_amount: 499,
              payment_currency: 'INR',
              payment_status: 'SUCCESS',
            },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );

    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    const result = await adapter.verifyPayment({ order_id: 'order_abc' });
    expect(result.verified).toBe(true);
    expect(result.orderId).toBe('order_abc');
    expect(result.paymentId).toBe('cfp_1');
    expect(result.status).toBe('paid');
    vi.unstubAllGlobals();
  });
});
