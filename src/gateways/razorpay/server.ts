import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { RazorpayOrderResponse, RazorpayPaymentFetchResponse } from './types';

export interface RazorpayServerConfig {
  keyId: string;
  keySecret: string;
  /** Override base URL (useful for tests). */
  apiBase?: string;
}

const DEFAULT_API_BASE = 'https://api.razorpay.com';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function basicAuthHeader(keyId: string, keySecret: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${keyId}:${keySecret}`).toString('base64')
      : btoa(`${keyId}:${keySecret}`);
  return `Basic ${encoded}`;
}

function hexEqualsTimingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function razorpayServer(config: RazorpayServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const auth = basicAuthHeader(config.keyId, config.keySecret);

  return {
    gateway: 'razorpay',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const body = {
        amount: req.amount,
        currency: req.currency,
        ...(req.receipt !== undefined ? { receipt: req.receipt } : {}),
        ...(req.notes !== undefined ? { notes: req.notes } : {}),
        payment_capture: 1,
      };

      const res = await fetch(`${base}/v1/orders`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: auth,
        },
        body: JSON.stringify(body),
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
          `Razorpay createOrder failed with status ${res.status}`,
          { code: 'RAZORPAY_CREATE_ORDER_FAILED', gateway: 'razorpay', cause: parsed },
        );
      }

      const raw = parsed as RazorpayOrderResponse;
      return {
        id: raw.id,
        amount: raw.amount,
        currency: raw.currency,
        status: raw.status === 'paid' ? 'paid' : 'created',
        gateway: 'razorpay',
        clientPayload: {
          key: config.keyId,
          order_id: raw.id,
          amount: raw.amount,
          currency: raw.currency,
        },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing or not an object.', {
          code: 'RAZORPAY_VERIFY_PAYLOAD_MISSING',
          gateway: 'razorpay',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = p.razorpay_order_id;
      const paymentId = p.razorpay_payment_id;
      const signature = p.razorpay_signature;
      if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
        throw new VerificationError(
          'Missing razorpay_order_id / razorpay_payment_id / razorpay_signature.',
          { code: 'RAZORPAY_VERIFY_FIELDS_MISSING', gateway: 'razorpay' },
        );
      }

      const expected = createHmac('sha256', config.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (!hexEqualsTimingSafe(expected, signature)) {
        throw new VerificationError('Signature mismatch.', {
          code: 'RAZORPAY_SIGNATURE_MISMATCH',
          gateway: 'razorpay',
        });
      }

      const res = await fetch(`${base}/v1/payments/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: { authorization: auth },
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
          `Razorpay fetch payment failed with status ${res.status}`,
          { code: 'RAZORPAY_FETCH_PAYMENT_FAILED', gateway: 'razorpay', cause: parsed },
        );
      }

      const raw = parsed as RazorpayPaymentFetchResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.status === 'captured' || raw.status === 'authorized'
          ? 'paid'
          : raw.status === 'failed'
            ? 'failed'
            : 'pending';

      return {
        verified: true,
        orderId,
        paymentId,
        amount: raw.amount,
        status: mappedStatus,
        gateway: 'razorpay',
      };
    },
  };
}
