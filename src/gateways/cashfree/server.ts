import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { CashfreeOrderResponse, CashfreePaymentEntry } from './types';

export interface CashfreeServerConfig {
  appId: string;
  secretKey: string;
  /** Override API base (useful for tests / sandbox). */
  apiBase?: string;
  /** Cashfree PG API version header. */
  apiVersion?: string;
}

const DEFAULT_API_BASE = 'https://api.cashfree.com';
const DEFAULT_API_VERSION = '2023-08-01';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function randomOrderId(): string {
  const rnd =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `order_${rnd}`;
}

export function cashfreeServer(config: CashfreeServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;

  const headers = {
    'content-type': 'application/json',
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey,
    'x-api-version': apiVersion,
  };

  return {
    gateway: 'cashfree',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      // Cashfree expects amounts in major units.
      const orderAmount = Math.round(req.amount) / 100;
      const body = {
        order_id: req.receipt ?? randomOrderId(),
        order_amount: orderAmount,
        order_currency: req.currency,
        customer_details: {
          customer_id: req.customer?.id ?? `cust_${Date.now()}`,
          customer_email: req.customer?.email ?? '',
          customer_phone: req.customer?.phone ?? '',
          ...(req.customer?.name ? { customer_name: req.customer.name } : {}),
        },
        ...(req.notes ? { order_tags: req.notes } : {}),
      };

      const res = await fetch(`${base}/pg/orders`, {
        method: 'POST',
        headers,
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
          `Cashfree createOrder failed with status ${res.status}`,
          { code: 'CASHFREE_CREATE_ORDER_FAILED', gateway: 'cashfree', cause: parsed },
        );
      }

      const raw = parsed as CashfreeOrderResponse;
      return {
        id: raw.order_id,
        amount: Math.round(raw.order_amount * 100),
        currency: raw.order_currency,
        status: raw.order_status === 'PAID' ? 'paid' : 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: raw.payment_session_id },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing or not an object.', {
          code: 'CASHFREE_VERIFY_PAYLOAD_MISSING',
          gateway: 'cashfree',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = (p.order_id ?? p.orderId) as string | undefined;
      if (typeof orderId !== 'string' || !orderId) {
        throw new VerificationError('Missing order_id in payment payload.', {
          code: 'CASHFREE_VERIFY_FIELDS_MISSING',
          gateway: 'cashfree',
        });
      }

      const res = await fetch(
        `${base}/pg/orders/${encodeURIComponent(orderId)}/payments`,
        { method: 'GET', headers },
      );
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : [];
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Cashfree fetch payments failed with status ${res.status}`,
          { code: 'CASHFREE_FETCH_PAYMENTS_FAILED', gateway: 'cashfree', cause: parsed },
        );
      }

      const arr = Array.isArray(parsed) ? (parsed as CashfreePaymentEntry[]) : [];
      const latest = arr[0];
      if (!latest) {
        return {
          verified: false,
          orderId,
          paymentId: '',
          amount: 0,
          status: 'pending',
          gateway: 'cashfree',
        };
      }

      const mappedStatus: VerificationResult['status'] =
        latest.payment_status === 'SUCCESS'
          ? 'paid'
          : latest.payment_status === 'FAILED' || latest.payment_status === 'USER_DROPPED'
            ? 'failed'
            : 'pending';

      return {
        verified: mappedStatus === 'paid',
        orderId,
        paymentId: latest.cf_payment_id,
        amount: Math.round(latest.payment_amount * 100),
        status: mappedStatus,
        gateway: 'cashfree',
      };
    },
  };
}
