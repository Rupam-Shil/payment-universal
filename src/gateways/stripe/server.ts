import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { StripeCheckoutSessionResponse } from './types';

export interface StripeServerConfig {
  secretKey: string;
  /**
   * Stripe requires both URLs at session creation. Provide production values —
   * default placeholders point at RFC 2606 `example.test` which will break
   * real redirects.
   */
  successUrl?: string;
  cancelUrl?: string;
  apiBase?: string;
}

const DEFAULT_API_BASE = 'https://api.stripe.com';
const DEFAULT_SUCCESS_URL = 'https://example.test/success?session_id={CHECKOUT_SESSION_ID}';
const DEFAULT_CANCEL_URL = 'https://example.test/cancel';

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function basicAuth(secretKey: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${secretKey}:`).toString('base64')
      : btoa(`${secretKey}:`);
  return `Basic ${encoded}`;
}

export function stripeServer(config: StripeServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const headers = {
    authorization: basicAuth(config.secretKey),
    'content-type': 'application/x-www-form-urlencoded',
  };

  return {
    gateway: 'stripe',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('line_items[0][price_data][currency]', req.currency.toLowerCase());
      params.set('line_items[0][price_data][unit_amount]', String(req.amount));
      params.set('line_items[0][price_data][product_data][name]', req.notes?.purpose ?? 'Payment');
      params.set('line_items[0][quantity]', '1');
      if (req.customer?.email) params.set('customer_email', req.customer.email);
      if (req.receipt) params.set('client_reference_id', req.receipt);
      params.set('success_url', config.successUrl ?? DEFAULT_SUCCESS_URL);
      params.set('cancel_url', config.cancelUrl ?? DEFAULT_CANCEL_URL);

      const res = await fetch(`${base}/v1/checkout/sessions`, {
        method: 'POST',
        headers,
        body: params.toString(),
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Stripe createOrder failed with status ${res.status}`,
          { code: 'STRIPE_CREATE_ORDER_FAILED', gateway: 'stripe', cause: parsed },
        );
      }
      const raw = parsed as StripeCheckoutSessionResponse;
      return {
        id: raw.id,
        amount: raw.amount_total ?? req.amount,
        currency: (raw.currency ?? req.currency).toUpperCase(),
        status: 'created',
        gateway: 'stripe',
        clientPayload: { sessionId: raw.id, url: raw.url },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing.', {
          code: 'STRIPE_VERIFY_PAYLOAD_MISSING',
          gateway: 'stripe',
        });
      }
      const p = payload as Record<string, unknown>;
      const sessionId = (p.sessionId ?? p.session_id) as string | undefined;
      if (typeof sessionId !== 'string' || !sessionId) {
        throw new VerificationError('Missing sessionId in Stripe payload.', {
          code: 'STRIPE_VERIFY_FIELDS_MISSING',
          gateway: 'stripe',
        });
      }

      const res = await fetch(
        `${base}/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        { method: 'GET', headers },
      );
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Stripe fetch session failed with status ${res.status}`,
          { code: 'STRIPE_FETCH_SESSION_FAILED', gateway: 'stripe', cause: parsed },
        );
      }
      const raw = parsed as StripeCheckoutSessionResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.payment_status === 'paid'
          ? 'paid'
          : raw.status === 'expired'
            ? 'failed'
            : 'pending';
      return {
        verified: mappedStatus === 'paid',
        orderId: raw.id,
        paymentId: raw.payment_intent ?? '',
        amount: raw.amount_total ?? 0,
        status: mappedStatus,
        gateway: 'stripe',
      };
    },
  };
}
