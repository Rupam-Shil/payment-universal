import {
  CheckoutDismissedError,
  PaymentError,
  UnsupportedModeError,
  createScriptLoader,
  type BrowserAdapter,
  type Capabilities,
  type CheckoutOptions,
  type LoadOptions,
  type PaymentResult,
} from '../../core';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      close: () => void;
      on: (event: string, handler: (payload: unknown) => void) => void;
    };
  }
}

export interface RazorpayBrowserConfig {
  keyId: string;
  /** Override script URL (defaults to https://checkout.razorpay.com/v1/checkout.js). */
  scriptUrl?: string;
}

const DEFAULT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const REDIRECT_ENDPOINT = 'https://api.razorpay.com/v1/checkout/embedded';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

export function razorpayBrowser(config: RazorpayBrowserConfig): BrowserAdapter {
  const loader = createScriptLoader({
    gateway: 'razorpay',
    defaultUrl: config.scriptUrl ?? DEFAULT_SCRIPT_URL,
    isReady: () =>
      typeof window !== 'undefined' && typeof window.Razorpay === 'function',
  });

  let lastInstance: InstanceType<NonNullable<Window['Razorpay']>> | null = null;

  const adapter: BrowserAdapter = {
    gateway: 'razorpay',
    capabilities: CAPABILITIES,
    load: (opts?: LoadOptions) => loader.load(opts),
    isReady: () => loader.isReady(),

    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      const mode = options.mode ?? 'modal';
      if (mode !== 'modal' && mode !== 'redirect') {
        throw new UnsupportedModeError(`Razorpay does not support mode "${String(mode)}".`, {
          code: 'RAZORPAY_UNSUPPORTED_MODE',
          gateway: 'razorpay',
        });
      }

      if (mode === 'redirect') {
        await adapter.load();
        const payload = options.order.clientPayload as Record<string, unknown>;
        const params = new URLSearchParams();
        params.set('key_id', String(payload.key ?? config.keyId));
        params.set('order_id', String(payload.order_id ?? options.order.id));
        params.set('amount', String(payload.amount ?? options.order.amount));
        params.set('currency', String(payload.currency ?? options.order.currency));
        if (options.returnUrl) params.set('callback_url', options.returnUrl);
        if (options.cancelUrl) params.set('cancel_url', options.cancelUrl);
        if (options.prefill?.email) params.set('prefill[email]', options.prefill.email);
        if (options.prefill?.name) params.set('prefill[name]', options.prefill.name);
        if (options.prefill?.phone) params.set('prefill[contact]', options.prefill.phone);
        const url = `${REDIRECT_ENDPOINT}?${params.toString()}`;
        if (typeof window !== 'undefined') {
          window.location.assign(url);
        }
        return new Promise<PaymentResult>(() => {
          /* never resolves — user navigates away */
        });
      }

      // modal mode
      await adapter.load();
      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        throw new PaymentError('Razorpay SDK unavailable on window after load.', {
          code: 'RAZORPAY_SDK_UNAVAILABLE',
          gateway: 'razorpay',
        });
      }

      const payload = options.order.clientPayload as Record<string, unknown>;

      return new Promise<PaymentResult>((resolve, reject) => {
        let settled = false;
        const settle = (fn: () => void): void => {
          if (settled) return;
          settled = true;
          fn();
        };

        const rzpOptions: Record<string, unknown> = {
          key: payload.key ?? config.keyId,
          order_id: payload.order_id ?? options.order.id,
          amount: payload.amount ?? options.order.amount,
          currency: payload.currency ?? options.order.currency,
          prefill: {
            name: options.prefill?.name,
            email: options.prefill?.email,
            contact: options.prefill?.phone,
          },
          theme: options.theme,
          handler: (r: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            settle(() =>
              resolve({
                status: 'success',
                orderId: r.razorpay_order_id,
                paymentId: r.razorpay_payment_id,
                signature: r.razorpay_signature,
                gateway: 'razorpay',
                raw: r,
              }),
            );
          },
          modal: {
            ondismiss: () => {
              settle(() =>
                reject(
                  new CheckoutDismissedError('Razorpay checkout modal was dismissed.', {
                    code: 'RAZORPAY_DISMISSED',
                    gateway: 'razorpay',
                  }),
                ),
              );
            },
          },
        };

        let instance: InstanceType<NonNullable<Window['Razorpay']>>;
        try {
          instance = new (window.Razorpay as NonNullable<Window['Razorpay']>)(rzpOptions);
        } catch (err) {
          settle(() =>
            reject(
              new PaymentError('Failed to instantiate Razorpay checkout.', {
                code: 'RAZORPAY_INSTANTIATE_FAILED',
                gateway: 'razorpay',
                cause: err,
              }),
            ),
          );
          return;
        }
        lastInstance = instance;

        instance.on('payment.failed', (p: unknown) => {
          const payload = p as { error?: { description?: string } } | undefined;
          settle(() =>
            reject(
              new PaymentError(payload?.error?.description ?? 'Razorpay payment failed.', {
                code: 'RAZORPAY_PAYMENT_FAILED',
                gateway: 'razorpay',
                cause: p,
              }),
            ),
          );
        });

        try {
          instance.open();
        } catch (err) {
          settle(() =>
            reject(
              new PaymentError('Failed to open Razorpay checkout.', {
                code: 'RAZORPAY_OPEN_FAILED',
                gateway: 'razorpay',
                cause: err,
              }),
            ),
          );
        }
      });
    },

    close(): void {
      if (lastInstance) {
        try {
          lastInstance.close();
        } catch {
          /* no-op */
        }
        lastInstance = null;
      }
    },
  };

  return adapter;
}
