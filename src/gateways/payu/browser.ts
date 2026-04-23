import {
  PaymentError,
  UnsupportedModeError,
  type BrowserAdapter,
  type Capabilities,
  type CheckoutOptions,
  type PaymentResult,
} from '../../core';

export type PayUBrowserConfig = Record<string, never>;

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

const FORM_FIELDS = [
  'key',
  'txnid',
  'amount',
  'productinfo',
  'firstname',
  'email',
  'phone',
  'hash',
];

export function payuBrowser(_config: PayUBrowserConfig = {} as PayUBrowserConfig): BrowserAdapter {
  const adapter: BrowserAdapter = {
    gateway: 'payu',
    capabilities: CAPABILITIES,
    load: async () => {
      /* no external script needed for PayU redirect */
    },
    isReady: () => true,

    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      const mode = options.mode ?? 'redirect';
      if (mode !== 'redirect') {
        throw new UnsupportedModeError('PayU supports redirect mode only.', {
          code: 'PAYU_UNSUPPORTED_MODE',
          gateway: 'payu',
        });
      }
      if (typeof document === 'undefined') {
        throw new PaymentError('PayU redirect requires a browser DOM.', {
          code: 'PAYU_SSR_BLOCKED',
          gateway: 'payu',
        });
      }

      const payload = options.order.clientPayload as Record<string, string>;
      const url = payload.url;
      if (!url) {
        throw new PaymentError('Missing PayU payment URL in clientPayload.url.', {
          code: 'PAYU_URL_MISSING',
          gateway: 'payu',
        });
      }

      const form = document.createElement('form');
      form.method = 'post';
      form.action = url;
      form.style.display = 'none';

      const append = (name: string, value: string): void => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      for (const key of FORM_FIELDS) {
        const v = payload[key];
        if (typeof v === 'string') append(key, v);
      }
      if (options.returnUrl) {
        append('surl', options.returnUrl);
        append('furl', options.returnUrl);
      }
      if (options.cancelUrl) append('curl', options.cancelUrl);

      document.body.appendChild(form);
      form.submit();

      return new Promise<PaymentResult>(() => {
        /* never resolves — browser navigates away */
      });
    },

    close(): void {
      /* no-op for PayU */
    },
  };
  return adapter;
}
