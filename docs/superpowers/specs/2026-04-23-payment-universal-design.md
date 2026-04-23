# payment-universal — Design Spec

**Date:** 2026-04-23
**Status:** Approved (brainstorm complete, ready for implementation plan)
**Author:** Rupam Shil (with Claude as collaborator)
**Sibling project:** [`razorpay-universal`](../../../../razorpay-universal/) — single-gateway predecessor; this generalizes that pattern.

---

## 1. Background & motivation

`razorpay-universal` (sibling package, already published on npm) is a framework-agnostic Razorpay checkout SDK with first-class adapters for React, Vue 3, Next.js, Nuxt 3, Angular, and Vanilla JS. It already uses an internal layering of `core/` (gateway-specific) + `adapters/` (framework-specific).

The user (a single maintainer) wants a sibling package that keeps the same framework adapter quality but **abstracts five payment gateways** behind a uniform API:

> **Razorpay, Cashfree, PayU, Juspay, Stripe**

The promise is: **swap one adapter import line, and the rest of the integration stays the same.**

Realistically, this promise has limits — the gateways differ enough that the abstraction must surface capability flags rather than pretend they're identical. The design below makes that explicit.

---

## 2. Decisions locked in during brainstorm

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Audience | **Merchant-facing** — one merchant runs one gateway at a time, may want to switch. | Optimizes for clean swap, lowest-common-denominator API. |
| 2 | Checkout flows | **Both modal and hosted-redirect**, with capability flags. | Honest about gateway capabilities (Juspay/PayU don't have drop-in modals). |
| 3 | Server-side scope | **Browser + thin server helpers** in a separate sub-export. | Without server helpers, the "swap one line" promise is half a lie. |
| 4 | Gateway selection | **Hybrid** — explicit adapter import + single core API. | Tree-shakable, framework-friendly, pattern proven by next-auth / vercel-ai-sdk. |
| 5 | v1 feature scope | **One-time payments only.** Subscriptions / refunds / webhooks deferred to v2. | Smallest scope that proves the abstraction; subscriptions across 5 gateways is a separate project. |
| 6 | Package name | `payment-universal` | Keeps naming family with `razorpay-universal`. |
| 7 | Directory | `/Users/rupamshil/dev/plugins/pay-universal/` | Sibling to `razorpay-universal`. |

---

## 3. Architectural approach (chosen)

**Approach A — Two-tier adapter (browser + server fully separated).**

Each gateway ships **two** distinct adapter factories at separate sub-exports:

```ts
// Client-side (e.g., React component)
import { useCheckout } from 'payment-universal/react';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const { open } = useCheckout(razorpayBrowser({ keyId: PUBLIC_KEY }));

// Server-side (e.g., API route) — different file, different sub-export
import { razorpayServer } from 'payment-universal/razorpay/server';
const order = await razorpayServer({ keyId, keySecret }).createOrder({ ... });
```

### Why this approach (vs alternatives)

- **vs. single unified adapter** — secret keys can't accidentally leak into client bundles, because the server file is *physically not in the browser entry graph*.
- **vs. functional pipeline** — framework hooks (React/Vue) need stateful loading/error tracking; the factory pattern naturally encapsulates that without forcing class-based APIs on users.
- **vs. runtime gateway switching by string** — every adapter would end up bundled. Explicit imports give automatic tree-shaking.

The framework hooks (`useCheckout` for React, `useCheckout` for Vue, `CheckoutService` for Angular, `PaymentClient` for Vanilla) are **gateway-agnostic** — they consume the `BrowserAdapter` interface, not a specific gateway. Swapping gateways means changing which adapter you pass in.

---

## 4. Package layout

```
pay-universal/
├── src/
│   ├── core/
│   │   ├── types.ts              # shared types (PaymentResult, OrderRequest, Capabilities, GatewayName)
│   │   ├── browser-adapter.ts    # BrowserAdapter interface
│   │   ├── server-adapter.ts     # ServerAdapter interface
│   │   ├── loader.ts             # generic idempotent script loader (reused across browser adapters)
│   │   ├── errors.ts             # PaymentError, CheckoutLoadError, CheckoutDismissedError, UnsupportedModeError, VerificationError
│   │   └── index.ts              # public re-exports
│   │
│   ├── gateways/
│   │   ├── razorpay/
│   │   │   ├── browser.ts        # razorpayBrowser({ keyId })
│   │   │   ├── server.ts         # razorpayServer({ keyId, keySecret })
│   │   │   └── types.ts          # gateway-specific raw types
│   │   ├── cashfree/{browser,server,types}.ts
│   │   ├── payu/{browser,server,types}.ts
│   │   ├── juspay/{browser,server,types}.ts
│   │   └── stripe/{browser,server,types}.ts
│   │
│   ├── adapters/                 # framework integrations — gateway-agnostic
│   │   ├── react/useCheckout.ts
│   │   ├── react/index.ts
│   │   ├── vue/useCheckout.ts
│   │   ├── vue/index.ts
│   │   ├── angular/checkout.service.ts
│   │   ├── angular/checkout.module.ts
│   │   ├── angular/index.ts
│   │   ├── vanilla/client.ts
│   │   └── vanilla/index.ts
│   │
│   ├── server/                   # optional convenience layer for server adapters
│   │   └── index.ts              # createPaymentServer(adapter) helper, if useful
│   │
│   ├── index.ts                  # core re-exports (types, errors)
│   └── umd.ts                    # vanilla CDN bundle
│
├── tests/
│   ├── core/
│   ├── gateways/{razorpay,cashfree,payu,juspay,stripe}/
│   └── adapters/{react,vue,angular,vanilla}/
│
├── package.json                  # exports map (see §5)
├── rollup.config.mjs             # multi-entry bundle
├── tsconfig.json
├── tsconfig.test.json
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── LICENSE
└── CLAUDE.md                     # session-persistent project guidance
```

---

## 5. `package.json` exports map (sketch)

```json
{
  "name": "payment-universal",
  "exports": {
    ".":                                 { "types": "./dist/index.d.ts",                       "import": "./dist/index.mjs",                       "require": "./dist/index.cjs" },
    "./react":                           { "types": "./dist/adapters/react/index.d.ts",        "import": "./dist/adapters/react/index.mjs",        "require": "./dist/adapters/react/index.cjs" },
    "./vue":                             { "types": "./dist/adapters/vue/index.d.ts",          "import": "./dist/adapters/vue/index.mjs",          "require": "./dist/adapters/vue/index.cjs" },
    "./angular":                         { "types": "./dist/adapters/angular/index.d.ts",      "import": "./dist/adapters/angular/index.mjs",      "require": "./dist/adapters/angular/index.cjs" },
    "./vanilla":                         { "types": "./dist/adapters/vanilla/index.d.ts",      "import": "./dist/adapters/vanilla/index.mjs",      "require": "./dist/adapters/vanilla/index.cjs" },

    "./razorpay/browser":                { "types": "./dist/gateways/razorpay/browser.d.ts",   "import": "./dist/gateways/razorpay/browser.mjs",   "require": "./dist/gateways/razorpay/browser.cjs" },
    "./razorpay/server":                 { "types": "./dist/gateways/razorpay/server.d.ts",    "node":   "./dist/gateways/razorpay/server.mjs",    "require": "./dist/gateways/razorpay/server.cjs" },

    "./cashfree/browser":                { "types": "./dist/gateways/cashfree/browser.d.ts",   "import": "./dist/gateways/cashfree/browser.mjs",   "require": "./dist/gateways/cashfree/browser.cjs" },
    "./cashfree/server":                 { "types": "./dist/gateways/cashfree/server.d.ts",    "node":   "./dist/gateways/cashfree/server.mjs",    "require": "./dist/gateways/cashfree/server.cjs" },

    "./payu/browser":                    { "types": "./dist/gateways/payu/browser.d.ts",       "import": "./dist/gateways/payu/browser.mjs",       "require": "./dist/gateways/payu/browser.cjs" },
    "./payu/server":                     { "types": "./dist/gateways/payu/server.d.ts",        "node":   "./dist/gateways/payu/server.mjs",        "require": "./dist/gateways/payu/server.cjs" },

    "./juspay/browser":                  { "types": "./dist/gateways/juspay/browser.d.ts",     "import": "./dist/gateways/juspay/browser.mjs",     "require": "./dist/gateways/juspay/browser.cjs" },
    "./juspay/server":                   { "types": "./dist/gateways/juspay/server.d.ts",      "node":   "./dist/gateways/juspay/server.mjs",      "require": "./dist/gateways/juspay/server.cjs" },

    "./stripe/browser":                  { "types": "./dist/gateways/stripe/browser.d.ts",     "import": "./dist/gateways/stripe/browser.mjs",     "require": "./dist/gateways/stripe/browser.cjs" },
    "./stripe/server":                   { "types": "./dist/gateways/stripe/server.d.ts",      "node":   "./dist/gateways/stripe/server.mjs",      "require": "./dist/gateways/stripe/server.cjs" }
  }
}
```

The `"node"` condition (instead of `"import"`) on server entries instructs bundlers to keep them out of browser bundles. Browser-targeting bundlers like webpack/rollup/esbuild will refuse to resolve them when bundling for the browser, providing a hard guardrail against secret-key leakage.

---

## 6. Core types (shared across all adapters)

```ts
// src/core/types.ts

export type GatewayName = 'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe';

export type CheckoutMode = 'modal' | 'redirect';

export interface Capabilities {
  modal: boolean;
  redirect: boolean;
  webhooks: boolean;       // v2
  subscriptions: boolean;  // v2
  refunds: boolean;        // v2
}

export interface CustomerInfo {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface OrderRequest {
  amount: number;                             // smallest currency unit (paise / cents)
  currency: string;                           // ISO 4217 ('INR', 'USD', 'EUR', ...)
  customer?: CustomerInfo;
  notes?: Record<string, string>;
  receipt?: string;                           // merchant-side reference id
}

export interface NormalizedOrder {
  id: string;                                 // gateway's order/intent/session id
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'paid' | 'failed';
  gateway: GatewayName;
  /**
   * Gateway-specific payload the browser adapter needs to launch the checkout.
   * - For modal mode: includes things like `session_token`, `payment_session_id`, etc.
   * - For redirect mode: includes a `url` field with the hosted checkout URL the browser should navigate to,
   *   plus any gateway-specific query params already encoded.
   * The shape per gateway is documented alongside each gateway adapter.
   */
  clientPayload: Record<string, unknown>;
  /** Full raw response from the gateway — escape hatch. */
  raw: unknown;
}

export interface CheckoutOptions {
  order: NormalizedOrder;
  mode?: CheckoutMode;                        // adapter throws UnsupportedModeError if not supported
  prefill?: { name?: string; email?: string; phone?: string };
  theme?: { color?: string };
  /** Required when mode === 'redirect'. */
  returnUrl?: string;
  /** Optional cancel URL for redirect mode. */
  cancelUrl?: string;
}

export interface PaymentResult {
  status: 'success' | 'failure' | 'dismissed';
  orderId: string;
  paymentId?: string;
  /** Gateway-specific verification token (signature, hash, etc.) — opaque to the client. */
  signature?: string;
  gateway: GatewayName;
  raw: unknown;
}

export interface VerificationResult {
  verified: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending';
  gateway: GatewayName;
}

export interface LoadOptions {
  timeout?: number;
  scriptUrl?: string;
}
```

---

## 7. Adapter interfaces

```ts
// src/core/browser-adapter.ts

import type {
  Capabilities, CheckoutOptions, GatewayName,
  LoadOptions, PaymentResult,
} from './types';

export interface BrowserAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  load(options?: LoadOptions): Promise<void>;
  isReady(): boolean;
  openCheckout(options: CheckoutOptions): Promise<PaymentResult>;
  close(): void;
}

// src/core/server-adapter.ts

import type {
  Capabilities, GatewayName, NormalizedOrder,
  OrderRequest, VerificationResult,
} from './types';

export interface ServerAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  createOrder(req: OrderRequest): Promise<NormalizedOrder>;
  /** Accepts the raw payload passed back from the browser; returns normalized verification result. */
  verifyPayment(payload: unknown): Promise<VerificationResult>;
}
```

Each gateway file exports a **factory function** (not a class), e.g.:

```ts
// src/gateways/razorpay/browser.ts
export function razorpayBrowser(config: { keyId: string }): BrowserAdapter { ... }

// src/gateways/razorpay/server.ts
export function razorpayServer(config: { keyId: string; keySecret: string }): ServerAdapter { ... }
```

---

## 8. Capability matrix (v1)

| Gateway   | Modal | Redirect | One-time | Notes |
|-----------|:-----:|:--------:|:--------:|-------|
| Razorpay  |  ✅   |    ✅    |    ✅    | Reuses logic from sibling `razorpay-universal` (loader + checkout). Modal is the existing `checkout.js` flow. |
| Cashfree  |  ✅   |    ✅    |    ✅    | Browser uses `@cashfreepayments/cashfree-js` v3. Server uses Cashfree PG Orders API (`POST /pg/orders`). |
| PayU      |  ❌   |    ✅    |    ✅    | Hosted page only (Bolt is deprecated). Modal mode → `UnsupportedModeError`. Server generates SHA-512 hash. |
| Juspay    |  ❌   |    ✅    |    ✅    | Express Checkout (web) is hosted-only. Server creates session via Juspay HyperCheckout API. |
| Stripe    |  ❌   |    ✅    |    ✅    | v1 uses Stripe Checkout Sessions (hosted). Stripe Elements (embedded) deferred to v2 — different surface. |

`webhooks`, `subscriptions`, and `refunds` are `false` for every adapter in v1.

---

## 9. Data flows

### 9.1 One-time payment, modal mode (Razorpay, Cashfree)

```
[browser]  POST /api/checkout                         { amount, currency, customer, notes }
[server]   adapter.createOrder(req)
           → returns NormalizedOrder { id, amount, currency, status: 'created', clientPayload, gateway }
[browser]  receives NormalizedOrder
[browser]  await openCheckout({ order, mode: 'modal', prefill, theme })
           → adapter.load() if not ready
           → opens modal with order.clientPayload
           → resolves PaymentResult { status: 'success', orderId, paymentId, signature, gateway, raw }
           → or rejects CheckoutDismissedError / PaymentError
[browser]  POST /api/verify  { paymentResult }
[server]   adapter.verifyPayment(paymentResult)
           → returns VerificationResult { verified, orderId, paymentId, amount, status, gateway }
[server]   if verified, mark order paid in your DB
```

### 9.2 One-time payment, redirect mode (PayU, Juspay, Stripe; optional for Razorpay/Cashfree)

```
[browser]  POST /api/checkout                         { amount, currency, customer, notes }
[server]   adapter.createOrder(req)
           → returns NormalizedOrder where clientPayload includes a redirect target
[browser]  receives NormalizedOrder
[browser]  await openCheckout({ order, mode: 'redirect', returnUrl, cancelUrl })
           → adapter.load() if needed (Stripe loads stripe.js to call redirectToCheckout)
           → window.location.assign(...) — Promise never resolves; user leaves the page
[gateway]  user pays on hosted page
[gateway]  redirects to returnUrl with query/body params
[browser]  return-handler page reads params, POSTs to /api/verify
[server]   adapter.verifyPayment(payload)
           → returns VerificationResult
```

---

## 10. Error model

All errors extend a base `PaymentError`:

```ts
// src/core/errors.ts

export class PaymentError extends Error {
  readonly code: string;
  readonly gateway?: GatewayName;
  readonly cause?: unknown;
  constructor(message: string, opts: { code: string; gateway?: GatewayName; cause?: unknown });
}

export class CheckoutLoadError      extends PaymentError {}  // script failed / timeout
export class CheckoutDismissedError extends PaymentError {}  // user closed modal
export class UnsupportedModeError   extends PaymentError {}  // adapter doesn't support requested mode
export class VerificationError      extends PaymentError {}  // signature/hash mismatch
export class GatewayApiError        extends PaymentError {}  // non-2xx response from gateway server API
```

`UnsupportedModeError` is thrown **synchronously** from `openCheckout` so users get an immediate, debuggable failure instead of a runtime surprise.

Each gateway adapter is responsible for normalizing its native error shape into one of these. The original payload is preserved as `cause` for advanced handling.

---

## 11. Framework adapters (gateway-agnostic)

### 11.1 React

```ts
// payment-universal/react
export interface UseCheckoutReturn {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
}

export function useCheckout(adapter: BrowserAdapter, loadOpts?: LoadOptions): UseCheckoutReturn;
```

### 11.2 Vue 3

```ts
// payment-universal/vue
export function useCheckout(adapter: BrowserAdapter, loadOpts?: LoadOptions): {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: Ref<boolean>;
  isReady: Ref<boolean>;
  error: Ref<Error | null>;
};
```

### 11.3 Angular

```ts
// payment-universal/angular
@NgModule({ ... })
export class CheckoutModule {
  static forRoot(adapter: BrowserAdapter, loadOpts?: LoadOptions): ModuleWithProviders<CheckoutModule>;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  load(opts?: LoadOptions): Promise<void>;
  open(opts: CheckoutOptions): Promise<PaymentResult>;
  close(): void;
  isReady(): boolean;
}
```

Uses `PLATFORM_ID` + `isPlatformBrowser` for SSR safety (matching `razorpay-universal`).

### 11.4 Vanilla

```ts
// payment-universal/vanilla
export class PaymentClient {
  constructor(adapter: BrowserAdapter, loadOpts?: LoadOptions);
  load(): Promise<void>;
  open(opts: CheckoutOptions): Promise<PaymentResult>;
  close(): void;
  readonly isReady: boolean;
}
```

UMD bundle exposes `PaymentUniversal` global with `PaymentClient` and adapter factories preloaded for all five gateways (browser-only).

---

## 12. SSR safety

Reusing the patterns from `razorpay-universal`:

- All browser adapters guard `window` / `document` access with `typeof window !== 'undefined'` checks.
- `load()` rejects on the server with a clear error.
- React hook only triggers `load()` inside `useEffect`.
- Vue composable returns refs but does no DOM work until called.
- Angular service uses `PLATFORM_ID` / `isPlatformBrowser`.

Server adapters use `globalThis.fetch` (Node ≥ 18); no Node-specific imports unless absolutely required.

---

## 13. Testing strategy

| Layer | Tool | Approach |
|---|---|---|
| Core types/errors  | Vitest                       | Pure TypeScript unit tests. |
| Loader             | Vitest + jsdom               | Mock `document.head.appendChild`; verify idempotency, timeout, URL validation. |
| Browser adapters   | Vitest + jsdom               | Mock `window.Razorpay` / `window.Cashfree` / `Stripe.redirectToCheckout`; verify normalized output shape. |
| Server adapters    | Vitest + `vi.fn()` for fetch | Mock fetch responses; verify request bodies match each gateway's API contract; verify signature/hash logic. |
| React adapter      | `@testing-library/react`     | Hook lifecycle, error states, with a `fakeAdapter` test double. |
| Vue adapter        | `@vue/test-utils`            | Composable lifecycle, ref reactivity, with `fakeAdapter`. |
| Angular adapter    | Angular `TestBed`            | Service injection, SSR no-op verification. |
| Vanilla            | Vitest + jsdom               | Class lifecycle. |

**No live gateway calls in CI.** A separate `MANUAL_SMOKE_TEST.md` documents how to run a real test transaction against each gateway's sandbox.

A shared `tests/test-utils/fakeAdapter.ts` exports `makeFakeBrowserAdapter()` and `makeFakeServerAdapter()` that the framework adapter tests use — proves the framework code is genuinely gateway-agnostic.

---

## 14. Build / packaging

- **Bundler:** Rollup (matches `razorpay-universal`).
- **Multi-entry:** one entry per gateway × {browser, server}, plus per-framework adapters and the core. Each becomes its own chunk.
- **Output formats:** `.mjs` (ESM), `.cjs` (CommonJS), `.d.ts` (types), plus a single `.umd.js` for vanilla CDN usage.
- **`sideEffects: false`** in `package.json` to enable aggressive tree-shaking.
- **Server entries** use the `"node"` conditional export key so browser bundlers refuse to include them.
- **Peer deps:** React, Vue, Angular all optional (matching `razorpay-universal`); `@cashfreepayments/cashfree-js`, `@stripe/stripe-js` optional peer deps for the gateways that ship official browser SDKs.

---

## 15. Public API examples (for README)

### React

```tsx
'use client';
import { useCheckout } from 'payment-universal/react';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY! });

export function PayButton() {
  const { open, isReady, isLoading, error } = useCheckout(adapter);

  async function handlePay() {
    const order = await fetch('/api/checkout', { method: 'POST' }).then(r => r.json());
    const result = await open({ order, mode: 'modal', prefill: { email: 'jane@example.com' } });
    await fetch('/api/verify', { method: 'POST', body: JSON.stringify(result) });
  }

  return <button onClick={handlePay} disabled={!isReady || isLoading}>Pay</button>;
}
```

### Switching gateway (the whole point)

```diff
- import { razorpayBrowser } from 'payment-universal/razorpay/browser';
- const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY! });
+ import { cashfreeBrowser } from 'payment-universal/cashfree/browser';
+ const adapter = cashfreeBrowser({ appId: process.env.NEXT_PUBLIC_CASHFREE_APP_ID! });
```

The `useCheckout` call, the `open()` call, the result handling, and the verify endpoint all stay the same. Only the adapter import + the server-side adapter import need to change.

### API route (Next.js)

```ts
// app/api/checkout/route.ts
import { razorpayServer } from 'payment-universal/razorpay/server';

const server = razorpayServer({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  const order = await server.createOrder({ amount: 49900, currency: 'INR' });
  return Response.json(order);
}
```

---

## 16. Known challenges & open risks

These are the realities the user should know about going in:

1. **PayU/Juspay/Stripe have no drop-in modal.** The `mode: 'modal'` requirement is genuinely impossible for these in v1. The `UnsupportedModeError` is a feature, not a bug — it surfaces this honestly. Documentation should make this prominent.

2. **Stripe is not India-first.** Stripe's recommended flow in India is regulated by RBI mandate rules. v1 sticks to Stripe Checkout (hosted), which sidesteps most of this.

3. **Cashfree v3 SDK** is the current generation, but Cashfree has had three major SDK versions in 4 years. Plan to track their migration cadence.

4. **PayU hash generation** uses SHA-512 with a specific salt order; bugs here cause silent verification failures. Server-side tests must use real PayU hash test vectors.

5. **Juspay's HyperCheckout API requires merchant onboarding** before sandbox keys are issued. We may need to skip live integration testing for Juspay and ship a best-effort implementation.

6. **Five gateways = five evolving APIs.** Each gateway changes their SDK / API shape every few quarters. Single-maintainer commitment to keep this working over years is real.

7. **No subscriptions in v1** — by design. Adding them later means a separate spec because the mandate models differ deeply (RBI-mandated for Indian gateways; off-session card for Stripe).

8. **Server adapter unit tests rely on mocked fetch.** Real verification correctness is verified in manual smoke tests only. A deferred enhancement is contract tests (e.g., Pact) against gateway sandbox APIs.

---

## 17. Out of scope (v1 explicit non-goals)

- Subscriptions / mandates / recurring payments
- Refunds
- Webhook signature verification helpers
- Customer / vault management
- EMI / UPI Intent / BNPL specific flows
- Stripe Elements (embedded card form) — v1 uses Stripe Checkout only
- Refund webhooks, dispute notifications
- A unified admin dashboard / payment ledger
- Mobile SDKs (React Native, Flutter)
- Server frameworks beyond Node 18+ (no Deno, Bun, Workers in v1 — but the design doesn't preclude them)

---

## 18. Implementation sequencing (high level — detailed plan in next phase)

1. **Scaffold project** — copy `razorpay-universal` layout, drop Razorpay-specific code, set up Rollup multi-entry config.
2. **Implement core** — types, errors, generic loader, base adapter interfaces.
3. **Razorpay adapters first** (browser + server) — proves the abstraction works using the gateway we already understand.
4. **One framework adapter (React)** — proves the gateway-agnostic hook design.
5. **Add Cashfree** — second gateway, validates the abstraction against new gateway.
6. **Add Vue, Angular, Vanilla framework adapters** — once two gateways prove the design, add remaining frameworks.
7. **PayU + Juspay + Stripe** — redirect-only gateways; each adds one gateway adapter pair.
8. **Polish** — documentation, README, examples, smoke-test guide, CHANGELOG.
9. **Release** — npm publish, update landing page (probably reuse the `razorpay-universal/landing/` pattern).

A detailed implementation plan with TDD steps and review checkpoints will be created next via the `superpowers:writing-plans` skill.

---

## 19. Cross-references

- Sibling project: [`/Users/rupamshil/dev/plugins/razorpay-universal/`](../../../../razorpay-universal/) — production patterns to mirror.
- Sibling source files worth studying first:
  - [`razorpay-universal/src/core/loader.ts`](../../../../razorpay-universal/src/core/loader.ts) — generic-enough script loader; lift into `core/loader.ts` with adapter-supplied URL.
  - [`razorpay-universal/src/core/checkout.ts`](../../../../razorpay-universal/src/core/checkout.ts) — Promise-wrapping pattern for `instance.open()`; reuse in `gateways/razorpay/browser.ts`.
  - [`razorpay-universal/src/adapters/react/useRazorpay.ts`](../../../../razorpay-universal/src/adapters/react/useRazorpay.ts) — exact lifecycle pattern for `useCheckout` (rename + parameterize on adapter).
  - [`razorpay-universal/rollup.config.mjs`](../../../../razorpay-universal/rollup.config.mjs) — multi-entry build config to base the new one on.
  - [`razorpay-universal/package.json`](../../../../razorpay-universal/package.json) — exports map structure to extend.
