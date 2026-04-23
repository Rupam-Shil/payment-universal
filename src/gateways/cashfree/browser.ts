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
    Cashfree?: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (opts: {
        paymentSessionId: string;
        redirectTarget: '_modal' | '_self' | '_blank';
        returnUrl?: string;
      }) => Promise<{
        error?: { message?: string; code?: string };
        paymentDetails?: unknown;
        redirect?: boolean;
      }>;
    };
  }
}

export interface CashfreeBrowserConfig {
  appId: string;
  mode: 'production' | 'sandbox';
  scriptUrl?: string;
}

const DEFAULT_SCRIPT_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

export function cashfreeBrowser(config: CashfreeBrowserConfig): BrowserAdapter {
  const loader = createScriptLoader({
    gateway: 'cashfree',
    defaultUrl: config.scriptUrl ?? DEFAULT_SCRIPT_URL,
    isReady: () => typeof window !== 'undefined' && typeof window.Cashfree === 'function',
  });

  const adapter: BrowserAdapter = {
    gateway: 'cashfree',
    capabilities: CAPABILITIES,
    load: (opts?: LoadOptions) => loader.load(opts),
    isReady: () => loader.isReady(),

    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      const mode = options.mode ?? 'modal';
      if (mode !== 'modal' && mode !== 'redirect') {
        throw new UnsupportedModeError(`Cashfree does not support mode "${String(mode)}".`, {
          code: 'CASHFREE_UNSUPPORTED_MODE',
          gateway: 'cashfree',
        });
      }

      await adapter.load();
      if (typeof window === 'undefined' || typeof window.Cashfree !== 'function') {
        throw new PaymentError('Cashfree SDK unavailable on window after load.', {
          code: 'CASHFREE_SDK_UNAVAILABLE',
          gateway: 'cashfree',
        });
      }

      const payload = options.order.clientPayload as { payment_session_id?: string };
      const paymentSessionId = payload.payment_session_id;
      if (!paymentSessionId) {
        throw new PaymentError('Missing payment_session_id in order.clientPayload.', {
          code: 'CASHFREE_SESSION_ID_MISSING',
          gateway: 'cashfree',
        });
      }

      const client = window.Cashfree({ mode: config.mode });

      if (mode === 'redirect') {
        void client.checkout({
          paymentSessionId,
          redirectTarget: '_self',
          returnUrl: options.returnUrl,
        });
        return new Promise<PaymentResult>(() => {
          /* never resolves — browser navigates away */
        });
      }

      const res = await client.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
        returnUrl: options.returnUrl,
      });

      if (res.error) {
        throw new CheckoutDismissedError(res.error.message ?? 'Cashfree checkout dismissed.', {
          code: 'CASHFREE_DISMISSED',
          gateway: 'cashfree',
          cause: res.error,
        });
      }

      const details = res.paymentDetails as {
        paymentId?: string;
        paymentStatus?: string;
      } | undefined;

      return {
        status: 'success',
        orderId: options.order.id,
        paymentId: details?.paymentId ?? '',
        gateway: 'cashfree',
        raw: res,
      };
    },

    close(): void {
      /* Cashfree v3 SDK exposes no programmatic close — modal closes itself on dismiss. */
    },
  };

  return adapter;
}
