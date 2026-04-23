export type GatewayKey = 'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe';

export interface GatewayMeta {
  key: GatewayKey;
  label: string;
  fn: string;
  browserArgs: string;
  serverArgs: string;
  modal: boolean;
  redirect: boolean;
  scriptHost: string;
  note: string;
}

export const GATEWAYS: GatewayMeta[] = [
  {
    key: 'razorpay',
    label: 'Razorpay',
    fn: 'razorpayBrowser',
    browserArgs: "keyId: 'rzp_test_...'",
    serverArgs: "keyId: 'rzp_...', keySecret: '...'",
    modal: true,
    redirect: true,
    scriptHost: 'checkout.razorpay.com',
    note: 'HMAC-SHA256 signature verification',
  },
  {
    key: 'cashfree',
    label: 'Cashfree',
    fn: 'cashfreeBrowser',
    browserArgs: "appId: 'CF_...', mode: 'production'",
    serverArgs: "appId: 'CF_...', secretKey: '...'",
    modal: true,
    redirect: true,
    scriptHost: 'sdk.cashfree.com',
    note: 'v3 SDK · server-to-server verification',
  },
  {
    key: 'payu',
    label: 'PayU',
    fn: 'payuBrowser',
    browserArgs: '',
    serverArgs: "merchantKey: '...', merchantSalt: '...', mode: 'test'",
    modal: false,
    redirect: true,
    scriptHost: 'server-generated',
    note: 'SHA-512 pipe-delimited hash',
  },
  {
    key: 'juspay',
    label: 'Juspay',
    fn: 'juspayBrowser',
    browserArgs: '',
    serverArgs: "apiKey: '...', merchantId: '...', mode: 'sandbox'",
    modal: false,
    redirect: true,
    scriptHost: 'server-generated',
    note: 'HyperCheckout Orders API',
  },
  {
    key: 'stripe',
    label: 'Stripe',
    fn: 'stripeBrowser',
    browserArgs: "publishableKey: 'pk_test_...'",
    serverArgs: "secretKey: 'sk_...', successUrl, cancelUrl",
    modal: false,
    redirect: true,
    scriptHost: 'js.stripe.com',
    note: 'Checkout Sessions (hosted)',
  },
];

export const GATEWAY_MAP: Record<GatewayKey, GatewayMeta> = Object.fromEntries(
  GATEWAYS.map((g) => [g.key, g]),
) as Record<GatewayKey, GatewayMeta>;
