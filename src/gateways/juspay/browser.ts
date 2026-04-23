import {
  PaymentError,
  UnsupportedModeError,
  type BrowserAdapter,
  type Capabilities,
  type CheckoutOptions,
  type PaymentResult,
} from '../../core';

export type JuspayBrowserConfig = Record<string, never>;

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

export function juspayBrowser(_config: JuspayBrowserConfig = {} as JuspayBrowserConfig): BrowserAdapter {
  const adapter: BrowserAdapter = {
    gateway: 'juspay',
    capabilities: CAPABILITIES,
    load: async () => {
      /* nothing to load */
    },
    isReady: () => true,

    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      const mode = options.mode ?? 'redirect';
      if (mode !== 'redirect') {
        throw new UnsupportedModeError('Juspay supports redirect mode only.', {
          code: 'JUSPAY_UNSUPPORTED_MODE',
          gateway: 'juspay',
        });
      }
      const url = (options.order.clientPayload as { url?: string }).url;
      if (!url) {
        throw new PaymentError('Missing Juspay hosted URL in clientPayload.url.', {
          code: 'JUSPAY_URL_MISSING',
          gateway: 'juspay',
        });
      }
      if (typeof window !== 'undefined') window.location.assign(url);
      return new Promise<PaymentResult>(() => {
        /* user navigates away */
      });
    },

    close(): void {
      /* no-op */
    },
  };
  return adapter;
}
