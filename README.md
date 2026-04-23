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
