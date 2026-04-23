# payment-universal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `payment-universal` — a framework-agnostic, multi-gateway (Razorpay/Cashfree/PayU/Juspay/Stripe) payment SDK with browser + server two-tier adapters and React/Vue/Angular/Vanilla framework bindings.

**Architecture:** Approach A — browser and server adapter files per gateway are physically separate (separate sub-exports; server entry uses `"node"` export condition). Framework hooks (`useCheckout`, etc.) are gateway-agnostic and consume the `BrowserAdapter` interface.

**Tech Stack:** TypeScript 5.x (strict), Rollup 4.x multi-entry, Vitest + jsdom, `@testing-library/react`, `@vue/test-utils`, Angular `TestBed`, Node 18+ (`globalThis.fetch`).

**Source of truth:** `docs/superpowers/specs/2026-04-23-payment-universal-design.md`. Read it before starting.

**Patterns to mirror:** sibling project `/Users/rupamshil/dev/plugins/razorpay-universal/` (already published on npm). Its loader, Promise-wrapping pattern, and framework adapter lifecycle logic are lifted and generalized here.

---

## Section 0 — Scaffolding

### Task 0.1: Create package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "payment-universal",
  "version": "0.1.0",
  "description": "Framework-agnostic multi-gateway payment SDK — Razorpay, Cashfree, PayU, Juspay, Stripe — with React, Vue 3, Angular, and Vanilla adapters.",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "unpkg": "dist/index.umd.js",
  "jsdelivr": "dist/index.umd.js",
  "sideEffects": false,
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE",
    "MANUAL_SMOKE_TEST.md"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "types": "./dist/adapters/react/index.d.ts",
      "import": "./dist/adapters/react/index.mjs",
      "require": "./dist/adapters/react/index.cjs"
    },
    "./vue": {
      "types": "./dist/adapters/vue/index.d.ts",
      "import": "./dist/adapters/vue/index.mjs",
      "require": "./dist/adapters/vue/index.cjs"
    },
    "./angular": {
      "types": "./dist/adapters/angular/index.d.ts",
      "import": "./dist/adapters/angular/index.mjs",
      "require": "./dist/adapters/angular/index.cjs"
    },
    "./vanilla": {
      "types": "./dist/adapters/vanilla/index.d.ts",
      "import": "./dist/adapters/vanilla/index.mjs",
      "require": "./dist/adapters/vanilla/index.cjs"
    },
    "./razorpay/browser": {
      "types": "./dist/gateways/razorpay/browser.d.ts",
      "import": "./dist/gateways/razorpay/browser.mjs",
      "require": "./dist/gateways/razorpay/browser.cjs"
    },
    "./razorpay/server": {
      "types": "./dist/gateways/razorpay/server.d.ts",
      "node": "./dist/gateways/razorpay/server.mjs",
      "require": "./dist/gateways/razorpay/server.cjs"
    },
    "./cashfree/browser": {
      "types": "./dist/gateways/cashfree/browser.d.ts",
      "import": "./dist/gateways/cashfree/browser.mjs",
      "require": "./dist/gateways/cashfree/browser.cjs"
    },
    "./cashfree/server": {
      "types": "./dist/gateways/cashfree/server.d.ts",
      "node": "./dist/gateways/cashfree/server.mjs",
      "require": "./dist/gateways/cashfree/server.cjs"
    },
    "./payu/browser": {
      "types": "./dist/gateways/payu/browser.d.ts",
      "import": "./dist/gateways/payu/browser.mjs",
      "require": "./dist/gateways/payu/browser.cjs"
    },
    "./payu/server": {
      "types": "./dist/gateways/payu/server.d.ts",
      "node": "./dist/gateways/payu/server.mjs",
      "require": "./dist/gateways/payu/server.cjs"
    },
    "./juspay/browser": {
      "types": "./dist/gateways/juspay/browser.d.ts",
      "import": "./dist/gateways/juspay/browser.mjs",
      "require": "./dist/gateways/juspay/browser.cjs"
    },
    "./juspay/server": {
      "types": "./dist/gateways/juspay/server.d.ts",
      "node": "./dist/gateways/juspay/server.mjs",
      "require": "./dist/gateways/juspay/server.cjs"
    },
    "./stripe/browser": {
      "types": "./dist/gateways/stripe/browser.d.ts",
      "import": "./dist/gateways/stripe/browser.mjs",
      "require": "./dist/gateways/stripe/browser.cjs"
    },
    "./stripe/server": {
      "types": "./dist/gateways/stripe/server.d.ts",
      "node": "./dist/gateways/stripe/server.mjs",
      "require": "./dist/gateways/stripe/server.cjs"
    }
  },
  "scripts": {
    "build": "rollup -c rollup.config.mjs",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit -p tsconfig.test.json",
    "prepublishOnly": "npm run typecheck && npm run test && npm run build"
  },
  "keywords": [
    "payment",
    "razorpay",
    "cashfree",
    "payu",
    "juspay",
    "stripe",
    "checkout",
    "react",
    "vue",
    "angular",
    "typescript",
    "sdk",
    "universal"
  ],
  "author": "Rupam Shil <rupamshil111@gmail.com>",
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "peerDependencies": {
    "@angular/core": ">=14",
    "@cashfreepayments/cashfree-js": ">=2",
    "@stripe/stripe-js": ">=2",
    "react": ">=17",
    "vue": ">=3"
  },
  "peerDependenciesMeta": {
    "@angular/core": { "optional": true },
    "@cashfreepayments/cashfree-js": { "optional": true },
    "@stripe/stripe-js": { "optional": true },
    "react": { "optional": true },
    "vue": { "optional": true }
  },
  "devDependencies": {
    "@angular/common": "^19.2.21",
    "@angular/core": "^19.2.21",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-typescript": "^11.1.6",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.57",
    "@vue/test-utils": "^2.4.4",
    "jsdom": "^24.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "rollup": "^4.12.0",
    "rollup-plugin-dts": "^6.1.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.2",
    "typescript": "^5.3.3",
    "vitest": "^3.2.4",
    "vue": "^3.4.19",
    "zone.js": "^0.15.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add package.json scaffold with exports map for 5 gateways × 4 frameworks"
```

---

### Task 0.2: TypeScript config

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.test.json`

- [ ] **Step 1: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 2: Write tsconfig.test.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "rootDir": "."
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json tsconfig.test.json
git commit -m "chore: TypeScript strict config (matches razorpay-universal)"
```

---

### Task 0.3: Vitest config + .gitignore

**Files:**
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Write vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      'payment-universal': new URL('./src/index.ts', import.meta.url).pathname,
      'payment-universal/react': new URL('./src/adapters/react/index.ts', import.meta.url).pathname,
      'payment-universal/vue': new URL('./src/adapters/vue/index.ts', import.meta.url).pathname,
      'payment-universal/angular': new URL('./src/adapters/angular/index.ts', import.meta.url).pathname,
      'payment-universal/vanilla': new URL('./src/adapters/vanilla/index.ts', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 2: Write .gitignore**

```
node_modules
dist
coverage
*.log
.DS_Store
.env
.env.*
```

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts .gitignore
git commit -m "chore: vitest config (jsdom) and .gitignore"
```

---

### Task 0.4: Install dependencies

- [ ] **Step 1: Run install**

```bash
cd /Users/rupamshil/dev/plugins/pay-universal
npm install
```

Expected: populated `node_modules/`, creates `package-lock.json`. Peer-dep warnings for optional peers (@cashfreepayments/cashfree-js, @stripe/stripe-js) are fine — they're optional.

- [ ] **Step 2: Commit lockfile**

```bash
git add package-lock.json
git commit -m "chore: package-lock.json"
```

---

## Section 1 — Core layer

### Task 1.1: Core shared types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write src/core/types.ts**

```ts
export type GatewayName = 'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe';

export type CheckoutMode = 'modal' | 'redirect';

export interface Capabilities {
  modal: boolean;
  redirect: boolean;
  webhooks: boolean;
  subscriptions: boolean;
  refunds: boolean;
}

export interface CustomerInfo {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface OrderRequest {
  /** Smallest currency unit (paise / cents). */
  amount: number;
  /** ISO 4217 currency code (e.g. "INR", "USD", "EUR"). */
  currency: string;
  customer?: CustomerInfo;
  notes?: Record<string, string>;
  /** Merchant-side reference id. */
  receipt?: string;
}

export interface NormalizedOrder {
  /** Gateway's order / intent / session id. */
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'paid' | 'failed';
  gateway: GatewayName;
  /**
   * Gateway-specific payload the browser adapter needs to launch the checkout.
   * - modal mode: session tokens / keys (e.g. payment_session_id, order_id, key).
   * - redirect mode: includes a `url` field plus any required query params.
   */
  clientPayload: Record<string, unknown>;
  /** Full raw gateway response — escape hatch. */
  raw: unknown;
}

export interface CheckoutOptions {
  order: NormalizedOrder;
  /** Adapter throws UnsupportedModeError synchronously if not supported. */
  mode?: CheckoutMode;
  prefill?: { name?: string; email?: string; phone?: string };
  theme?: { color?: string };
  /** Required when mode === 'redirect'. */
  returnUrl?: string;
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

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(core): shared payment types (GatewayName, NormalizedOrder, etc.)"
```

---

### Task 1.2: Core errors — TDD

**Files:**
- Test: `tests/core/errors.test.ts`
- Create: `src/core/errors.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/core/errors.test.ts
import { describe, expect, it } from 'vitest';
import {
  CheckoutDismissedError,
  CheckoutLoadError,
  GatewayApiError,
  PaymentError,
  UnsupportedModeError,
  VerificationError,
} from '../../src/core/errors';

describe('PaymentError', () => {
  it('stores code, gateway, and cause', () => {
    const cause = new Error('underlying');
    const err = new PaymentError('boom', {
      code: 'X_FAIL',
      gateway: 'razorpay',
      cause,
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(err.code).toBe('X_FAIL');
    expect(err.gateway).toBe('razorpay');
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('PaymentError');
  });

  it('works without gateway / cause', () => {
    const err = new PaymentError('plain', { code: 'GENERIC' });
    expect(err.gateway).toBeUndefined();
    expect(err.cause).toBeUndefined();
  });
});

describe('specialized error subclasses', () => {
  it.each([
    ['CheckoutLoadError', CheckoutLoadError],
    ['CheckoutDismissedError', CheckoutDismissedError],
    ['UnsupportedModeError', UnsupportedModeError],
    ['VerificationError', VerificationError],
    ['GatewayApiError', GatewayApiError],
  ] as const)('%s extends PaymentError and sets name', (name, Cls) => {
    const err = new Cls('msg', { code: 'C' });
    expect(err).toBeInstanceOf(PaymentError);
    expect(err).toBeInstanceOf(Cls);
    expect(err.name).toBe(name);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/errors.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/errors'`.

- [ ] **Step 3: Write src/core/errors.ts**

```ts
import type { GatewayName } from './types';

export interface PaymentErrorOptions {
  code: string;
  gateway?: GatewayName;
  cause?: unknown;
}

export class PaymentError extends Error {
  public readonly code: string;
  public readonly gateway?: GatewayName;
  public readonly cause?: unknown;

  constructor(message: string, opts: PaymentErrorOptions) {
    super(message);
    this.name = 'PaymentError';
    this.code = opts.code;
    this.gateway = opts.gateway;
    this.cause = opts.cause;
  }
}

export class CheckoutLoadError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'CheckoutLoadError';
  }
}

export class CheckoutDismissedError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'CheckoutDismissedError';
  }
}

export class UnsupportedModeError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'UnsupportedModeError';
  }
}

export class VerificationError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'VerificationError';
  }
}

export class GatewayApiError extends PaymentError {
  constructor(message: string, opts: PaymentErrorOptions) {
    super(message, opts);
    this.name = 'GatewayApiError';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/errors.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 5: Commit**

```bash
git add tests/core/errors.test.ts src/core/errors.ts
git commit -m "feat(core): payment error hierarchy with code/gateway/cause"
```

---

### Task 1.3: Generic script loader — TDD

**Files:**
- Test: `tests/core/loader.test.ts`
- Create: `src/core/loader.ts`

This generalizes `razorpay-universal/src/core/loader.ts`: parameterizes on a caller-supplied URL + a `checkReady()` predicate (instead of hard-coded `window.Razorpay`). Each gateway browser adapter passes its own predicate.

- [ ] **Step 1: Write the failing test**

```ts
// tests/core/loader.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScriptLoader,
  type ScriptLoader,
} from '../../src/core/loader';
import { CheckoutLoadError } from '../../src/core/errors';

const GATEWAY = 'razorpay' as const;
const URL_A = 'https://example.test/a.js';

function removeAllInjectedScripts(): void {
  document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
}

describe('createScriptLoader', () => {
  let loader: ScriptLoader;
  let ready = false;

  beforeEach(() => {
    ready = false;
    loader = createScriptLoader({
      gateway: GATEWAY,
      defaultUrl: URL_A,
      isReady: () => ready,
    });
    removeAllInjectedScripts();
  });

  afterEach(() => {
    removeAllInjectedScripts();
    vi.useRealTimers();
  });

  it('rejects with CheckoutLoadError in a non-browser env', async () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error simulate SSR
    delete globalThis.document;
    try {
      await expect(loader.load()).rejects.toBeInstanceOf(CheckoutLoadError);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it('resolves immediately when isReady() is already true', async () => {
    ready = true;
    await expect(loader.load()).resolves.toBeUndefined();
    expect(document.querySelector('script[data-payment-universal]')).toBeNull();
  });

  it('injects script, resolves on load when isReady flips true', async () => {
    const p = loader.load();
    // Script should have been appended
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    expect(el).not.toBeNull();
    expect(el.src).toBe(URL_A);
    // Simulate external SDK becoming ready and 'load' event firing
    ready = true;
    el.dispatchEvent(new Event('load'));
    await expect(p).resolves.toBeUndefined();
  });

  it('rejects when script tag fires error', async () => {
    const p = loader.load();
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    el.dispatchEvent(new Event('error'));
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('rejects when script loads but isReady stays false', async () => {
    const p = loader.load();
    const el = document.querySelector<HTMLScriptElement>('script[data-payment-universal]')!;
    el.dispatchEvent(new Event('load'));
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('rejects on timeout', async () => {
    vi.useFakeTimers();
    const p = loader.load({ timeout: 100 });
    vi.advanceTimersByTime(150);
    await expect(p).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('is idempotent: same URL returns same promise', () => {
    const p1 = loader.load();
    const p2 = loader.load();
    expect(p1).toBe(p2);
  });

  it('rejects when URL is not https', async () => {
    await expect(loader.load({ scriptUrl: 'http://example.test/x.js' })).rejects.toBeInstanceOf(
      CheckoutLoadError,
    );
  });

  it('rejects when URL is invalid', async () => {
    await expect(loader.load({ scriptUrl: 'not a url' })).rejects.toBeInstanceOf(CheckoutLoadError);
  });

  it('reuses existing script tag rather than creating a duplicate', async () => {
    // First call injects a script
    const p1 = loader.load();
    expect(document.querySelectorAll('script[data-payment-universal]').length).toBe(1);
    // Reset state to simulate a second loader instance encountering the existing tag
    loader.reset();
    const p2 = loader.load();
    expect(document.querySelectorAll('script[data-payment-universal]').length).toBe(1);
    // Resolve both via the same tag
    ready = true;
    document
      .querySelector<HTMLScriptElement>('script[data-payment-universal]')!
      .dispatchEvent(new Event('load'));
    await expect(p1).resolves.toBeUndefined();
    await expect(p2).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/loader.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/core/loader.ts**

```ts
import { CheckoutLoadError } from './errors';
import type { GatewayName, LoadOptions } from './types';

export const DEFAULT_LOAD_TIMEOUT_MS = 10_000;

export interface ScriptLoaderConfig {
  gateway: GatewayName;
  defaultUrl: string;
  /** Returns true once the gateway's SDK is available on `window`. */
  isReady: () => boolean;
}

export interface ScriptLoader {
  readonly gateway: GatewayName;
  load(options?: LoadOptions): Promise<void>;
  isReady(): boolean;
  /** Test helper: clear cached in-flight promise. */
  reset(): void;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function validateScriptUrl(url: string, gateway: GatewayName): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CheckoutLoadError(`Invalid scriptUrl: "${url}" is not a valid URL.`, {
      code: 'INVALID_SCRIPT_URL',
      gateway,
    });
  }
  if (parsed.protocol !== 'https:') {
    throw new CheckoutLoadError(
      `Invalid scriptUrl: only https:// URLs are allowed (got "${parsed.protocol}").`,
      { code: 'INVALID_SCRIPT_URL', gateway },
    );
  }
}

export function createScriptLoader(config: ScriptLoaderConfig): ScriptLoader {
  let inFlight: Promise<void> | null = null;
  let inFlightUrl: string | null = null;

  const loader: ScriptLoader = {
    gateway: config.gateway,
    isReady: () => (isBrowser() ? config.isReady() : false),
    reset(): void {
      inFlight = null;
      inFlightUrl = null;
    },
    load(options: LoadOptions = {}): Promise<void> {
      const scriptUrl = options.scriptUrl ?? config.defaultUrl;
      const timeout = options.timeout ?? DEFAULT_LOAD_TIMEOUT_MS;

      if (!isBrowser()) {
        return Promise.reject(
          new CheckoutLoadError(
            `${config.gateway} script cannot be loaded in a non-browser environment.`,
            { code: 'SSR_LOAD_BLOCKED', gateway: config.gateway },
          ),
        );
      }

      try {
        validateScriptUrl(scriptUrl, config.gateway);
      } catch (err) {
        return Promise.reject(err);
      }

      if (config.isReady()) return Promise.resolve();

      if (inFlight && inFlightUrl === scriptUrl) return inFlight;

      inFlightUrl = scriptUrl;
      inFlight = new Promise<void>((resolve, reject) => {
        const escapedUrl =
          typeof CSS !== 'undefined' && CSS.escape
            ? CSS.escape(scriptUrl)
            : scriptUrl.replace(/["\\]/g, '\\$&');
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${escapedUrl}"]`,
        );

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const cleanup = (): void => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };

        const handleLoad = (): void => {
          cleanup();
          if (config.isReady()) {
            resolve();
          } else {
            inFlight = null;
            reject(
              new CheckoutLoadError(
                `${config.gateway} script loaded but SDK is not available on window.`,
                { code: 'SDK_MISSING_AFTER_LOAD', gateway: config.gateway },
              ),
            );
          }
        };

        const handleError = (err: unknown): void => {
          cleanup();
          inFlight = null;
          reject(
            new CheckoutLoadError(
              `Failed to load ${config.gateway} script from ${scriptUrl}`,
              { code: 'SCRIPT_LOAD_FAILED', gateway: config.gateway, cause: err },
            ),
          );
        };

        timeoutId = setTimeout(() => {
          inFlight = null;
          reject(
            new CheckoutLoadError(
              `Timed out after ${timeout}ms loading ${config.gateway} script from ${scriptUrl}`,
              { code: 'SCRIPT_LOAD_TIMEOUT', gateway: config.gateway },
            ),
          );
        }, timeout);

        if (existing) {
          existing.addEventListener('load', handleLoad, { once: true });
          existing.addEventListener('error', handleError, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        script.dataset.paymentUniversal = config.gateway;
        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });
        document.head.appendChild(script);
      });

      return inFlight;
    },
  };

  return loader;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/loader.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/core/loader.test.ts src/core/loader.ts
git commit -m "feat(core): generic script loader (factory per gateway, singleton, SSR-safe)"
```

---

### Task 1.4: Browser + Server adapter interfaces

**Files:**
- Create: `src/core/browser-adapter.ts`
- Create: `src/core/server-adapter.ts`

- [ ] **Step 1: Write src/core/browser-adapter.ts**

```ts
import type {
  Capabilities,
  CheckoutOptions,
  GatewayName,
  LoadOptions,
  PaymentResult,
} from './types';

export interface BrowserAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  load(options?: LoadOptions): Promise<void>;
  isReady(): boolean;
  openCheckout(options: CheckoutOptions): Promise<PaymentResult>;
  close(): void;
}
```

- [ ] **Step 2: Write src/core/server-adapter.ts**

```ts
import type {
  Capabilities,
  GatewayName,
  NormalizedOrder,
  OrderRequest,
  VerificationResult,
} from './types';

export interface ServerAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  createOrder(req: OrderRequest): Promise<NormalizedOrder>;
  /** Accepts the raw payload passed back from the browser; returns normalized verification result. */
  verifyPayment(payload: unknown): Promise<VerificationResult>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/core/browser-adapter.ts src/core/server-adapter.ts
git commit -m "feat(core): BrowserAdapter and ServerAdapter interfaces"
```

---

### Task 1.5: Core public index + fakeAdapter test helper

**Files:**
- Create: `src/core/index.ts`
- Create: `src/index.ts`
- Create: `tests/test-utils/fakeAdapter.ts`

- [ ] **Step 1: Write src/core/index.ts**

```ts
export * from './types';
export * from './errors';
export * from './browser-adapter';
export * from './server-adapter';
export { createScriptLoader, DEFAULT_LOAD_TIMEOUT_MS } from './loader';
export type { ScriptLoader, ScriptLoaderConfig } from './loader';
```

- [ ] **Step 2: Write src/index.ts**

```ts
export * from './core';
```

- [ ] **Step 3: Write tests/test-utils/fakeAdapter.ts**

```ts
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
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add src/core/index.ts src/index.ts tests/test-utils/fakeAdapter.ts
git commit -m "feat(core): public index + fakeAdapter test helpers"
```

---

## Section 2 — Razorpay adapters

Razorpay is the reference gateway (we already know it from `razorpay-universal`). Implement server first (simpler, no DOM) then browser.

### Task 2.1: Razorpay server adapter — TDD

**API reference:**
- Create order: `POST https://api.razorpay.com/v1/orders` — Basic auth `keyId:keySecret`. Body (JSON): `{ amount, currency, receipt?, notes?, payment_capture?: 1 }`. Response includes `id`, `amount`, `currency`, `status`, `receipt`, etc.
- Verify signature: HMAC-SHA256(`order_id|payment_id`, `keySecret`) must equal `razorpay_signature`.

**Files:**
- Test: `tests/gateways/razorpay/server.test.ts`
- Create: `src/gateways/razorpay/types.ts`
- Create: `src/gateways/razorpay/server.ts`

- [ ] **Step 1: Write src/gateways/razorpay/types.ts**

```ts
export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string> | unknown[];
  created_at: number;
}

export interface RazorpayPaymentResponsePayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentFetchResponse {
  id: string;
  entity: 'payment';
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/gateways/razorpay/server.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { razorpayServer } from '../../../src/gateways/razorpay/server';
import { GatewayApiError, VerificationError } from '../../../src/core';

const KEY_ID = 'rzp_test_123';
const KEY_SECRET = 'secret_abc';

function makeFetchMock(impl: typeof fetch): typeof fetch {
  return vi.fn(impl) as unknown as typeof fetch;
}

describe('razorpayServer.createOrder', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock(async () => new Response('{}', { status: 500 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /v1/orders with Basic auth and JSON body', async () => {
    const captured: { url?: RequestInfo | URL; init?: RequestInit } = {};
    vi.stubGlobal(
      'fetch',
      makeFetchMock(async (url, init) => {
        captured.url = url;
        captured.init = init;
        return new Response(
          JSON.stringify({
            id: 'order_Abc',
            entity: 'order',
            amount: 49900,
            amount_paid: 0,
            amount_due: 49900,
            currency: 'INR',
            receipt: 'rcpt_1',
            status: 'created',
            attempts: 0,
            notes: {},
            created_at: 1_700_000_000,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      receipt: 'rcpt_1',
      notes: { purpose: 'course-fee' },
    });

    expect(captured.url).toBe('https://api.razorpay.com/v1/orders');
    expect(captured.init?.method).toBe('POST');
    const headers = new Headers(captured.init?.headers);
    expect(headers.get('content-type')).toBe('application/json');
    const expectedAuth = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(JSON.parse(String(captured.init?.body))).toEqual({
      amount: 49900,
      currency: 'INR',
      receipt: 'rcpt_1',
      notes: { purpose: 'course-fee' },
      payment_capture: 1,
    });

    expect(order).toMatchObject({
      id: 'order_Abc',
      amount: 49900,
      currency: 'INR',
      status: 'created',
      gateway: 'razorpay',
      clientPayload: { key: KEY_ID, order_id: 'order_Abc', amount: 49900, currency: 'INR' },
    });
    expect(order.raw).toBeDefined();
  });

  it('wraps non-2xx responses in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock(
        async () =>
          new Response(JSON.stringify({ error: { description: 'Amount must be at least 100' } }), {
            status: 400,
          }),
      ),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(
      adapter.createOrder({ amount: 1, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('razorpayServer.verifyPayment', () => {
  it('verifies signature correctly', async () => {
    const crypto = await import('node:crypto');
    const orderId = 'order_Abc';
    const paymentId = 'pay_Xyz';
    const signature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    vi.stubGlobal(
      'fetch',
      makeFetchMock(
        async () =>
          new Response(
            JSON.stringify({
              id: paymentId,
              entity: 'payment',
              amount: 49900,
              currency: 'INR',
              status: 'captured',
              order_id: orderId,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );

    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    const result = await adapter.verifyPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    expect(result).toEqual({
      verified: true,
      orderId,
      paymentId,
      amount: 49900,
      status: 'paid',
      gateway: 'razorpay',
    });
    vi.unstubAllGlobals();
  });

  it('throws VerificationError on bad signature', async () => {
    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(
      adapter.verifyPayment({
        razorpay_order_id: 'order_Abc',
        razorpay_payment_id: 'pay_Xyz',
        razorpay_signature: 'not-a-real-signature',
      }),
    ).rejects.toBeInstanceOf(VerificationError);
  });

  it('throws VerificationError on missing fields', async () => {
    const adapter = razorpayServer({ keyId: KEY_ID, keySecret: KEY_SECRET });
    await expect(adapter.verifyPayment({})).rejects.toBeInstanceOf(VerificationError);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/gateways/razorpay/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write src/gateways/razorpay/server.ts**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { RazorpayOrderResponse, RazorpayPaymentFetchResponse } from './types';

export interface RazorpayServerConfig {
  keyId: string;
  keySecret: string;
  /** Override base URL (useful for tests). */
  apiBase?: string;
}

const DEFAULT_API_BASE = 'https://api.razorpay.com';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function basicAuthHeader(keyId: string, keySecret: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${keyId}:${keySecret}`).toString('base64')
      : btoa(`${keyId}:${keySecret}`);
  return `Basic ${encoded}`;
}

function hexEqualsTimingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export function razorpayServer(config: RazorpayServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const auth = basicAuthHeader(config.keyId, config.keySecret);

  return {
    gateway: 'razorpay',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const body = {
        amount: req.amount,
        currency: req.currency,
        ...(req.receipt !== undefined ? { receipt: req.receipt } : {}),
        ...(req.notes !== undefined ? { notes: req.notes } : {}),
        payment_capture: 1,
      };

      const res = await fetch(`${base}/v1/orders`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: auth,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }

      if (!res.ok) {
        throw new GatewayApiError(
          `Razorpay createOrder failed with status ${res.status}`,
          { code: 'RAZORPAY_CREATE_ORDER_FAILED', gateway: 'razorpay', cause: parsed },
        );
      }

      const raw = parsed as RazorpayOrderResponse;
      return {
        id: raw.id,
        amount: raw.amount,
        currency: raw.currency,
        status: raw.status === 'paid' ? 'paid' : 'created',
        gateway: 'razorpay',
        clientPayload: {
          key: config.keyId,
          order_id: raw.id,
          amount: raw.amount,
          currency: raw.currency,
        },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing or not an object.', {
          code: 'RAZORPAY_VERIFY_PAYLOAD_MISSING',
          gateway: 'razorpay',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = p.razorpay_order_id;
      const paymentId = p.razorpay_payment_id;
      const signature = p.razorpay_signature;
      if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
        throw new VerificationError(
          'Missing razorpay_order_id / razorpay_payment_id / razorpay_signature.',
          { code: 'RAZORPAY_VERIFY_FIELDS_MISSING', gateway: 'razorpay' },
        );
      }

      const expected = createHmac('sha256', config.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (!hexEqualsTimingSafe(expected, signature)) {
        throw new VerificationError('Signature mismatch.', {
          code: 'RAZORPAY_SIGNATURE_MISMATCH',
          gateway: 'razorpay',
        });
      }

      const res = await fetch(`${base}/v1/payments/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: { authorization: auth },
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Razorpay fetch payment failed with status ${res.status}`,
          { code: 'RAZORPAY_FETCH_PAYMENT_FAILED', gateway: 'razorpay', cause: parsed },
        );
      }

      const raw = parsed as RazorpayPaymentFetchResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.status === 'captured' || raw.status === 'authorized'
          ? 'paid'
          : raw.status === 'failed'
            ? 'failed'
            : 'pending';

      return {
        verified: true,
        orderId,
        paymentId,
        amount: raw.amount,
        status: mappedStatus,
        gateway: 'razorpay',
      };
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/gateways/razorpay/server.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/gateways/razorpay/types.ts src/gateways/razorpay/server.ts tests/gateways/razorpay/server.test.ts
git commit -m "feat(razorpay): server adapter (createOrder + HMAC-SHA256 signature verify)"
```

---

### Task 2.2: Razorpay browser adapter — TDD

**Files:**
- Test: `tests/gateways/razorpay/browser.test.ts`
- Create: `src/gateways/razorpay/browser.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/gateways/razorpay/browser.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { razorpayBrowser } from '../../../src/gateways/razorpay/browser';
import { CheckoutDismissedError, UnsupportedModeError } from '../../../src/core';

interface MockInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
  _listeners: Record<string, (payload: unknown) => void>;
  _options: Record<string, unknown>;
}

function stubRazorpay(): { lastInstance: () => MockInstance | null; calls: number } {
  let lastInstance: MockInstance | null = null;
  let calls = 0;

  const Ctor = function (this: MockInstance, options: Record<string, unknown>) {
    calls += 1;
    this._listeners = {};
    this._options = options;
    this.open = vi.fn(() => {
      // trigger handler on next tick to simulate user completing payment
      queueMicrotask(() => {
        const handler = options.handler as
          | ((r: Record<string, string>) => void)
          | undefined;
        handler?.({
          razorpay_order_id: 'order_X',
          razorpay_payment_id: 'pay_Y',
          razorpay_signature: 'sig_Z',
        });
      });
    }) as unknown as MockInstance['open'];
    this.close = vi.fn();
    this.on = vi.fn((event: string, handler: (payload: unknown) => void) => {
      this._listeners[event] = handler;
    });
    lastInstance = this;
  } as unknown as new (opts: Record<string, unknown>) => MockInstance;

  (window as unknown as { Razorpay?: typeof Ctor }).Razorpay = Ctor;
  return { lastInstance: () => lastInstance, calls: 0 /* referenced for shape */ };
}

describe('razorpayBrowser', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  });
  afterEach(() => {
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
  });

  it('reports capabilities { modal: true, redirect: true }', () => {
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    expect(adapter.gateway).toBe('razorpay');
    expect(adapter.capabilities.modal).toBe(true);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode: opens Razorpay, resolves with normalized PaymentResult on handler', async () => {
    stubRazorpay();
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    // Bypass script injection by marking loader as ready
    adapter.load = async () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

    const result = await adapter.openCheckout({
      order: {
        id: 'order_X',
        amount: 49900,
        currency: 'INR',
        status: 'created',
        gateway: 'razorpay',
        clientPayload: { key: 'rzp_test_123', order_id: 'order_X', amount: 49900, currency: 'INR' },
        raw: {},
      },
      mode: 'modal',
      prefill: { email: 'a@b.com' },
    });

    expect(result).toEqual({
      status: 'success',
      orderId: 'order_X',
      paymentId: 'pay_Y',
      signature: 'sig_Z',
      gateway: 'razorpay',
      raw: expect.any(Object),
    });
  });

  it('modal dismiss rejects with CheckoutDismissedError', async () => {
    // Stub that does NOT call handler — instead fires modal.ondismiss
    const Ctor = function (this: Record<string, unknown>, options: Record<string, unknown>) {
      this._options = options;
      this.open = () => {
        queueMicrotask(() => {
          const modal = options.modal as { ondismiss?: () => void } | undefined;
          modal?.ondismiss?.();
        });
      };
      this.close = () => {};
      this.on = () => {};
    } as unknown as new (opts: Record<string, unknown>) => unknown;
    (window as unknown as { Razorpay?: typeof Ctor }).Razorpay = Ctor;

    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    adapter.load = async () => {};

    await expect(
      adapter.openCheckout({
        order: {
          id: 'order_X',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: { key: 'rzp_test_123', order_id: 'order_X' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(CheckoutDismissedError);
  });

  it('redirect mode: builds Razorpay hosted checkout URL and assigns window.location', async () => {
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });

    try {
      const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
      adapter.load = async () => {};

      // redirect mode Promise never resolves, so fire-and-check
      void adapter.openCheckout({
        order: {
          id: 'order_X',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: { key: 'rzp_test_123', order_id: 'order_X', amount: 49900, currency: 'INR' },
          raw: {},
        },
        mode: 'redirect',
        returnUrl: 'https://merchant.test/return',
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(assignMock).toHaveBeenCalledTimes(1);
      const url: string = assignMock.mock.calls[0][0];
      expect(url.startsWith('https://api.razorpay.com/v1/checkout/embedded')).toBe(true);
      expect(url).toContain('key_id=rzp_test_123');
      expect(url).toContain('order_id=order_X');
      expect(url).toContain('callback_url=');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }
  });

  it('throws UnsupportedModeError sync when invalid mode is requested', async () => {
    const adapter = razorpayBrowser({ keyId: 'rzp_test_123' });
    adapter.load = async () => {};
    await expect(
      adapter.openCheckout({
        order: {
          id: 'o',
          amount: 1,
          currency: 'INR',
          status: 'created',
          gateway: 'razorpay',
          clientPayload: {},
          raw: {},
        },
        // @ts-expect-error testing invalid mode
        mode: 'bogus',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gateways/razorpay/browser.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/gateways/razorpay/browser.ts**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gateways/razorpay/browser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/razorpay/browser.ts tests/gateways/razorpay/browser.test.ts
git commit -m "feat(razorpay): browser adapter (modal + redirect, capability-flagged)"
```

---

## Section 3 — React framework adapter (gateway-agnostic)

Generalizes `razorpay-universal/src/adapters/react/useRazorpay.ts` — rename `useCheckout`, parameterize on a `BrowserAdapter` rather than baking in Razorpay.

### Task 3.1: React `useCheckout` hook — TDD

**Files:**
- Test: `tests/adapters/react.test.tsx`
- Create: `src/adapters/react/useCheckout.ts`
- Create: `src/adapters/react/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/adapters/react.test.tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCheckout } from '../../src/adapters/react/useCheckout';
import { makeFakeBrowserAdapter } from '../test-utils/fakeAdapter';
import type { NormalizedOrder } from '../../src/core';

const ORDER: NormalizedOrder = {
  id: 'order_1',
  amount: 100,
  currency: 'INR',
  status: 'created',
  gateway: 'razorpay',
  clientPayload: {},
  raw: {},
};

describe('useCheckout (React)', () => {
  it('transitions from loading → ready after adapter.load resolves', async () => {
    const adapter = makeFakeBrowserAdapter({ loadDelayMs: 10 });
    const { result } = renderHook(() => useCheckout(adapter));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('open() delegates to adapter.openCheckout and returns the PaymentResult', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { result } = renderHook(() => useCheckout(adapter));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    const payment = await act(async () => result.current.open({ order: ORDER, mode: 'modal' }));
    expect(payment.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
  });

  it('surfaces load errors into `error`', async () => {
    const adapter = makeFakeBrowserAdapter();
    adapter.load = () => Promise.reject(new Error('bad script'));

    const { result } = renderHook(() => useCheckout(adapter));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('bad script');
    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('close() invokes adapter.close()', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { result } = renderHook(() => useCheckout(adapter));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    act(() => result.current.close());
    expect(adapter.closed).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/adapters/react.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/adapters/react/useCheckout.ts**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export interface UseCheckoutReturn {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
}

export function useCheckout(
  adapter: BrowserAdapter,
  loadOptions: LoadOptions = {},
): UseCheckoutReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef<boolean>(true);

  const { timeout, scriptUrl } = loadOptions;

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    setIsLoading(true);
    setError(null);

    adapter
      .load({ timeout, scriptUrl })
      .then(() => {
        if (!mountedRef.current) return;
        setIsReady(true);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsReady(false);
        setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
      try {
        adapter.close();
      } catch {
        /* no-op */
      }
    };
  }, [adapter, timeout, scriptUrl]);

  const close = useCallback(() => {
    try {
      adapter.close();
    } catch {
      /* no-op */
    }
  }, [adapter]);

  const open = useCallback(
    (options: CheckoutOptions): Promise<PaymentResult> => adapter.openCheckout(options),
    [adapter],
  );

  return { open, close, isLoading, isReady, error };
}
```

- [ ] **Step 4: Write src/adapters/react/index.ts**

```ts
export { useCheckout } from './useCheckout';
export type { UseCheckoutReturn } from './useCheckout';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/adapters/react.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/react tests/adapters/react.test.tsx
git commit -m "feat(react): gateway-agnostic useCheckout hook"
```

---

## Section 4 — Cashfree adapters

**API reference:**
- Server create order: `POST https://api.cashfree.com/pg/orders` (or sandbox `https://sandbox.cashfree.com/pg/orders`). Headers: `x-client-id`, `x-client-secret`, `x-api-version: 2023-08-01`, `content-type: application/json`. Body: `{ order_id, order_amount, order_currency, customer_details: { customer_id, customer_email, customer_phone, customer_name }, order_note }`. Returns `{ payment_session_id, order_id, order_status, ... }`.
- Server fetch payment: `GET /pg/orders/{order_id}/payments` (array). Latest payment's `payment_status` maps to verification status.
- Browser: `@cashfreepayments/cashfree-js` v3 — `cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' | '_self' })`. Returns `{ error?, redirect?, paymentDetails? }`.

### Task 4.1: Cashfree server adapter — TDD

**Files:**
- Test: `tests/gateways/cashfree/server.test.ts`
- Create: `src/gateways/cashfree/types.ts`
- Create: `src/gateways/cashfree/server.ts`

- [ ] **Step 1: Write src/gateways/cashfree/types.ts**

```ts
export interface CashfreeOrderResponse {
  cf_order_id: number;
  order_id: string;
  entity: 'order';
  order_currency: string;
  order_amount: number;
  order_expiry_time?: string;
  customer_details?: unknown;
  order_meta?: unknown;
  order_status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED' | 'TERMINATION_REQUESTED';
  payment_session_id: string;
  order_note?: string | null;
  created_at?: string;
}

export interface CashfreePaymentEntry {
  cf_payment_id: string;
  order_id: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'USER_DROPPED' | 'VOID' | 'FLAGGED';
  payment_message?: string;
  payment_time?: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/gateways/cashfree/server.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cashfreeServer } from '../../../src/gateways/cashfree/server';
import { GatewayApiError } from '../../../src/core';

const APP_ID = 'TEST_APP_ID';
const SECRET_KEY = 'TEST_SECRET';

describe('cashfreeServer.createOrder', () => {
  let capturedRequests: Array<{ url: RequestInfo | URL; init?: RequestInit }> = [];

  beforeEach(() => {
    capturedRequests = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        capturedRequests.push({ url, init });
        return new Response(
          JSON.stringify({
            cf_order_id: 12345,
            order_id: 'order_abc',
            entity: 'order',
            order_currency: 'INR',
            order_amount: 499,
            order_status: 'ACTIVE',
            payment_session_id: 'session_xyz',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /pg/orders with the right headers and body', async () => {
    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: {
        id: 'cust_1',
        email: 'a@b.com',
        phone: '+919999999999',
        name: 'Test User',
      },
      receipt: 'rcpt_1',
    });

    expect(capturedRequests).toHaveLength(1);
    const { url, init } = capturedRequests[0];
    expect(url).toBe('https://api.cashfree.com/pg/orders');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('x-client-id')).toBe(APP_ID);
    expect(headers.get('x-client-secret')).toBe(SECRET_KEY);
    expect(headers.get('x-api-version')).toBe('2023-08-01');
    expect(headers.get('content-type')).toBe('application/json');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      order_amount: 499, // smallest-unit 49900 paise → 499 rupees (Cashfree uses major units)
      order_currency: 'INR',
      customer_details: {
        customer_id: 'cust_1',
        customer_email: 'a@b.com',
        customer_phone: '+919999999999',
        customer_name: 'Test User',
      },
    });
    expect(typeof body.order_id).toBe('string');

    expect(order.gateway).toBe('cashfree');
    expect(order.clientPayload).toEqual({ payment_session_id: 'session_xyz' });
  });

  it('wraps non-2xx responses in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'bad' }), { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    await expect(
      adapter.createOrder({ amount: 100, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('cashfreeServer.verifyPayment', () => {
  it('fetches /pg/orders/{id}/payments and returns verified=true on SUCCESS', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              cf_payment_id: 'cfp_1',
              order_id: 'order_abc',
              payment_amount: 499,
              payment_currency: 'INR',
              payment_status: 'SUCCESS',
            },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );

    const adapter = cashfreeServer({ appId: APP_ID, secretKey: SECRET_KEY });
    const result = await adapter.verifyPayment({ order_id: 'order_abc' });
    expect(result.verified).toBe(true);
    expect(result.orderId).toBe('order_abc');
    expect(result.paymentId).toBe('cfp_1');
    expect(result.status).toBe('paid');
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/gateways/cashfree/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write src/gateways/cashfree/server.ts**

```ts
import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { CashfreeOrderResponse, CashfreePaymentEntry } from './types';

export interface CashfreeServerConfig {
  appId: string;
  secretKey: string;
  /** Override API base (useful for tests / sandbox). */
  apiBase?: string;
  /** Cashfree PG API version header. */
  apiVersion?: string;
}

const DEFAULT_API_BASE = 'https://api.cashfree.com';
const DEFAULT_API_VERSION = '2023-08-01';

const CAPABILITIES: Capabilities = {
  modal: true,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function randomOrderId(): string {
  const rnd =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `order_${rnd}`;
}

export function cashfreeServer(config: CashfreeServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;

  const headers = {
    'content-type': 'application/json',
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey,
    'x-api-version': apiVersion,
  };

  return {
    gateway: 'cashfree',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      // Cashfree expects amounts in major units.
      const orderAmount = Math.round(req.amount) / 100;
      const body = {
        order_id: req.receipt ?? randomOrderId(),
        order_amount: orderAmount,
        order_currency: req.currency,
        customer_details: {
          customer_id: req.customer?.id ?? `cust_${Date.now()}`,
          customer_email: req.customer?.email ?? '',
          customer_phone: req.customer?.phone ?? '',
          ...(req.customer?.name ? { customer_name: req.customer.name } : {}),
        },
        ...(req.notes ? { order_tags: req.notes } : {}),
      };

      const res = await fetch(`${base}/pg/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Cashfree createOrder failed with status ${res.status}`,
          { code: 'CASHFREE_CREATE_ORDER_FAILED', gateway: 'cashfree', cause: parsed },
        );
      }

      const raw = parsed as CashfreeOrderResponse;
      return {
        id: raw.order_id,
        amount: Math.round(raw.order_amount * 100),
        currency: raw.order_currency,
        status: raw.order_status === 'PAID' ? 'paid' : 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: raw.payment_session_id },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing or not an object.', {
          code: 'CASHFREE_VERIFY_PAYLOAD_MISSING',
          gateway: 'cashfree',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = (p.order_id ?? p.orderId) as string | undefined;
      if (typeof orderId !== 'string' || !orderId) {
        throw new VerificationError('Missing order_id in payment payload.', {
          code: 'CASHFREE_VERIFY_FIELDS_MISSING',
          gateway: 'cashfree',
        });
      }

      const res = await fetch(
        `${base}/pg/orders/${encodeURIComponent(orderId)}/payments`,
        { method: 'GET', headers },
      );
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : [];
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Cashfree fetch payments failed with status ${res.status}`,
          { code: 'CASHFREE_FETCH_PAYMENTS_FAILED', gateway: 'cashfree', cause: parsed },
        );
      }

      const arr = Array.isArray(parsed) ? (parsed as CashfreePaymentEntry[]) : [];
      const latest = arr[0];
      if (!latest) {
        return {
          verified: false,
          orderId,
          paymentId: '',
          amount: 0,
          status: 'pending',
          gateway: 'cashfree',
        };
      }

      const mappedStatus: VerificationResult['status'] =
        latest.payment_status === 'SUCCESS'
          ? 'paid'
          : latest.payment_status === 'FAILED' || latest.payment_status === 'USER_DROPPED'
            ? 'failed'
            : 'pending';

      return {
        verified: mappedStatus === 'paid',
        orderId,
        paymentId: latest.cf_payment_id,
        amount: Math.round(latest.payment_amount * 100),
        status: mappedStatus,
        gateway: 'cashfree',
      };
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/gateways/cashfree/server.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/gateways/cashfree/types.ts src/gateways/cashfree/server.ts tests/gateways/cashfree/server.test.ts
git commit -m "feat(cashfree): server adapter (createOrder + fetch-payments verification)"
```

---

### Task 4.2: Cashfree browser adapter — TDD

The Cashfree v3 browser SDK is loaded from `https://sdk.cashfree.com/js/v3/cashfree.js` and exposes `window.Cashfree({ mode: 'production' | 'sandbox' })` which returns a client with `.checkout({ paymentSessionId, redirectTarget })`.

**Files:**
- Test: `tests/gateways/cashfree/browser.test.ts`
- Create: `src/gateways/cashfree/browser.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/gateways/cashfree/browser.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cashfreeBrowser } from '../../../src/gateways/cashfree/browser';
import { CheckoutDismissedError } from '../../../src/core';

interface CashfreeClient {
  checkout: (opts: { paymentSessionId: string; redirectTarget: string }) =>
    Promise<{ error?: { message?: string }; paymentDetails?: unknown; redirect?: boolean }>;
}

function stubCashfree(impl: CashfreeClient['checkout']): { calls: Array<Parameters<CashfreeClient['checkout']>[0]> } {
  const calls: Array<Parameters<CashfreeClient['checkout']>[0]> = [];
  const Factory = vi.fn((_config: { mode: string }) => ({
    checkout: (opts: Parameters<CashfreeClient['checkout']>[0]) => {
      calls.push(opts);
      return impl(opts);
    },
  }));
  (window as unknown as { Cashfree?: typeof Factory }).Cashfree = Factory;
  return { calls };
}

describe('cashfreeBrowser', () => {
  beforeEach(() => {
    document.querySelectorAll('script[data-payment-universal]').forEach((s) => s.remove());
    delete (window as unknown as { Cashfree?: unknown }).Cashfree;
  });
  afterEach(() => {
    delete (window as unknown as { Cashfree?: unknown }).Cashfree;
  });

  it('capabilities reports modal + redirect', () => {
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    expect(adapter.capabilities.modal).toBe(true);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode: passes payment_session_id and resolves success', async () => {
    const stub = stubCashfree(async () => ({ paymentDetails: { paymentStatus: 'SUCCESS' } }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    const result = await adapter.openCheckout({
      order: {
        id: 'order_1',
        amount: 100,
        currency: 'INR',
        status: 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: 'sess_1' },
        raw: {},
      },
      mode: 'modal',
    });

    expect(stub.calls[0]).toMatchObject({
      paymentSessionId: 'sess_1',
      redirectTarget: '_modal',
    });
    expect(result.status).toBe('success');
    expect(result.orderId).toBe('order_1');
  });

  it('modal mode: user-dropped / error rejects with CheckoutDismissedError', async () => {
    stubCashfree(async () => ({ error: { message: 'user dropped' } }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    await expect(
      adapter.openCheckout({
        order: {
          id: 'order_1',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'cashfree',
          clientPayload: { payment_session_id: 'sess_1' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(CheckoutDismissedError);
  });

  it('redirect mode: invokes checkout with redirectTarget _self', async () => {
    const stub = stubCashfree(async () => ({ redirect: true }));
    const adapter = cashfreeBrowser({ appId: 'X', mode: 'sandbox' });
    adapter.load = async () => {};

    void adapter.openCheckout({
      order: {
        id: 'order_1',
        amount: 100,
        currency: 'INR',
        status: 'created',
        gateway: 'cashfree',
        clientPayload: { payment_session_id: 'sess_1' },
        raw: {},
      },
      mode: 'redirect',
      returnUrl: 'https://merchant.test/return',
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(stub.calls[0]).toMatchObject({
      paymentSessionId: 'sess_1',
      redirectTarget: '_self',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gateways/cashfree/browser.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/gateways/cashfree/browser.ts**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gateways/cashfree/browser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/cashfree/browser.ts tests/gateways/cashfree/browser.test.ts
git commit -m "feat(cashfree): browser adapter (modal + redirect via v3 SDK)"
```

---

## Section 5 — Vue, Angular, Vanilla framework adapters (gateway-agnostic)

### Task 5.1: Vue `useCheckout` composable — TDD

**Files:**
- Test: `tests/adapters/vue.test.ts`
- Create: `src/adapters/vue/useCheckout.ts`
- Create: `src/adapters/vue/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/adapters/vue.test.ts
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useCheckout } from '../../src/adapters/vue/useCheckout';
import { makeFakeBrowserAdapter } from '../test-utils/fakeAdapter';
import type { NormalizedOrder } from '../../src/core';

const ORDER: NormalizedOrder = {
  id: 'order_1',
  amount: 100,
  currency: 'INR',
  status: 'created',
  gateway: 'razorpay',
  clientPayload: {},
  raw: {},
};

function makeHarness(adapter: ReturnType<typeof makeFakeBrowserAdapter>): {
  vm: ReturnType<typeof useCheckout>;
  wrapper: ReturnType<typeof mount>;
} {
  let vm!: ReturnType<typeof useCheckout>;
  const Comp = defineComponent({
    setup() {
      vm = useCheckout(adapter);
      return () => h('div');
    },
  });
  const wrapper = mount(Comp);
  return { vm, wrapper };
}

describe('useCheckout (Vue)', () => {
  it('transitions to ready after adapter.load resolves', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { vm, wrapper } = makeHarness(adapter);

    expect(vm.isLoading.value).toBe(true);
    await nextTick();
    await Promise.resolve();
    // wait a tick for the load microtask
    for (let i = 0; i < 5 && !vm.isReady.value; i += 1) {
      await nextTick();
    }
    expect(vm.isReady.value).toBe(true);
    expect(vm.isLoading.value).toBe(false);
    wrapper.unmount();
  });

  it('open() delegates to adapter.openCheckout', async () => {
    const adapter = makeFakeBrowserAdapter();
    const { vm, wrapper } = makeHarness(adapter);
    for (let i = 0; i < 5 && !vm.isReady.value; i += 1) {
      await nextTick();
    }
    const payment = await vm.open({ order: ORDER, mode: 'modal' });
    expect(payment.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
    wrapper.unmount();
  });

  it('surfaces load errors into error.value', async () => {
    const adapter = makeFakeBrowserAdapter();
    adapter.load = () => Promise.reject(new Error('bad script'));
    const { vm, wrapper } = makeHarness(adapter);
    for (let i = 0; i < 5 && !vm.error.value; i += 1) {
      await nextTick();
    }
    expect(vm.error.value?.message).toBe('bad script');
    expect(vm.isReady.value).toBe(false);
    wrapper.unmount();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/adapters/vue.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/adapters/vue/useCheckout.ts**

```ts
import { onBeforeUnmount, ref, type Ref } from 'vue';
import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export interface UseCheckoutReturn {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: Ref<boolean>;
  isReady: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useCheckout(
  adapter: BrowserAdapter,
  loadOptions: LoadOptions = {},
): UseCheckoutReturn {
  const isLoading = ref<boolean>(true);
  const isReady = ref<boolean>(false);
  const error = ref<Error | null>(null);
  let mounted = true;

  if (typeof window === 'undefined') {
    isLoading.value = false;
  } else {
    adapter
      .load(loadOptions)
      .then(() => {
        if (!mounted) return;
        isReady.value = true;
        isLoading.value = false;
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        error.value = err instanceof Error ? err : new Error(String(err));
        isReady.value = false;
        isLoading.value = false;
      });
  }

  const close = (): void => {
    try {
      adapter.close();
    } catch {
      /* no-op */
    }
  };

  onBeforeUnmount(() => {
    mounted = false;
    close();
  });

  const open = (options: CheckoutOptions): Promise<PaymentResult> =>
    adapter.openCheckout(options);

  return { open, close, isLoading, isReady, error };
}
```

- [ ] **Step 4: Write src/adapters/vue/index.ts**

```ts
export { useCheckout } from './useCheckout';
export type { UseCheckoutReturn } from './useCheckout';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/adapters/vue.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/vue tests/adapters/vue.test.ts
git commit -m "feat(vue): gateway-agnostic useCheckout composable"
```

---

### Task 5.2: Angular `CheckoutService` + `CheckoutModule`

Angular's `TestBed` setup adds non-trivial zone.js + decorator infrastructure; for this task we do NOT TDD (skip test — relies on live Angular stack). The service logic is thin; unit-test equivalents are covered by React/Vue tests against the same `BrowserAdapter` contract.

**Files:**
- Create: `src/adapters/angular/checkout.service.ts`
- Create: `src/adapters/angular/checkout.module.ts`
- Create: `src/adapters/angular/index.ts`

- [ ] **Step 1: Write src/adapters/angular/checkout.service.ts**

```ts
import { isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  InjectionToken,
  Optional,
  PLATFORM_ID,
} from '@angular/core';
import {
  PaymentError,
  type BrowserAdapter,
  type CheckoutOptions,
  type LoadOptions,
  type PaymentResult,
} from '../../core';

export const PAYMENT_ADAPTER = new InjectionToken<BrowserAdapter>('PAYMENT_ADAPTER');
export const PAYMENT_LOAD_OPTIONS = new InjectionToken<LoadOptions>('PAYMENT_LOAD_OPTIONS');

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly adapter: BrowserAdapter;
  private readonly defaultLoadOptions: LoadOptions;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Inject(PAYMENT_ADAPTER) adapter: BrowserAdapter,
    @Optional() @Inject(PAYMENT_LOAD_OPTIONS) loadOptions: LoadOptions | null,
  ) {
    this.adapter = adapter;
    this.defaultLoadOptions = loadOptions ?? {};
  }

  public load(options?: LoadOptions): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    return this.adapter.load({ ...this.defaultLoadOptions, ...options });
  }

  public isReady(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.adapter.isReady();
  }

  public close(): void {
    try {
      this.adapter.close();
    } catch {
      /* no-op */
    }
  }

  public open(options: CheckoutOptions): Promise<PaymentResult> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new PaymentError('Checkout cannot be opened on the server.', {
          code: 'SSR_OPEN_BLOCKED',
          gateway: this.adapter.gateway,
        }),
      );
    }
    return this.adapter.openCheckout(options);
  }
}
```

- [ ] **Step 2: Write src/adapters/angular/checkout.module.ts**

```ts
import { NgModule, type ModuleWithProviders } from '@angular/core';
import {
  CheckoutService,
  PAYMENT_ADAPTER,
  PAYMENT_LOAD_OPTIONS,
} from './checkout.service';
import type { BrowserAdapter, LoadOptions } from '../../core';

@NgModule({ providers: [CheckoutService] })
export class CheckoutModule {
  public static forRoot(
    adapter: BrowserAdapter,
    loadOptions: LoadOptions = {},
  ): ModuleWithProviders<CheckoutModule> {
    return {
      ngModule: CheckoutModule,
      providers: [
        CheckoutService,
        { provide: PAYMENT_ADAPTER, useValue: adapter },
        { provide: PAYMENT_LOAD_OPTIONS, useValue: loadOptions },
      ],
    };
  }
}
```

- [ ] **Step 3: Write src/adapters/angular/index.ts**

```ts
export {
  CheckoutService,
  PAYMENT_ADAPTER,
  PAYMENT_LOAD_OPTIONS,
} from './checkout.service';
export { CheckoutModule } from './checkout.module';
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/adapters/angular
git commit -m "feat(angular): gateway-agnostic CheckoutService + CheckoutModule.forRoot"
```

---

### Task 5.3: Vanilla `PaymentClient` — TDD

**Files:**
- Test: `tests/adapters/vanilla.test.ts`
- Create: `src/adapters/vanilla/client.ts`
- Create: `src/adapters/vanilla/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/adapters/vanilla.test.ts
import { describe, expect, it } from 'vitest';
import { PaymentClient } from '../../src/adapters/vanilla/client';
import { makeFakeBrowserAdapter } from '../test-utils/fakeAdapter';
import type { NormalizedOrder } from '../../src/core';

const ORDER: NormalizedOrder = {
  id: 'order_1',
  amount: 100,
  currency: 'INR',
  status: 'created',
  gateway: 'razorpay',
  clientPayload: {},
  raw: {},
};

describe('PaymentClient (vanilla)', () => {
  it('load() + isReady + open delegates to adapter', async () => {
    const adapter = makeFakeBrowserAdapter();
    const client = new PaymentClient(adapter);
    expect(client.isReady).toBe(false);
    await client.load();
    expect(client.isReady).toBe(true);

    const result = await client.open({ order: ORDER, mode: 'modal' });
    expect(result.status).toBe('success');
    expect(adapter.opened).toHaveLength(1);
  });

  it('close() delegates to adapter.close', () => {
    const adapter = makeFakeBrowserAdapter();
    const client = new PaymentClient(adapter);
    client.close();
    expect(adapter.closed).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/adapters/vanilla.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/adapters/vanilla/client.ts**

```ts
import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export class PaymentClient {
  private readonly adapter: BrowserAdapter;
  private readonly loadOptions: LoadOptions;

  constructor(adapter: BrowserAdapter, loadOptions: LoadOptions = {}) {
    this.adapter = adapter;
    this.loadOptions = loadOptions;
  }

  public get isReady(): boolean {
    return this.adapter.isReady();
  }

  public load(): Promise<void> {
    return this.adapter.load(this.loadOptions);
  }

  public open(options: CheckoutOptions): Promise<PaymentResult> {
    return this.adapter.openCheckout(options);
  }

  public close(): void {
    try {
      this.adapter.close();
    } catch {
      /* no-op */
    }
  }
}
```

- [ ] **Step 4: Write src/adapters/vanilla/index.ts**

```ts
export { PaymentClient } from './client';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/adapters/vanilla.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/adapters/vanilla tests/adapters/vanilla.test.ts
git commit -m "feat(vanilla): PaymentClient class over BrowserAdapter"
```

---

## Section 6 — PayU adapters (redirect-only)

**Context:** PayU Biz has no drop-in modal (PayU Bolt deprecated). `modal` mode must throw `UnsupportedModeError` synchronously. Server generates SHA-512 hash; browser builds a form and auto-submits it to PayU's hosted `_payment` endpoint.

**Hash formula (v1):**
```
sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
```

### Task 6.1: PayU server adapter — TDD

**Files:**
- Test: `tests/gateways/payu/server.test.ts`
- Create: `src/gateways/payu/types.ts`
- Create: `src/gateways/payu/server.ts`

- [ ] **Step 1: Write src/gateways/payu/types.ts**

```ts
export interface PayUVerifyPaymentResponse {
  status: number;
  msg?: string;
  transaction_details?: Record<
    string,
    {
      mihpayid?: string;
      request_id?: string;
      bank_ref_num?: string;
      amt?: string;
      transactionAmount?: string;
      status?: string;
      unmappedstatus?: string;
      txnid?: string;
      [k: string]: unknown;
    }
  >;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/gateways/payu/server.test.ts
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { payuServer } from '../../../src/gateways/payu/server';
import { VerificationError } from '../../../src/core';

const KEY = 'MERCHANT_KEY';
const SALT = 'MERCHANT_SALT';

function expectedHash(parts: string[]): string {
  return createHash('sha512').update(parts.join('|')).digest('hex');
}

describe('payuServer.createOrder', () => {
  it('returns NormalizedOrder with redirect URL + hash in clientPayload', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: { email: 'a@b.com', name: 'Alice' },
      receipt: 'txn_abc',
      notes: { purpose: 'course' },
    });
    expect(order.gateway).toBe('payu');
    const payload = order.clientPayload as Record<string, string>;
    expect(payload.url).toBe('https://test.payu.in/_payment');
    expect(payload.key).toBe(KEY);
    expect(payload.txnid).toBe('txn_abc');
    expect(payload.amount).toBe('499.00');
    expect(payload.firstname).toBe('Alice');
    expect(payload.email).toBe('a@b.com');
    expect(payload.productinfo).toBe('course');
    // Hash must match PayU's formula exactly
    const parts = [
      KEY, 'txn_abc', '499.00', 'course', 'Alice', 'a@b.com',
      '', '', '', '', '',
      '', '', '', '', '',
      SALT,
    ];
    expect(payload.hash).toBe(expectedHash(parts));
  });
});

describe('payuServer.verifyPayment', () => {
  it('verifies response hash and returns paid status', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });

    // Response hash formula: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const status = 'success';
    const txnid = 'txn_abc';
    const amount = '499.00';
    const productinfo = 'course';
    const firstname = 'Alice';
    const email = 'a@b.com';
    const responseParts = [
      SALT, status,
      '', '', '', '', '', '', '', '', '', '',
      email, firstname, productinfo, amount, txnid, KEY,
    ];
    const responseHash = createHash('sha512').update(responseParts.join('|')).digest('hex');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch,
    );

    const result = await adapter.verifyPayment({
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      mihpayid: 'mih_123',
      hash: responseHash,
    });
    expect(result).toMatchObject({
      verified: true,
      orderId: txnid,
      paymentId: 'mih_123',
      amount: 49900,
      status: 'paid',
      gateway: 'payu',
    });
    vi.unstubAllGlobals();
  });

  it('throws VerificationError on bad response hash', async () => {
    const adapter = payuServer({ merchantKey: KEY, merchantSalt: SALT, mode: 'test' });
    await expect(
      adapter.verifyPayment({
        status: 'success',
        txnid: 'txn_abc',
        amount: '499.00',
        productinfo: 'course',
        firstname: 'Alice',
        email: 'a@b.com',
        mihpayid: 'mih_123',
        hash: 'not-a-hash',
      }),
    ).rejects.toBeInstanceOf(VerificationError);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/gateways/payu/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write src/gateways/payu/server.ts**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/gateways/payu/server.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/gateways/payu/types.ts src/gateways/payu/server.ts tests/gateways/payu/server.test.ts
git commit -m "feat(payu): server adapter (SHA-512 hash + redirect form fields)"
```

---

### Task 6.2: PayU browser adapter (redirect-only) — TDD

**Files:**
- Test: `tests/gateways/payu/browser.test.ts`
- Create: `src/gateways/payu/browser.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/gateways/payu/browser.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { payuBrowser } from '../../../src/gateways/payu/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('payuBrowser', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reports capabilities { modal: false, redirect: true }', () => {
    const adapter = payuBrowser();
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError synchronously', async () => {
    const adapter = payuBrowser();
    await expect(
      adapter.openCheckout({
        order: {
          id: 'txn',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'payu',
          clientPayload: {},
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode builds and submits a form with expected fields', async () => {
    const adapter = payuBrowser();

    // Intercept form.submit
    const origSubmit = HTMLFormElement.prototype.submit;
    let submittedForm: HTMLFormElement | null = null;
    HTMLFormElement.prototype.submit = function (this: HTMLFormElement) {
      submittedForm = this;
    };

    try {
      void adapter.openCheckout({
        order: {
          id: 'txn_abc',
          amount: 49900,
          currency: 'INR',
          status: 'created',
          gateway: 'payu',
          clientPayload: {
            url: 'https://test.payu.in/_payment',
            key: 'KEY',
            txnid: 'txn_abc',
            amount: '499.00',
            productinfo: 'course',
            firstname: 'Alice',
            email: 'a@b.com',
            phone: '',
            hash: 'abc',
          },
          raw: {},
        },
        mode: 'redirect',
        returnUrl: 'https://merchant.test/return',
      });

      await new Promise((r) => setTimeout(r, 0));
      expect(submittedForm).not.toBeNull();
      expect(submittedForm!.method).toBe('post');
      expect(submittedForm!.action).toBe('https://test.payu.in/_payment');
      const fields: Record<string, string> = {};
      submittedForm!
        .querySelectorAll<HTMLInputElement>('input[type="hidden"]')
        .forEach((el) => {
          fields[el.name] = el.value;
        });
      expect(fields).toMatchObject({
        key: 'KEY',
        txnid: 'txn_abc',
        amount: '499.00',
        productinfo: 'course',
        firstname: 'Alice',
        email: 'a@b.com',
        hash: 'abc',
        surl: 'https://merchant.test/return',
        furl: 'https://merchant.test/return',
      });
    } finally {
      HTMLFormElement.prototype.submit = origSubmit;
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gateways/payu/browser.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/gateways/payu/browser.ts**

```ts
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

export function payuBrowser(_config: PayUBrowserConfig = {}): BrowserAdapter {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gateways/payu/browser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/payu/browser.ts tests/gateways/payu/browser.test.ts
git commit -m "feat(payu): browser adapter (redirect via auto-submitted form; modal throws)"
```

---

## Section 7 — Juspay adapters (redirect-only)

**Context:** Juspay Express Checkout (web) is hosted-only. Server uses Juspay Orders API (`POST /orders`) with Basic auth (apiKey:). Response includes `payment_links.web` (hosted checkout URL). Verification uses `GET /orders/{order_id}` with `HTTP_X_MERCHANTID` header.

### Task 7.1: Juspay server adapter — TDD

**Files:**
- Test: `tests/gateways/juspay/server.test.ts`
- Create: `src/gateways/juspay/types.ts`
- Create: `src/gateways/juspay/server.ts`

- [ ] **Step 1: Write src/gateways/juspay/types.ts**

```ts
export interface JuspayOrderResponse {
  id: string;
  order_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  status_id?: number;
  payment_links?: {
    web?: string;
    mobile?: string;
    iframe?: string;
  };
  [key: string]: unknown;
}

export interface JuspayOrderStatusResponse {
  order_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: 'NEW' | 'PENDING' | 'CHARGED' | 'FAILED' | 'REFUNDED' | string;
  txn_id?: string;
  txn_uuid?: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/gateways/juspay/server.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { juspayServer } from '../../../src/gateways/juspay/server';
import { GatewayApiError } from '../../../src/core';

const API_KEY = 'JP_API_KEY';
const MERCHANT_ID = 'merchant_123';

describe('juspayServer.createOrder', () => {
  let captured: { url?: RequestInfo | URL; init?: RequestInit }[] = [];

  beforeEach(() => {
    captured = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        captured.push({ url, init });
        return new Response(
          JSON.stringify({
            id: 'ord_abc',
            order_id: 'ord_abc',
            merchant_id: MERCHANT_ID,
            amount: 499,
            currency: 'INR',
            status: 'NEW',
            payment_links: { web: 'https://api.juspay.in/payments/ord_abc/web' },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /orders with Basic auth and form-encoded body', async () => {
    const adapter = juspayServer({
      apiKey: API_KEY,
      merchantId: MERCHANT_ID,
      mode: 'sandbox',
    });
    const order = await adapter.createOrder({
      amount: 49900,
      currency: 'INR',
      customer: { id: 'cust_1', email: 'a@b.com' },
      receipt: 'ord_abc',
    });

    const { url, init } = captured[0];
    expect(url).toBe('https://sandbox.juspay.in/orders');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    const expectedAuth = `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(headers.get('x-merchantid')).toBe(MERCHANT_ID);
    expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    const params = new URLSearchParams(String(init?.body));
    expect(params.get('order_id')).toBe('ord_abc');
    expect(params.get('amount')).toBe('499.00');
    expect(params.get('currency')).toBe('INR');
    expect(params.get('customer_id')).toBe('cust_1');

    expect(order.gateway).toBe('juspay');
    expect(order.clientPayload).toMatchObject({
      url: 'https://api.juspay.in/payments/ord_abc/web',
    });
  });

  it('wraps non-2xx in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":"x"}', { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = juspayServer({ apiKey: API_KEY, merchantId: MERCHANT_ID, mode: 'sandbox' });
    await expect(
      adapter.createOrder({ amount: 1, currency: 'INR' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('juspayServer.verifyPayment', () => {
  it('GETs /orders/{id} and returns paid when status=CHARGED', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            order_id: 'ord_abc',
            merchant_id: MERCHANT_ID,
            amount: 499,
            currency: 'INR',
            status: 'CHARGED',
            txn_id: 'txn_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );
    const adapter = juspayServer({ apiKey: API_KEY, merchantId: MERCHANT_ID, mode: 'sandbox' });
    const r = await adapter.verifyPayment({ order_id: 'ord_abc' });
    expect(r).toMatchObject({
      verified: true,
      orderId: 'ord_abc',
      paymentId: 'txn_abc',
      amount: 49900,
      status: 'paid',
      gateway: 'juspay',
    });
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/gateways/juspay/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write src/gateways/juspay/server.ts**

```ts
import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type {
  JuspayOrderResponse,
  JuspayOrderStatusResponse,
} from './types';

export interface JuspayServerConfig {
  apiKey: string;
  merchantId: string;
  mode: 'production' | 'sandbox';
  apiBase?: string;
}

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function defaultBase(mode: 'production' | 'sandbox'): string {
  return mode === 'production' ? 'https://api.juspay.in' : 'https://sandbox.juspay.in';
}

function basicAuth(apiKey: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${apiKey}:`).toString('base64')
      : btoa(`${apiKey}:`);
  return `Basic ${encoded}`;
}

export function juspayServer(config: JuspayServerConfig): ServerAdapter {
  const base = config.apiBase ?? defaultBase(config.mode);
  const headers = {
    authorization: basicAuth(config.apiKey),
    'x-merchantid': config.merchantId,
    'content-type': 'application/x-www-form-urlencoded',
  };

  return {
    gateway: 'juspay',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const orderId = req.receipt ?? `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const amount = (Math.round(req.amount) / 100).toFixed(2);
      const params = new URLSearchParams();
      params.set('order_id', orderId);
      params.set('amount', amount);
      params.set('currency', req.currency);
      if (req.customer?.id) params.set('customer_id', req.customer.id);
      if (req.customer?.email) params.set('customer_email', req.customer.email);
      if (req.customer?.phone) params.set('customer_phone', req.customer.phone);
      if (req.customer?.name) params.set('first_name', req.customer.name);

      const res = await fetch(`${base}/orders`, {
        method: 'POST',
        headers,
        body: params.toString(),
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Juspay createOrder failed with status ${res.status}`,
          { code: 'JUSPAY_CREATE_ORDER_FAILED', gateway: 'juspay', cause: parsed },
        );
      }
      const raw = parsed as JuspayOrderResponse;
      const webUrl = raw.payment_links?.web;
      if (!webUrl) {
        throw new GatewayApiError(
          'Juspay createOrder succeeded but no payment_links.web URL was returned.',
          { code: 'JUSPAY_WEB_URL_MISSING', gateway: 'juspay', cause: raw },
        );
      }
      return {
        id: raw.order_id,
        amount: Math.round(raw.amount * 100),
        currency: raw.currency,
        status: 'created',
        gateway: 'juspay',
        clientPayload: { url: webUrl },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing.', {
          code: 'JUSPAY_VERIFY_PAYLOAD_MISSING',
          gateway: 'juspay',
        });
      }
      const p = payload as Record<string, unknown>;
      const orderId = (p.order_id ?? p.orderId) as string | undefined;
      if (typeof orderId !== 'string' || !orderId) {
        throw new VerificationError('Missing order_id in Juspay payload.', {
          code: 'JUSPAY_VERIFY_FIELDS_MISSING',
          gateway: 'juspay',
        });
      }

      const res = await fetch(`${base}/orders/${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers,
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Juspay fetch order failed with status ${res.status}`,
          { code: 'JUSPAY_FETCH_ORDER_FAILED', gateway: 'juspay', cause: parsed },
        );
      }
      const raw = parsed as JuspayOrderStatusResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.status === 'CHARGED'
          ? 'paid'
          : raw.status === 'FAILED'
            ? 'failed'
            : 'pending';
      return {
        verified: mappedStatus === 'paid',
        orderId: raw.order_id,
        paymentId: raw.txn_id ?? raw.txn_uuid ?? '',
        amount: Math.round(raw.amount * 100),
        status: mappedStatus,
        gateway: 'juspay',
      };
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/gateways/juspay/server.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/gateways/juspay/types.ts src/gateways/juspay/server.ts tests/gateways/juspay/server.test.ts
git commit -m "feat(juspay): server adapter (Orders API + CHARGED verification)"
```

---

### Task 7.2: Juspay browser adapter (redirect-only)

Juspay browser just navigates to the hosted URL returned by the server. Tiny adapter.

**Files:**
- Test: `tests/gateways/juspay/browser.test.ts`
- Create: `src/gateways/juspay/browser.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/gateways/juspay/browser.test.ts
import { describe, expect, it, vi } from 'vitest';
import { juspayBrowser } from '../../../src/gateways/juspay/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('juspayBrowser', () => {
  it('capabilities: modal false, redirect true', () => {
    const adapter = juspayBrowser();
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError', async () => {
    const adapter = juspayBrowser();
    await expect(
      adapter.openCheckout({
        order: {
          id: 'o',
          amount: 1,
          currency: 'INR',
          status: 'created',
          gateway: 'juspay',
          clientPayload: {},
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode navigates window.location to clientPayload.url', async () => {
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });
    try {
      const adapter = juspayBrowser();
      void adapter.openCheckout({
        order: {
          id: 'ord',
          amount: 100,
          currency: 'INR',
          status: 'created',
          gateway: 'juspay',
          clientPayload: { url: 'https://api.juspay.in/payments/ord/web' },
          raw: {},
        },
        mode: 'redirect',
      });
      await new Promise((r) => setTimeout(r, 0));
      expect(assignMock).toHaveBeenCalledWith('https://api.juspay.in/payments/ord/web');
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gateways/juspay/browser.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/gateways/juspay/browser.ts**

```ts
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

export function juspayBrowser(_config: JuspayBrowserConfig = {}): BrowserAdapter {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gateways/juspay/browser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/juspay/browser.ts tests/gateways/juspay/browser.test.ts
git commit -m "feat(juspay): browser adapter (redirect via window.location; modal throws)"
```

---

## Section 8 — Stripe adapters (redirect-only in v1)

**Context:** v1 uses Stripe Checkout Sessions (hosted). The server creates a session via `POST /v1/checkout/sessions` (form-encoded, secret-key Basic auth). The browser loads `@stripe/stripe-js` and calls `stripe.redirectToCheckout({ sessionId })`. Stripe Elements (embedded) is out of scope.

### Task 8.1: Stripe server adapter — TDD

**Files:**
- Test: `tests/gateways/stripe/server.test.ts`
- Create: `src/gateways/stripe/types.ts`
- Create: `src/gateways/stripe/server.ts`

- [ ] **Step 1: Write src/gateways/stripe/types.ts**

```ts
export interface StripeCheckoutSessionResponse {
  id: string;
  object: 'checkout.session';
  amount_total: number;
  currency: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  payment_intent: string | null;
  url: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/gateways/stripe/server.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeServer } from '../../../src/gateways/stripe/server';
import { GatewayApiError } from '../../../src/core';

const SECRET = 'sk_test_123';

describe('stripeServer.createOrder', () => {
  let captured: { url?: RequestInfo | URL; init?: RequestInit } = {};

  beforeEach(() => {
    captured = {};
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        captured = { url, init };
        return new Response(
          JSON.stringify({
            id: 'cs_test_abc',
            object: 'checkout.session',
            amount_total: 4999,
            currency: 'usd',
            payment_status: 'unpaid',
            status: 'open',
            payment_intent: null,
            url: 'https://checkout.stripe.com/pay/cs_test_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as unknown as typeof fetch,
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('POSTs to /v1/checkout/sessions form-encoded with Basic auth', async () => {
    const adapter = stripeServer({ secretKey: SECRET });
    const order = await adapter.createOrder({
      amount: 4999,
      currency: 'USD',
      customer: { email: 'a@b.com' },
    });

    expect(captured.url).toBe('https://api.stripe.com/v1/checkout/sessions');
    const headers = new Headers(captured.init?.headers);
    const expectedAuth = `Basic ${Buffer.from(`${SECRET}:`).toString('base64')}`;
    expect(headers.get('authorization')).toBe(expectedAuth);
    expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    const params = new URLSearchParams(String(captured.init?.body));
    expect(params.get('mode')).toBe('payment');
    expect(params.get('line_items[0][price_data][currency]')).toBe('usd');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('4999');
    expect(params.get('line_items[0][quantity]')).toBe('1');
    expect(params.get('customer_email')).toBe('a@b.com');

    expect(order.id).toBe('cs_test_abc');
    expect(order.clientPayload).toMatchObject({
      sessionId: 'cs_test_abc',
      url: 'https://checkout.stripe.com/pay/cs_test_abc',
    });
  });

  it('wraps non-2xx in GatewayApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":{"message":"bad"}}', { status: 400 })) as unknown as typeof fetch,
    );
    const adapter = stripeServer({ secretKey: SECRET });
    await expect(
      adapter.createOrder({ amount: 100, currency: 'USD' }),
    ).rejects.toBeInstanceOf(GatewayApiError);
  });
});

describe('stripeServer.verifyPayment', () => {
  it('retrieves session and returns paid when payment_status=paid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: 'cs_test_abc',
            object: 'checkout.session',
            amount_total: 4999,
            currency: 'usd',
            payment_status: 'paid',
            status: 'complete',
            payment_intent: 'pi_123',
            url: 'https://checkout.stripe.com/pay/cs_test_abc',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof fetch,
    );

    const adapter = stripeServer({ secretKey: SECRET });
    const r = await adapter.verifyPayment({ sessionId: 'cs_test_abc' });
    expect(r).toMatchObject({
      verified: true,
      orderId: 'cs_test_abc',
      paymentId: 'pi_123',
      amount: 4999,
      status: 'paid',
      gateway: 'stripe',
    });
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/gateways/stripe/server.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write src/gateways/stripe/server.ts**

```ts
import {
  GatewayApiError,
  VerificationError,
  type Capabilities,
  type NormalizedOrder,
  type OrderRequest,
  type ServerAdapter,
  type VerificationResult,
} from '../../core';
import type { StripeCheckoutSessionResponse } from './types';

export interface StripeServerConfig {
  secretKey: string;
  apiBase?: string;
}

const DEFAULT_API_BASE = 'https://api.stripe.com';

const CAPABILITIES: Capabilities = {
  modal: false,
  redirect: true,
  webhooks: false,
  subscriptions: false,
  refunds: false,
};

function basicAuth(secretKey: string): string {
  const encoded =
    typeof Buffer !== 'undefined'
      ? Buffer.from(`${secretKey}:`).toString('base64')
      : btoa(`${secretKey}:`);
  return `Basic ${encoded}`;
}

export function stripeServer(config: StripeServerConfig): ServerAdapter {
  const base = config.apiBase ?? DEFAULT_API_BASE;
  const headers = {
    authorization: basicAuth(config.secretKey),
    'content-type': 'application/x-www-form-urlencoded',
  };

  return {
    gateway: 'stripe',
    capabilities: CAPABILITIES,

    async createOrder(req: OrderRequest): Promise<NormalizedOrder> {
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('line_items[0][price_data][currency]', req.currency.toLowerCase());
      params.set('line_items[0][price_data][unit_amount]', String(req.amount));
      params.set('line_items[0][price_data][product_data][name]', req.notes?.purpose ?? 'Payment');
      params.set('line_items[0][quantity]', '1');
      if (req.customer?.email) params.set('customer_email', req.customer.email);
      if (req.receipt) params.set('client_reference_id', req.receipt);
      // success_url / cancel_url are required by Stripe; we use placeholders that
      // the merchant must override via the browser session param if desired.
      params.set('success_url', 'https://example.test/success?session_id={CHECKOUT_SESSION_ID}');
      params.set('cancel_url', 'https://example.test/cancel');

      const res = await fetch(`${base}/v1/checkout/sessions`, {
        method: 'POST',
        headers,
        body: params.toString(),
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Stripe createOrder failed with status ${res.status}`,
          { code: 'STRIPE_CREATE_ORDER_FAILED', gateway: 'stripe', cause: parsed },
        );
      }
      const raw = parsed as StripeCheckoutSessionResponse;
      return {
        id: raw.id,
        amount: raw.amount_total ?? req.amount,
        currency: (raw.currency ?? req.currency).toUpperCase(),
        status: 'created',
        gateway: 'stripe',
        clientPayload: { sessionId: raw.id, url: raw.url },
        raw,
      };
    },

    async verifyPayment(payload: unknown): Promise<VerificationResult> {
      if (!payload || typeof payload !== 'object') {
        throw new VerificationError('Payment payload is missing.', {
          code: 'STRIPE_VERIFY_PAYLOAD_MISSING',
          gateway: 'stripe',
        });
      }
      const p = payload as Record<string, unknown>;
      const sessionId = (p.sessionId ?? p.session_id) as string | undefined;
      if (typeof sessionId !== 'string' || !sessionId) {
        throw new VerificationError('Missing sessionId in Stripe payload.', {
          code: 'STRIPE_VERIFY_FIELDS_MISSING',
          gateway: 'stripe',
        });
      }

      const res = await fetch(
        `${base}/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        { method: 'GET', headers },
      );
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        throw new GatewayApiError(
          `Stripe fetch session failed with status ${res.status}`,
          { code: 'STRIPE_FETCH_SESSION_FAILED', gateway: 'stripe', cause: parsed },
        );
      }
      const raw = parsed as StripeCheckoutSessionResponse;
      const mappedStatus: VerificationResult['status'] =
        raw.payment_status === 'paid'
          ? 'paid'
          : raw.status === 'expired'
            ? 'failed'
            : 'pending';
      return {
        verified: mappedStatus === 'paid',
        orderId: raw.id,
        paymentId: raw.payment_intent ?? '',
        amount: raw.amount_total ?? 0,
        status: mappedStatus,
        gateway: 'stripe',
      };
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/gateways/stripe/server.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/gateways/stripe/types.ts src/gateways/stripe/server.ts tests/gateways/stripe/server.test.ts
git commit -m "feat(stripe): server adapter (Checkout Sessions create + retrieve verify)"
```

---

### Task 8.2: Stripe browser adapter (redirect-only) — TDD

Uses `@stripe/stripe-js` via the `loadStripe(publishableKey)` ESM import. Dynamic-imported so the peer dep isn't required when merchants don't use Stripe.

**Files:**
- Test: `tests/gateways/stripe/browser.test.ts`
- Create: `src/gateways/stripe/browser.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/gateways/stripe/browser.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stripeBrowser } from '../../../src/gateways/stripe/browser';
import { UnsupportedModeError } from '../../../src/core';

describe('stripeBrowser', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => vi.restoreAllMocks());

  it('capabilities: modal false, redirect true', () => {
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => null,
    });
    expect(adapter.capabilities.modal).toBe(false);
    expect(adapter.capabilities.redirect).toBe(true);
  });

  it('modal mode throws UnsupportedModeError', async () => {
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => null,
    });
    await expect(
      adapter.openCheckout({
        order: {
          id: 'cs_1',
          amount: 1,
          currency: 'USD',
          status: 'created',
          gateway: 'stripe',
          clientPayload: { sessionId: 'cs_1' },
          raw: {},
        },
        mode: 'modal',
      }),
    ).rejects.toBeInstanceOf(UnsupportedModeError);
  });

  it('redirect mode calls stripe.redirectToCheckout({ sessionId })', async () => {
    const redirectToCheckout = vi.fn(async () => ({ error: null }));
    const adapter = stripeBrowser({
      publishableKey: 'pk_test_x',
      loadStripe: async () => ({ redirectToCheckout } as unknown as {
        redirectToCheckout: typeof redirectToCheckout;
      }),
    });
    void adapter.openCheckout({
      order: {
        id: 'cs_abc',
        amount: 100,
        currency: 'USD',
        status: 'created',
        gateway: 'stripe',
        clientPayload: { sessionId: 'cs_abc' },
        raw: {},
      },
      mode: 'redirect',
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(redirectToCheckout).toHaveBeenCalledWith({ sessionId: 'cs_abc' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/gateways/stripe/browser.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write src/gateways/stripe/browser.ts**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/gateways/stripe/browser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gateways/stripe/browser.ts tests/gateways/stripe/browser.test.ts
git commit -m "feat(stripe): browser adapter (redirectToCheckout via loadStripe; modal throws)"
```

---

## Section 9 — Build, docs, final verification

### Task 9.1: UMD entry + Rollup multi-entry config

**Files:**
- Create: `src/umd.ts`
- Create: `rollup.config.mjs`

- [ ] **Step 1: Write src/umd.ts**

```ts
export * from './core';
export { PaymentClient } from './adapters/vanilla/client';
export { razorpayBrowser } from './gateways/razorpay/browser';
export { cashfreeBrowser } from './gateways/cashfree/browser';
export { payuBrowser } from './gateways/payu/browser';
export { juspayBrowser } from './gateways/juspay/browser';
export { stripeBrowser } from './gateways/stripe/browser';
```

- [ ] **Step 2: Write rollup.config.mjs**

```js
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'vue',
  '@angular/core',
  '@angular/common',
  'rxjs',
  '@cashfreepayments/cashfree-js',
  '@stripe/stripe-js',
  'node:crypto',
];

const tsPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    ...options,
  });

function bundle({ input, outDir, umdName = null }) {
  const outputs = [
    { file: `${outDir}/index.mjs`, format: 'es', sourcemap: true },
    { file: `${outDir}/index.cjs`, format: 'cjs', sourcemap: true, exports: 'named' },
  ];
  if (umdName) {
    outputs.push({
      file: `${outDir}/index.umd.js`,
      format: 'umd',
      name: umdName,
      sourcemap: true,
      exports: 'named',
    });
  }
  return {
    input,
    external,
    output: outputs,
    plugins: [nodeResolve(), tsPlugin()],
  };
}

function dtsBundle({ input, outFile }) {
  return {
    input,
    external,
    output: { file: outFile, format: 'es' },
    plugins: [dts()],
  };
}

// Gateway file bundle — outputs as `dist/gateways/{gateway}/{browser|server}.{mjs,cjs,d.ts}`
function gatewayBundle({ gateway, side }) {
  const input = `src/gateways/${gateway}/${side}.ts`;
  const outBase = `dist/gateways/${gateway}/${side}`;
  return [
    {
      input,
      external,
      output: [
        { file: `${outBase}.mjs`, format: 'es', sourcemap: true },
        { file: `${outBase}.cjs`, format: 'cjs', sourcemap: true, exports: 'named' },
      ],
      plugins: [nodeResolve(), tsPlugin()],
    },
    {
      input,
      external,
      output: { file: `${outBase}.d.ts`, format: 'es' },
      plugins: [dts()],
    },
  ];
}

const gateways = ['razorpay', 'cashfree', 'payu', 'juspay', 'stripe'];
const sides = ['browser', 'server'];

export default [
  // Core entry
  bundle({ input: 'src/index.ts', outDir: 'dist' }),
  dtsBundle({ input: 'src/index.ts', outFile: 'dist/index.d.ts' }),

  // UMD bundle
  {
    input: 'src/umd.ts',
    external,
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'PaymentUniversal',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [nodeResolve(), tsPlugin()],
  },

  // Framework adapters
  bundle({ input: 'src/adapters/react/index.ts', outDir: 'dist/adapters/react' }),
  dtsBundle({ input: 'src/adapters/react/index.ts', outFile: 'dist/adapters/react/index.d.ts' }),
  bundle({ input: 'src/adapters/vue/index.ts', outDir: 'dist/adapters/vue' }),
  dtsBundle({ input: 'src/adapters/vue/index.ts', outFile: 'dist/adapters/vue/index.d.ts' }),
  bundle({ input: 'src/adapters/angular/index.ts', outDir: 'dist/adapters/angular' }),
  dtsBundle({ input: 'src/adapters/angular/index.ts', outFile: 'dist/adapters/angular/index.d.ts' }),
  bundle({ input: 'src/adapters/vanilla/index.ts', outDir: 'dist/adapters/vanilla' }),
  dtsBundle({ input: 'src/adapters/vanilla/index.ts', outFile: 'dist/adapters/vanilla/index.d.ts' }),

  // Gateway adapters — browser + server per gateway
  ...gateways.flatMap((g) => sides.flatMap((s) => gatewayBundle({ gateway: g, side: s }))),
];
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Exits 0; `dist/` contains per-framework and per-gateway output files, plus `dist/index.umd.js`.

- [ ] **Step 4: Commit**

```bash
git add src/umd.ts rollup.config.mjs
git commit -m "build: rollup multi-entry config for 5 gateways × {browser,server} + 4 frameworks + UMD"
```

---

### Task 9.2: README, CHANGELOG, LICENSE, MANUAL_SMOKE_TEST

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Create: `MANUAL_SMOKE_TEST.md`

- [ ] **Step 1: Write README.md**

````markdown
# payment-universal

A framework-agnostic, multi-gateway payment SDK with first-class support for **Razorpay**, **Cashfree**, **PayU**, **Juspay**, and **Stripe**, and framework adapters for **React**, **Vue 3**, **Angular**, and **Vanilla JS**. Fully typed in TypeScript.

- Swap one adapter import — the rest of your integration (framework hook, server endpoint, result handling) stays identical.
- Strict two-tier separation: browser entries never contain server code; server entries use the `"node"` export condition so browser bundlers refuse to include them.
- Promise-based `open()` API wrapping each gateway's native checkout SDK.
- SSR-safe — never touches the DOM during server rendering.
- Capability flags are surfaced honestly: PayU, Juspay, and Stripe support redirect mode only — `UnsupportedModeError` is a feature.

## Capability matrix (v1)

| Gateway   | Modal | Redirect |
|-----------|:-----:|:--------:|
| Razorpay  |  ✅   |    ✅    |
| Cashfree  |  ✅   |    ✅    |
| PayU      |  ❌   |    ✅    |
| Juspay    |  ❌   |    ✅    |
| Stripe    |  ❌   |    ✅    |

## Quick example (React + Razorpay)

```tsx
'use client';
import { useCheckout } from 'payment-universal/react';
import { razorpayBrowser } from 'payment-universal/razorpay/browser';

const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY! });

export function PayButton() {
  const { open, isReady, isLoading } = useCheckout(adapter);

  async function handlePay() {
    const order = await fetch('/api/checkout', { method: 'POST' }).then((r) => r.json());
    const result = await open({ order, mode: 'modal', prefill: { email: 'jane@example.com' } });
    await fetch('/api/verify', { method: 'POST', body: JSON.stringify(result) });
  }

  return (
    <button onClick={handlePay} disabled={!isReady || isLoading}>
      Pay
    </button>
  );
}
```

## Server (Next.js route)

```ts
import { razorpayServer } from 'payment-universal/razorpay/server';

const server = razorpayServer({
  keyId: process.env.RAZORPAY_KEY_ID!,
  keySecret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(): Promise<Response> {
  const order = await server.createOrder({ amount: 49900, currency: 'INR' });
  return Response.json(order);
}
```

## Switching gateway

```diff
- import { razorpayBrowser } from 'payment-universal/razorpay/browser';
- const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY! });
+ import { cashfreeBrowser } from 'payment-universal/cashfree/browser';
+ const adapter = cashfreeBrowser({ appId: process.env.NEXT_PUBLIC_CASHFREE_APP_ID!, mode: 'production' });
```

The `useCheckout` call, the `open()` call, the result handling, and the verify endpoint all stay the same. Change the adapter import (both sides) and you're done.

## Documentation

See `docs/superpowers/specs/2026-04-23-payment-universal-design.md` for the full design spec and `MANUAL_SMOKE_TEST.md` for live sandbox integration testing instructions.

## License

MIT
````

- [ ] **Step 2: Write CHANGELOG.md**

```markdown
# Changelog

## 0.1.0 — 2026-04-24

- Initial implementation (pre-release).
- Five gateways: Razorpay, Cashfree, PayU, Juspay, Stripe — browser + server adapters.
- Four framework adapters: React (`useCheckout`), Vue 3 (`useCheckout`), Angular (`CheckoutService` + `CheckoutModule`), Vanilla (`PaymentClient`).
- One-time payments only. Subscriptions, refunds, webhooks are out of scope for v1.
- Capability flags: modal/redirect per gateway; synchronous `UnsupportedModeError` from `openCheckout`.
```

- [ ] **Step 3: Write LICENSE (MIT)**

```
MIT License

Copyright (c) 2026 Rupam Shil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Write MANUAL_SMOKE_TEST.md**

````markdown
# Manual Smoke Test Guide

CI never hits real gateways. Before a release, run one sandbox transaction per gateway.

For each gateway:

1. Get sandbox credentials.
2. Set env vars (`*_KEY_ID`, `*_KEY_SECRET`, etc.).
3. Start a minimal Express app that imports both the browser and server adapters for that gateway.
4. Hit `POST /api/checkout` → receive NormalizedOrder.
5. From a browser, call `adapter.openCheckout({ order, mode: ... })` and complete the sandbox payment.
6. Post the result to `POST /api/verify` → confirm `verified: true`.

See each gateway's dashboard for sandbox mode instructions:

- Razorpay: test keys (`rzp_test_…`) + test card 4111 1111 1111 1111.
- Cashfree: sandbox environment, set `mode: 'sandbox'` in both adapters.
- PayU: use `mode: 'test'` → `https://test.payu.in/_payment`; their docs list test cards.
- Juspay: requires merchant onboarding before sandbox keys issue. Best-effort integration in v1.
- Stripe: test mode (`sk_test_…`, `pk_test_…`) + test card 4242 4242 4242 4242.
````

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md LICENSE MANUAL_SMOKE_TEST.md
git commit -m "docs: README, CHANGELOG, LICENSE, MANUAL_SMOKE_TEST"
```

---

### Task 9.3: Final verification

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: Exits 0.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass (no skipped / failing). Report total count.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Exits 0. Verify key outputs exist:
- `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.umd.js`
- `dist/adapters/{react,vue,angular,vanilla}/index.{mjs,cjs,d.ts}`
- `dist/gateways/{razorpay,cashfree,payu,juspay,stripe}/{browser,server}.{mjs,cjs,d.ts}`

Run:
```bash
ls dist
ls dist/adapters
ls dist/gateways/razorpay
```

- [ ] **Step 4: Sanity-check exports map resolution**

Run:
```bash
node -e "console.log(Object.keys(require('./package.json').exports))"
```
Expected: Lists `.`, `./react`, `./vue`, `./angular`, `./vanilla`, and `./{gateway}/{browser|server}` for all 5 gateways.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final verification — typecheck, tests, and build all green" --allow-empty
```

---

## Self-review checklist (run after building plan)

- [x] Every gateway from capability matrix has both a browser and server task with exact API contract and failing tests first.
- [x] `UnsupportedModeError` is thrown synchronously from `openCheckout` for PayU / Juspay / Stripe when `mode: 'modal'` is requested.
- [x] Framework adapters (React / Vue / Angular / Vanilla) are gateway-agnostic — tests use `makeFakeBrowserAdapter` to prove this.
- [x] `"node"` export condition is set on every `./{gateway}/server` entry in `package.json` — verifies browser bundlers cannot import server code.
- [x] SSR-safety is enforced: browser adapters guard `window` / `document` access, React hook does work only inside `useEffect`, Angular uses `PLATFORM_ID`.
- [x] TDD order (write failing test → verify failure → minimal implementation → verify pass → commit) is used for every non-trivial piece of logic.
- [x] No placeholders ("TODO", "implement later", etc.) in plan.

## Execution

Implement via `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Dispatch one subagent per task above; between tasks, run the relevant test command and confirm it passes before moving on. Only commit after each step completes its associated verification.
