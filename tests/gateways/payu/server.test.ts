import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { payuServer } from '../../../src/gateways/payu/server';
import { VerificationError } from '../../../src/core';

const KEY = 'MERCHANT_KEY';
const SALT = 'MERCHANT_SALT';

function expectedHash(parts: string[]): string {
  return createHash('sha512').update(parts.join('|')).digest('hex');
}

describe('payuServer.createOrder', () => {
  it('returns NormalizedOrder with redirect URL + hash in clientPayload', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: { email: 'a@b.com', name: 'Alice' },
      receipt: 'txn_abc',
      notes: { purpose: 'course' },
    });
    expect(order.gateway).toBe('payu');
    const payload = order.clientPayload as Record<string, string>;
    expect(payload.url).toBe('https://test.payu.in/_payment');
    expect(payload.key).toBe(KEY);
    expect(payload.txnid).toBe('txn_abc');
    expect(payload.amount).toBe('499.00');
    expect(payload.firstname).toBe('Alice');
    expect(payload.email).toBe('a@b.com');
    expect(payload.productinfo).toBe('course');
    // Hash must match PayU's formula exactly
    const parts = [
      KEY, 'txn_abc', '499.00', 'course', 'Alice', 'a@b.com',
      '', '', '', '', '',
      '', '', '', '', '',
      SALT,
    ];
    expect(payload.hash).toBe(expectedHash(parts));
  });
});

describe('payuServer.verifyPayment', () => {
  it('verifies response hash and returns paid status', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });

    // Response hash formula: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const status = 'success';
    const txnid = 'txn_abc';
    const amount = '499.00';
    const productinfo = 'course';
    const firstname = 'Alice';
    const email = 'a@b.com';
    const responseParts = [
      SALT, status,
      '', '', '', '', '', '', '', '', '', '',
      email, firstname, productinfo, amount, txnid, KEY,
    ];
    const responseHash = createHash('sha512').update(responseParts.join('|')).digest('hex');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
    );

    const result = await adapter.verifyPayment({
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid: 'mih_123',
      hash: responseHash,
    });
    expect(result).toMatchObject({
      verified: true,
      orderId: txnid,
      paymentId: 'mih_123',
      amount: 49900,
      status: 'paid',
      gateway: 'payu',
    });
    vi.unstubAllGlobals();
  });

  it('throws VerificationError on bad response hash', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });
    await expect(
      adapter.verifyPayment({
        status: 'success',
        txnid: 'txn_abc',
        amount: '499.00',
        productinfo: 'course',
        firstname: 'Alice',
        email: 'a@b.com',
        mihpayid: 'mih_123',
        hash: 'not-a-hash',
      }),
    ).rejects.toBeInstanceOf(VerificationError);
  });
});
