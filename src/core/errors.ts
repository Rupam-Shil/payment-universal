import type { GatewayName } from './types';

export interface PaymentErrorOptions {
  code: string;
  gateway?: GatewayName;
  cause?: unknown;
}

export class PaymentError extends Error {
  public readonly code: string;
  public readonly gateway?: GatewayName;
  public readonly cause?: unknown;

  constructor(message: string, opts: PaymentErrorOptions) {
    super(message);
    this.name = 'PaymentError';
    this.code = opts.code;
    this.gateway = opts.gateway;
    this.cause = opts.cause;
  }
}

export class CheckoutLoadError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'CheckoutLoadError';
  }
}

export class CheckoutDismissedError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'CheckoutDismissedError';
  }
}

export class UnsupportedModeError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'UnsupportedModeError';
  }
}

export class VerificationError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'VerificationError';
  }
}

export class GatewayApiError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'GatewayApiError';
  }
}
