import { describe, expect, it } from 'vitest';
import {
  CheckoutDismissedError,
  CheckoutLoadError,
  GatewayApiError,
  PaymentError,
  UnsupportedModeError,
  VerificationError,
} from '../../src/core/errors';

describe('PaymentError', () => {
  it('stores code, gateway, and cause', () => {
    const cause = new Error('underlying');
    const err = new PaymentError('boom', {
      code: 'X_FAIL',
      gateway: 'razorpay',
      cause,
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(err.code).toBe('X_FAIL');
    expect(err.gateway).toBe('razorpay');
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('PaymentError');
  });

  it('works without gateway / cause', () => {
    const err = new PaymentError('plain', { code: 'GENERIC' });
    expect(err.gateway).toBeUndefined();
    expect(err.cause).toBeUndefined();
  });
});

describe('specialized error subclasses', () => {
  it.each([
    ['CheckoutLoadError', CheckoutLoadError],
    ['CheckoutDismissedError', CheckoutDismissedError],
    ['UnsupportedModeError', UnsupportedModeError],
    ['VerificationError', VerificationError],
    ['GatewayApiError', GatewayApiError],
  ] as const)('%s extends PaymentError and sets name', (name, Cls) => {
    const err = new Cls('msg', { code: 'C' });
    expect(err).toBeInstanceOf(PaymentError);
    expect(err).toBeInstanceOf(Cls);
    expect(err.name).toBe(name);
  });
});
