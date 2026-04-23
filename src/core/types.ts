export type GatewayName = 'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe';

export type CheckoutMode = 'modal' | 'redirect';

export interface Capabilities {
  modal: boolean;
  redirect: boolean;
  webhooks: boolean;
  subscriptions: boolean;
  refunds: boolean;
}

export interface CustomerInfo {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface OrderRequest {
  /** Smallest currency unit (paise / cents). */
  amount: number;
  /** ISO 4217 currency code (e.g. "INR", "USD", "EUR"). */
  currency: string;
  customer?: CustomerInfo;
  notes?: Record<string, string>;
  /** Merchant-side reference id. */
  receipt?: string;
}

export interface NormalizedOrder {
  /** Gateway's order / intent / session id. */
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'paid' | 'failed';
  gateway: GatewayName;
  /**
   * Gateway-specific payload the browser adapter needs to launch the checkout.
   * - modal mode: session tokens / keys (e.g. payment_session_id, order_id, key).
   * - redirect mode: includes a `url` field plus any required query params.
   */
  clientPayload: Record<string, unknown>;
  /** Full raw gateway response — escape hatch. */
  raw: unknown;
}

export interface CheckoutOptions {
  order: NormalizedOrder;
  /** Adapter throws UnsupportedModeError synchronously if not supported. */
  mode?: CheckoutMode;
  prefill?: { name?: string; email?: string; phone?: string };
  theme?: { color?: string };
  /** Required when mode === 'redirect'. */
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResult {
  status: 'success' | 'failure' | 'dismissed';
  orderId: string;
  paymentId?: string;
  /** Gateway-specific verification token (signature, hash, etc.) — opaque to the client. */
  signature?: string;
  gateway: GatewayName;
  raw: unknown;
}

export interface VerificationResult {
  verified: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  gateway: GatewayName;
}

export interface LoadOptions {
  timeout?: number;
  scriptUrl?: string;
}
