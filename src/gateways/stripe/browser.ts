import {
  PaymentError,
  UnsupportedModeError,
  type BrowserAdapter,
  type Capabilities,
  type CheckoutOptions,
  type PaymentResult,
} from '../../core';

export interface StripeLike {
  redirectToCheckout(options: { sessionId: string }): Promise<{ error: { message?: string } | null }>;
}

export interface StripeBrowserConfig {
  publishableKey: string;
  /**
   * Override the stripe-js loader (used in tests). Defaults to dynamically
   * importing `@stripe/stripe-js` — a peer dependency of this package.
   */
  loadStripe?: (publishableKey: string) => Promise<StripeLike | null>;
}

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

async function defaultLoadStripe(publishableKey: string): Promise<StripeLike | null> {
  // Dynamic import so merchants who don't use Stripe don't need the peer dep installed.
  // @ts-ignore — `@stripe/stripe-js` is an OPTIONAL peer dependency; it may not be
  // installed when this adapter is consumed. Merchants who use Stripe must install it
  // themselves. TS cannot resolve the module during typecheck here, which is expected.
  const mod = (await import('@stripe/stripe-js')) as {
    loadStripe: (key: string) => Promise<StripeLike | null>;
  };
  return mod.loadStripe(publishableKey);
}

export function stripeBrowser(config: StripeBrowserConfig): BrowserAdapter {
  const loadStripe = config.loadStripe ?? defaultLoadStripe;
  let stripe: StripeLike | null = null;

  const adapter: BrowserAdapter = {
    gateway: 'stripe',
    capabilities: CAPABILITIES,
    async load(): Promise<void> {
      if (stripe) return;
      stripe = await loadStripe(config.publishableKey);
      if (!stripe) {
        throw new PaymentError('Stripe.js failed to load.', {
          code: 'STRIPE_LOAD_FAILED',
          gateway: 'stripe',
        });
      }
    },
    isReady: () => stripe !== null,

    async openCheckout(options: CheckoutOptions): Promise<PaymentResult> {
      const mode = options.mode ?? 'redirect';
      if (mode !== 'redirect') {
        throw new UnsupportedModeError('Stripe supports redirect mode only in v1.', {
          code: 'STRIPE_UNSUPPORTED_MODE',
          gateway: 'stripe',
        });
      }
      await adapter.load();
      if (!stripe) {
        throw new PaymentError('Stripe.js not loaded.', {
          code: 'STRIPE_NOT_LOADED',
          gateway: 'stripe',
        });
      }
      const sessionId = (options.order.clientPayload as { sessionId?: string }).sessionId;
      if (!sessionId) {
        throw new PaymentError('Missing sessionId in order.clientPayload.', {
          code: 'STRIPE_SESSION_ID_MISSING',
          gateway: 'stripe',
        });
      }
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw new PaymentError(error.message ?? 'Stripe redirectToCheckout failed.', {
          code: 'STRIPE_REDIRECT_FAILED',
          gateway: 'stripe',
          cause: error,
        });
      }
      return new Promise<PaymentResult>(() => {
        /* browser navigates away */
      });
    },

    close(): void {
      /* no-op for redirect flows */
    },
  };

  return adapter;
}
