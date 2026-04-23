import type {
  BrowserAdapter,
  CheckoutOptions,
  NormalizedOrder,
  OrderRequest,
  PaymentResult,
  ServerAdapter,
  VerificationResult,
} from '../../src/core';

export interface FakeBrowserAdapterOptions {
  result?: PaymentResult;
  error?: Error;
  loadDelayMs?: number;
  modal?: boolean;
  redirect?: boolean;
}

export function makeFakeBrowserAdapter(
  opts: FakeBrowserAdapterOptions = {},
): BrowserAdapter & { opened: CheckoutOptions[]; closed: number } {
  const opened: CheckoutOptions[] = [];
  let closed = 0;
  let loaded = false;

  const adapter = {
    gateway: 'razorpay',
    capabilities: {
      modal: opts.modal ?? true,
      redirect: opts.redirect ?? true,
      webhooks: false,
      subscriptions: false,
      refunds: false,
    },
    async load(): Promise<void> {
      if (opts.loadDelayMs && opts.loadDelayMs > 0) {
        await new Promise((r) => setTimeout(r, opts.loadDelayMs));
      }
      loaded = true;
    },
    isReady: () => loaded,
    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      opened.push(options);
      if (opts.error) throw opts.error;
      return (
        opts.result ?? {
          status: 'success',
          orderId: options.order.id,
          paymentId: 'fake_pay_1',
          signature: 'fake_sig',
          gateway: 'razorpay',
          raw: {},
        }
      );
    },
    close(): void {
      closed += 1;
    },
    get opened(): CheckoutOptions[] {
      return opened;
    },
    get closed(): number {
      return closed;
    },
  } as BrowserAdapter & { opened: CheckoutOptions[]; closed: number };

  return adapter;
}

export function makeFakeServerAdapter(
  overrides: Partial<{
    order: NormalizedOrder;
    verification: VerificationResult;
    onCreateOrder: (req: OrderRequest) => void;
  }> = {},
): ServerAdapter & { createCalls: OrderRequest[]; verifyCalls: unknown[] } {
  const createCalls: OrderRequest[] = [];
  const verifyCalls: unknown[] = [];

  return {
    gateway: 'razorpay',
    capabilities: {
      modal: true,
      redirect: true,
      webhooks: false,
      subscriptions: false,
      refunds: false,
    },
    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      createCalls.push(req);
      overrides.onCreateOrder?.(req);
      return (
        overrides.order ?? {
          id: 'fake_order_1',
          amount: req.amount,
          currency: req.currency,
          status: 'created',
          gateway: 'razorpay',
          clientPayload: { key: 'fake_key', order_id: 'fake_order_1' },
          raw: {},
        }
      );
    },
    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      verifyCalls.push(payload);
      return (
        overrides.verification ?? {
          verified: true,
          orderId: 'fake_order_1',
          paymentId: 'fake_pay_1',
          amount: 100,
          status: 'paid',
          gateway: 'razorpay',
        }
      );
    },
    get createCalls(): OrderRequest[] {
      return createCalls;
    },
    get verifyCalls(): unknown[] {
      return verifyCalls;
    },
  } as ServerAdapter & { createCalls: OrderRequest[]; verifyCalls: unknown[] };
}
