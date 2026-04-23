import { createHash, timingSafeEqual } from 'node:crypto';
import {
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';

export interface PayUServerConfig {
  merchantKey: string;
  merchantSalt: string;
  mode: 'test' | 'production';
}

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function payuUrl(mode: 'test' | 'production'): string {
  return mode === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';
}

function sha512(str: string): string {
  return createHash('sha512').update(str).digest('hex');
}

function hexEqualsTimingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function payuServer(config: PayUServerConfig): ServerAdapter {
  return {
    gateway: 'payu',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const amount = (Math.round(req.amount) / 100).toFixed(2);
      const txnid = req.receipt ?? `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const productinfo = req.notes?.purpose ?? req.notes?.productinfo ?? 'payment';
      const firstname = req.customer?.name ?? '';
      const email = req.customer?.email ?? '';
      const phone = req.customer?.phone ?? '';

      const hashParts = [
        config.merchantKey, txnid, amount, productinfo, firstname, email,
        '', '', '', '', '',    // udf1..udf5
        '', '', '', '', '',    // 5 reserved empty
        config.merchantSalt,
      ];
      const hash = sha512(hashParts.join('|'));

      return {
        id: txnid,
        amount: req.amount,
        currency: req.currency,
        status: 'created',
        gateway: 'payu',
        clientPayload: {
          url: payuUrl(config.mode),
          key: config.merchantKey,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          phone,
          hash,
        },
        raw: { txnid, amount, hash },
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing.', {
          code: 'PAYU_VERIFY_PAYLOAD_MISSING',
          gateway: 'payu',
        });
      }
      const p = payload as Record<string, string | undefined>;
      const required = ['status', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'hash'];
      for (const key of required) {
        if (typeof p[key] !== 'string') {
          throw new VerificationError(`Missing required field "${key}" in PayU payload.`, {
            code: 'PAYU_VERIFY_FIELDS_MISSING',
            gateway: 'payu',
          });
        }
      }
      const status = p.status as string;
      const txnid = p.txnid as string;
      const amount = p.amount as string;
      const productinfo = p.productinfo as string;
      const firstname = p.firstname as string;
      const email = p.email as string;
      const givenHash = p.hash as string;

      const responseParts = [
        config.merchantSalt, status,
        '', '', '', '', '', '', '', '', '', '',
        email, firstname, productinfo, amount, txnid, config.merchantKey,
      ];
      const expected = sha512(responseParts.join('|'));
      if (!hexEqualsTimingSafe(expected, givenHash)) {
        throw new VerificationError('PayU response hash mismatch.', {
          code: 'PAYU_HASH_MISMATCH',
          gateway: 'payu',
        });
      }

      const amountPaise = Math.round(parseFloat(amount) * 100);
      const mappedStatus: VerificationResult['status'] =
        status === 'success' ? 'paid' : status === 'failure' ? 'failed' : 'pending';

      return {
        verified: mappedStatus === 'paid',
        orderId: txnid,
        paymentId: p.mihpayid ?? '',
        amount: amountPaise,
        status: mappedStatus,
        gateway: 'payu',
      };
    },
  };
}
