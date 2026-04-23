import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type {
  JuspayOrderResponse,
  JuspayOrderStatusResponse,
} from './types';

export interface JuspayServerConfig {
  apiKey: string;
  merchantId: string;
  mode: 'production' | 'sandbox';
  apiBase?: string;
}

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function defaultBase(mode: 'production' | 'sandbox'): string {
  return mode === 'production' ? 'https://api.juspay.in' : 'https://sandbox.juspay.in';
}

function basicAuth(apiKey: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${apiKey}:`).toString('base64')
      : btoa(`${apiKey}:`);
  return `Basic ${encoded}`;
}

export function juspayServer(config: JuspayServerConfig): ServerAdapter {
  const base = config.apiBase ?? defaultBase(config.mode);
  const headers = {
    authorization: basicAuth(config.apiKey),
    'x-merchantid': config.merchantId,
    'content-type': 'application/x-www-form-urlencoded',
  };

  return {
    gateway: 'juspay',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const orderId = req.receipt ?? `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const amount = (Math.round(req.amount) / 100).toFixed(2);
      const params = new URLSearchParams();
      params.set('order_id', orderId);
      params.set('amount', amount);
      params.set('currency', req.currency);
      if (req.customer?.id) params.set('customer_id', req.customer.id);
      if (req.customer?.email) params.set('customer_email', req.customer.email);
      if (req.customer?.phone) params.set('customer_phone', req.customer.phone);
      if (req.customer?.name) params.set('first_name', req.customer.name);

      const res = await fetch(`${base}/orders`, {
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
          `Juspay createOrder failed with status ${res.status}`,
          { code: 'JUSPAY_CREATE_ORDER_FAILED', gateway: 'juspay', cause: parsed },
        );
      }
      const raw = parsed as JuspayOrderResponse;
      const webUrl = raw.payment_links?.web;
      if (!webUrl) {
        throw new GatewayApiError(
          'Juspay createOrder succeeded but no payment_links.web URL was returned.',
          { code: 'JUSPAY_WEB_URL_MISSING', gateway: 'juspay', cause: raw },
        );
      }
      return {
        id: raw.order_id,
        amount: Math.round(raw.amount * 100),
        currency: raw.currency,
        status: 'created',
        gateway: 'juspay',
        clientPayload: { url: webUrl },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing.', {
          code: 'JUSPAY_VERIFY_PAYLOAD_MISSING',
          gateway: 'juspay',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = (p.order_id ?? p.orderId) as string | undefined;
      if (typeof orderId !== 'string' || !orderId) {
        throw new VerificationError('Missing order_id in Juspay payload.', {
          code: 'JUSPAY_VERIFY_FIELDS_MISSING',
          gateway: 'juspay',
        });
      }

      const res = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers,
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
          `Juspay fetch order failed with status ${res.status}`,
          { code: 'JUSPAY_FETCH_ORDER_FAILED', gateway: 'juspay', cause: parsed },
        );
      }
      const raw = parsed as JuspayOrderStatusResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.status === 'CHARGED'
          ? 'paid'
          : raw.status === 'FAILED'
            ? 'failed'
            : 'pending';
      return {
        verified: mappedStatus === 'paid',
        orderId: raw.order_id,
        paymentId: raw.txn_id ?? raw.txn_uuid ?? '',
        amount: Math.round(raw.amount * 100),
        status: mappedStatus,
        gateway: 'juspay',
      };
    },
  };
}
