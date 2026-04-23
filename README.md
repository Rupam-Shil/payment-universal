# payment-universal

[![npm](https://img.shields.io/npm/v/payment-universal.svg?color=d0f500&style=flat-square)](https://www.npmjs.com/package/payment-universal)
[![license](https://img.shields.io/npm/l/payment-universal.svg?color=0a0b0e&style=flat-square)](./LICENSE)
[![types](https://img.shields.io/badge/types-TypeScript-blue.svg?style=flat-square)](./dist/index.d.ts)
[![bundle](https://img.shields.io/bundlephobia/minzip/payment-universal?style=flat-square)](https://bundlephobia.com/package/payment-universal)

A framework-agnostic TypeScript SDK for **Razorpay**, **Cashfree**, **PayU**, **Juspay**, and **Stripe**. One API, swappable adapters, first-class bindings for **React**, **Vue 3**, **Angular**, and **Vanilla JS**.

- **Landing page:** https://payment-universal.vercel.app/
- **Source:** https://github.com/Rupam-Shil/payment-universal
- **Issues:** https://github.com/Rupam-Shil/payment-universal/issues

> **Status: pre-release.** `0.1.x` is honest about being early. The architecture is stable, 61 unit tests are green across all 5 gateways × browser/server and all 4 framework adapters, but sandbox smoke tests against live gateway APIs are still in progress. Expect a handful of breaking changes before `1.0`.

---

## Why this exists

Picking a payment gateway is a business decision that changes. `razorpay-universal` (this project's ancestor) handled Razorpay only. `payment-universal` takes the same framework-integration discipline and applies it to five gateways behind a uniform API.

The promise: **swap two import lines — one on the client, one on the server — and the rest of your integration stays identical.** The framework hook, the normalized order shape, the verify endpoint, the result handling: unchanged.

The abstraction has limits, and that's the whole point. Gateways genuinely differ — PayU, Juspay, and Stripe have no drop-in modal in v1, only hosted redirects. Rather than pretending otherwise, `payment-universal` surfaces **capability flags** on every adapter and throws `UnsupportedModeError` **synchronously** when you ask for something a gateway can't do. Fail at the call site, not mid-transaction.

## Highlights

- **5 gateways × 2 sides × 4 frameworks**, all tree-shakable per gateway/framework.
- **Two-tier adapter split** — server entries use the `"node"` export condition so browser bundlers physically cannot import code that holds your secret keys.
- **Gateway-agnostic framework hooks** — `useCheckout(adapter)` doesn't care which gateway you passed in.
- **Normalized types** — `OrderRequest`, `NormalizedOrder`, `PaymentResult`, `VerificationResult` are identical across gateways. The gateway-specific bits live in `clientPayload` / `raw`.
- **Promise-based `open()`** wrapping each gateway's native callback/event SDK. Modal dismissal rejects with `CheckoutDismissedError`. Payment failure rejects with `PaymentError`.
- **SSR-safe** — every `window` / `document` access is guarded. Angular uses `PLATFORM_ID`. React does no work outside `useEffect`.
- **Zero runtime dependencies.** Every framework and browser SDK is an optional peer dep.

## Capability matrix (v1)

| Gateway   | Modal | Redirect | Script host              | Optional browser peer dep                |
|-----------|:-----:|:--------:|--------------------------|------------------------------------------|
| Razorpay  |   ✅   |    ✅    | checkout.razorpay.com    | —                                        |
| Cashfree  |   ✅   |    ✅    | sdk.cashfree.com         | `@cashfreepayments/cashfree-js`          |
| PayU      |   ❌   |    ✅    | (server-generated form)  | —                                        |
| Juspay    |   ❌   |    ✅    | (server-generated URL)   | —                                        |
| Stripe    |   ❌   |    ✅    | js.stripe.com            | `@stripe/stripe-js`                      |

Webhooks, subscriptions, and refunds are `false` for every gateway in v1 — on the v2 roadmap.

## Install

```bash
npm install payment-universal
# or
pnpm add payment-universal
# or
yarn add payment-universal
```

Optional peer deps — install only for gateways and frameworks you actually use:

```bash
# Framework peers
npm install react                                    # React adapter
npm install vue                                      # Vue 3 adapter
npm install @angular/core @angular/common rxjs       # Angular adapter
# (Vanilla needs nothing extra)

# Gateway browser SDKs
npm install @cashfreepayments/cashfree-js            # Cashfree modal / redirect
npm install @stripe/stripe-js                        # Stripe redirectToCheckout
```

Razorpay, PayU, and Juspay don't need a separate browser SDK package — the loader injects their scripts directly, or (PayU/Juspay) the server generates a redirect target.

## Quick start (React + Razorpay + Next.js)

The shortest path to a working checkout.

### 1. Server: create an order

Server entries live at `payment-universal/{gateway}/server` — these are Node-only and hold your secret key.

```ts
// app/api/checkout/route.ts
import { razorpayServer } from 'payment-universal/razorpay/server';

const server = razorpayServer({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request): Promise<Response> {
  const { amount, currency = 'INR' } = await req.json();
  const order = await server.createOrder({
    amount,
    currency,
    receipt: `rcpt_${Date.now()}`,
  });
  return Response.json(order); // NormalizedOrder
}
```

### 2. Client: open the checkout

```tsx
// components/PayButton.tsx
'use client';
import { useCheckout } from 'payment-universal/react';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const adapter = razorpayBrowser({
  keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
});

export function PayButton() {
  const { open, isReady, isLoading, error } = useCheckout(adapter);

  async function handlePay() {
    const order = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ amount: 49900 }),
    }).then((r) => r.json());

    try {
      const result = await open({
        order,
        mode: 'modal',
        prefill: { email: 'jane@example.com', name: 'Jane' },
      });
      await fetch('/api/verify', {
        method: 'POST',
        body: JSON.stringify(result),
      });
    } catch (err) {
      // CheckoutDismissedError, PaymentError, etc.
      console.error(err);
    }
  }

  if (error) return <p>Failed to load checkout: {error.message}</p>;
  return (
    <button disabled={!isReady || isLoading} onClick={handlePay}>
      Pay ₹499
    </button>
  );
}
```

### 3. Server: verify the payment

```ts
// app/api/verify/route.ts
import { razorpayServer } from 'payment-universal/razorpay/server';

const server = razorpayServer({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request): Promise<Response> {
  const paymentResult = await req.json(); // from the browser
  const verification = await server.verifyPayment(paymentResult);
  // verification: { verified: true, orderId, paymentId, amount, status: 'paid', gateway }

  // Always cross-check verification.amount against your own DB record before
  // fulfilling — the library tells you the gateway says it's paid; you decide
  // whether that matches what you expected.

  return Response.json(verification);
}
```

That's the entire loop.

## Switching gateways

The whole promise, in one diff:

```diff
- import { razorpayBrowser } from 'payment-universal/razorpay/browser';
- const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RZP_KEY! });
+ import { cashfreeBrowser } from 'payment-universal/cashfree/browser';
+ const adapter = cashfreeBrowser({ appId: process.env.NEXT_PUBLIC_CF_APP!, mode: 'production' });
```

```diff
- import { razorpayServer } from 'payment-universal/razorpay/server';
- const server = razorpayServer({ keyId, keySecret });
+ import { cashfreeServer } from 'payment-universal/cashfree/server';
+ const server = cashfreeServer({ appId, secretKey });
```

The `useCheckout(adapter)` call, the `open({ order, mode, prefill })` call, the `server.createOrder(req)` call, and the `server.verifyPayment(payload)` call are all **unchanged**. If the new gateway doesn't support the mode you asked for, you get `UnsupportedModeError` synchronously at `open()` — visible at runtime via `adapter.capabilities` if you want to check before calling.

## Framework adapters

The framework hooks are gateway-agnostic — they consume the `BrowserAdapter` interface and don't reference any specific gateway.

### React

```tsx
import { useCheckout } from 'payment-universal/react';

const { open, close, isReady, isLoading, error } = useCheckout(adapter);
```

`useCheckout` takes an optional second argument `{ timeout?, scriptUrl? }` forwarded to the loader. The hook cleans up on unmount and is safe in React 18 strict mode.

### Vue 3

```vue
<script setup lang="ts">
import { useCheckout } from 'payment-universal/vue';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const adapter = razorpayBrowser({ keyId: import.meta.env.VITE_RAZORPAY_KEY });
const { open, close, isReady, isLoading, error } = useCheckout(adapter);

async function pay() {
  const order = await fetch('/api/checkout', { method: 'POST' }).then((r) => r.json());
  const result = await open({ order, mode: 'modal' });
  // ...
}
</script>

<template>
  <button :disabled="!isReady || isLoading" @click="pay">Pay</button>
</template>
```

Returns reactive `Ref<boolean>` / `Ref<Error | null>` values.

### Angular

Bind a gateway adapter at module level via `CheckoutModule.forRoot(adapter)`:

```ts
// app.module.ts
import { NgModule } from '@angular/core';
import { CheckoutModule } from 'payment-universal/angular';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

@NgModule({
  imports: [
    CheckoutModule.forRoot(
      razorpayBrowser({ keyId: environment.razorpayKey }),
    ),
  ],
})
export class AppModule {}
```

Then inject `CheckoutService` anywhere:

```ts
import { CheckoutService } from 'payment-universal/angular';

constructor(private readonly checkout: CheckoutService) {}

async pay() {
  await this.checkout.load();
  const order = await firstValueFrom(this.http.post('/api/checkout', {}));
  const result = await this.checkout.open({ order, mode: 'modal' });
}
```

Uses `PLATFORM_ID` + `isPlatformBrowser` internally — SSR safe on Angular Universal.

### Vanilla

```ts
import { PaymentClient } from 'payment-universal/vanilla';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const client = new PaymentClient(razorpayBrowser({ keyId: 'rzp_...' }));

document.querySelector('#pay')!.addEventListener('click', async () => {
  await client.load();
  const order = await fetch('/api/checkout', { method: 'POST' }).then((r) => r.json());
  const result = await client.open({ order, mode: 'modal' });
  await fetch('/api/verify', { method: 'POST', body: JSON.stringify(result) });
});
```

UMD build is also available at `dist/index.umd.js` (global: `PaymentUniversal`) for script-tag usage.

## Gateway configuration

Each gateway has **one browser factory** and **one server factory**. Mix gateways between environments if you're running an experiment.

### Razorpay

```ts
import { razorpayBrowser } from 'payment-universal/razorpay/browser';
import { razorpayServer } from 'payment-universal/razorpay/server';

razorpayBrowser({ keyId: 'rzp_...' /* scriptUrl? */ });
razorpayServer({ keyId: 'rzp_...', keySecret: '...' /* apiBase? */ });
```

Supports: **modal**, **redirect**. Signature verification: HMAC-SHA256 of `order_id|payment_id` using `keySecret`, compared in constant time.

### Cashfree

```ts
import { cashfreeBrowser } from 'payment-universal/cashfree/browser';
import { cashfreeServer } from 'payment-universal/cashfree/server';

cashfreeBrowser({ appId: 'CF_...', mode: 'sandbox' | 'production' });
cashfreeServer({
  appId: 'CF_...',
  secretKey: '...',
  // optional: apiBase, apiVersion
});
```

Supports: **modal**, **redirect**. Uses Cashfree PG v3 SDK browser-side (`@cashfreepayments/cashfree-js`). Server uses the Orders API (`POST /pg/orders`) with three-header auth. Verification fetches `/pg/orders/{id}/payments` and maps the latest `payment_status`.

### PayU (redirect-only)

```ts
import { payuBrowser } from 'payment-universal/payu/browser';
import { payuServer } from 'payment-universal/payu/server';

payuBrowser(); // no config — server generates all form fields + hash
payuServer({ merchantKey: '...', merchantSalt: '...', mode: 'test' | 'production' });
```

Supports: **redirect only**. Calling `open({ mode: 'modal' })` throws `UnsupportedModeError` synchronously. Hash: SHA-512 of the documented pipe-separated payload, constant-time verified on the response callback.

### Juspay (redirect-only)

```ts
import { juspayBrowser } from 'payment-universal/juspay/browser';
import { juspayServer } from 'payment-universal/juspay/server';

juspayBrowser();
juspayServer({ apiKey: '...', merchantId: '...', mode: 'sandbox' | 'production' });
```

Supports: **redirect only**. Server creates a HyperCheckout order (`POST /orders` with Basic auth + `x-merchantid`); browser navigates to `payment_links.web`. Verification fetches `GET /orders/{id}` and maps `status: 'CHARGED'` → `paid`.

### Stripe (redirect-only in v1)

```ts
import { stripeBrowser } from 'payment-universal/stripe/browser';
import { stripeServer } from 'payment-universal/stripe/server';

stripeBrowser({ publishableKey: 'pk_test_...' });
stripeServer({
  secretKey: 'sk_test_...',
  successUrl: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://yourapp.com/cancel',
});
```

v1 uses Stripe Checkout (hosted). Stripe Elements (embedded card form) is out of scope. The browser adapter dynamically imports `@stripe/stripe-js` — only required if you're actually using Stripe. You can inject your own loader via the `loadStripe` config option (useful in tests).

## Checkout modes

```ts
await adapter.openCheckout({ order, mode: 'modal' });
// Drop-in overlay — Razorpay & Cashfree.

await adapter.openCheckout({
  order,
  mode: 'redirect',
  returnUrl: 'https://yourapp.com/order/return',
  cancelUrl: 'https://yourapp.com/order/cancel',
});
// Hosted page — all 5 gateways. The Promise never resolves:
// the user navigates away, and your returnUrl handler takes over.
```

Each `BrowserAdapter` exposes a `capabilities` object you can inspect without try/catch:

```ts
if (adapter.capabilities.modal) {
  await open({ order, mode: 'modal' });
} else {
  await open({ order, mode: 'redirect', returnUrl });
}
```

## Error handling

All errors extend `PaymentError`. Import from the root:

```ts
import {
  PaymentError,
  CheckoutLoadError,       // gateway SDK failed to load / timed out
  CheckoutDismissedError,  // user closed the modal
  UnsupportedModeError,    // mode isn't supported by this gateway
  VerificationError,       // signature/hash mismatch or missing fields
  GatewayApiError,         // non-2xx response from gateway API
} from 'payment-universal';

try {
  const result = await open({ order, mode: 'modal' });
} catch (err) {
  if (err instanceof CheckoutDismissedError) {
    return; // user cancelled — don't treat as an error
  }
  if (err instanceof PaymentError) {
    console.error(err.code, err.gateway, err.cause);
  }
  throw err;
}
```

Every error carries:

- `code` — a stable string like `RAZORPAY_SIGNATURE_MISMATCH`, `CASHFREE_CREATE_ORDER_FAILED`.
- `gateway` — `'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe' | undefined`.
- `cause` — the original payload for advanced handling (never your secret).

## TypeScript

All public types are exported from the root:

```ts
import type {
  // adapters
  BrowserAdapter,
  ServerAdapter,
  // requests & responses
  OrderRequest,
  NormalizedOrder,
  CheckoutOptions,
  PaymentResult,
  VerificationResult,
  // shapes
  CustomerInfo,
  Capabilities,
  CheckoutMode,
  GatewayName,
  LoadOptions,
} from 'payment-universal';
```

## SSR safety

Designed from the first commit to run under server rendering:

- Browser adapters guard every `window` / `document` access with `typeof window !== 'undefined'`.
- Browser `load()` rejects on the server with `CheckoutLoadError({ code: 'SSR_LOAD_BLOCKED' })`.
- `useCheckout` (React) only triggers `load()` inside `useEffect`.
- `useCheckout` (Vue) no-ops DOM work if `window` is undefined.
- `CheckoutService` (Angular) uses `PLATFORM_ID` + `isPlatformBrowser`.
- Server adapters use `globalThis.fetch` (Node ≥ 18) + `node:crypto`.

The `"node"` conditional export on every `/server` entry means browser bundlers (webpack, rollup, esbuild, Vite) physically refuse to resolve server code when bundling for the browser target. Secret keys cannot leak into client bundles.

## Security

- **Secrets stay on the server.** Two-tier enforcement is at the bundler level, not a convention.
- **`timingSafeEqual` everywhere.** HMAC (Razorpay) and SHA-512 (PayU) comparisons are constant-time. Lengths are pre-checked to avoid throws.
- **Cashfree / Juspay / Stripe verification is server-to-server authoritative.** The adapter re-fetches payment status from the gateway's API using your secret key, so a tampered client payload cannot forge a `paid` status. Still, **always cross-check `verification.amount` and `verification.orderId` against your own DB record** before fulfilling — the library tells you the gateway's opinion, not yours.
- **All signature / field mismatches throw `VerificationError`**, never silently return `{ verified: false }` without a reason.
- **No secrets in error messages.** `error.cause` holds the gateway's response body, not your keys.

## Tree-shaking

Every gateway and framework lives at a separate subpath export, and `sideEffects: false` is set in `package.json`. Importing `razorpayBrowser` ships only Razorpay's browser adapter. No other gateway code — not even a registry entry — ends up in your bundle.

## Node support

Server adapters require **Node 18+** (`globalThis.fetch` + `node:crypto`). Browser adapters run wherever modern browsers + `fetch` run.

## Out of scope (v1)

By design:

- Subscriptions / mandates / recurring payments — mandate flows differ deeply across gateways; needs its own spec.
- Refunds.
- Webhook signature verification helpers.
- Customer / vault management.
- EMI / UPI Intent / BNPL-specific flows.
- Stripe Elements (embedded card form) — v1 sticks to Stripe Checkout.
- Mobile SDKs (React Native, Flutter).

Some of these are on the v2 roadmap.

## Roadmap

- [x] Core architecture + 5 gateways × {browser, server} + 4 framework adapters
- [x] 61 unit tests, strict TypeScript, clean build
- [x] Two-tier export separation enforced via `"node"` condition
- [ ] Sandbox smoke tests per gateway (in progress)
- [ ] More examples on the [landing page](https://payment-universal.vercel.app/)
- [ ] `1.0.0` release
- [ ] v2: refunds, webhooks, subscriptions

## Development

```bash
git clone https://github.com/Rupam-Shil/payment-universal.git
cd payment-universal
npm install
npm run typecheck   # tsc --noEmit -p tsconfig.test.json
npm test            # vitest run
npm run build       # rollup -c
```

## Contributing

Bug reports and PRs welcome at https://github.com/Rupam-Shil/payment-universal/issues.

## License

[MIT](./LICENSE) © [Rupam Shil](https://github.com/Rupam-Shil)
