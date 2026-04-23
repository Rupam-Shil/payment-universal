# pay-universal — project guidance for Claude

> If you're a fresh session, **start here, then read the design spec.** Together they reconstitute the full project context.

## What this project is

`payment-universal` is a framework-agnostic, **multi-gateway** payment SDK. It generalizes the sibling project [`razorpay-universal`](../razorpay-universal/) (single-gateway, already published on npm) to support **5 gateways** behind a uniform API:

- **Razorpay**, **Cashfree**, **PayU**, **Juspay**, **Stripe**

Promise to users: swap one adapter import line and the rest of the integration (framework hook, server endpoint, payment result handling) stays identical.

## Status

**Pre-implementation.** Design is complete and approved. No code exists yet.

The next step is to invoke `superpowers:writing-plans` to produce the detailed implementation plan, then `superpowers:executing-plans` (or `subagent-driven-development`) to build it section by section.

## Authoritative documents (read in order)

1. **`docs/superpowers/specs/2026-04-23-payment-universal-design.md`** — the design spec. Contains:
   - Decisions locked in during brainstorm (with rationale)
   - Architecture (Approach A: two-tier adapter — browser + server fully separated)
   - Package layout
   - Core types, adapter interfaces, error model
   - Capability matrix per gateway
   - Data flows for modal and redirect modes
   - Framework adapter signatures (React/Vue/Angular/Vanilla)
   - Testing strategy
   - Build / packaging plan
   - Known challenges & risks
   - Out-of-scope (v1) explicit list
   - High-level implementation sequencing
2. **This file (`CLAUDE.md`)** — operating notes for sessions.
3. **The sibling project** at `/Users/rupamshil/dev/plugins/razorpay-universal/` — production patterns. Many files in v1 are conceptually a generalization of files there.

## Locked decisions (fast reference)

| Decision | Value |
|---|---|
| Audience | Merchant-facing (one merchant, one gateway at a time, may switch) |
| Checkout flows | Modal + Redirect, with per-gateway capability flags |
| Server scope | Browser + thin server helpers (`createOrder`, `verifyPayment`) |
| Adapter pattern | Hybrid — explicit adapter import, single core API (Approach A: two-tier browser/server split) |
| v1 features | One-time payments only — no subscriptions, refunds, webhooks |
| Package name | `payment-universal` (npm) |
| Directory | `/Users/rupamshil/dev/plugins/pay-universal/` |
| Frameworks (v1) | React, Vue 3, Angular, Vanilla — same set as `razorpay-universal` |
| Node version | 18+ (uses `globalThis.fetch`) |

## Architecture summary (do not re-derive — read spec for details)

- **Core layer** (`src/core/`) — gateway-agnostic types, interfaces, generic script loader, error classes.
- **Gateway layer** (`src/gateways/{razorpay,cashfree,payu,juspay,stripe}/{browser,server}.ts`) — one factory per gateway per side. Browser factory returns a `BrowserAdapter`. Server factory returns a `ServerAdapter`.
- **Framework layer** (`src/adapters/{react,vue,angular,vanilla}/`) — gateway-agnostic hooks/services that consume `BrowserAdapter`.
- **Two-tier separation is non-negotiable.** Server entries use the `"node"` conditional export key so secret keys cannot leak into browser bundles.

## Capability matrix (v1)

| Gateway | Modal | Redirect |
|---|:---:|:---:|
| Razorpay | ✅ | ✅ |
| Cashfree | ✅ | ✅ |
| PayU | ❌ | ✅ |
| Juspay | ❌ | ✅ |
| Stripe | ❌ | ✅ |

Asking a gateway for an unsupported mode throws `UnsupportedModeError` synchronously from `openCheckout`.

## Patterns to mirror from `razorpay-universal`

When implementing, study these files first — they are the production-tested patterns to generalize:

- `../razorpay-universal/src/core/loader.ts` — singleton, idempotent script loader. Lift into `core/loader.ts`, parameterize on URL/key.
- `../razorpay-universal/src/core/checkout.ts` — Promise-wrapping pattern around callback-based gateway SDK. Reuse for the Razorpay browser adapter.
- `../razorpay-universal/src/adapters/react/useRazorpay.ts` — React hook lifecycle (loading/ready/error). Rename to `useCheckout`, parameterize on adapter.
- `../razorpay-universal/src/adapters/vue/useRazorpay.ts`, `angular/razorpay.service.ts`, `vanilla/razorpay.ts` — same generalization for the other frameworks.
- `../razorpay-universal/rollup.config.mjs` — multi-entry build config; extend with the new gateway entries.
- `../razorpay-universal/package.json` — `exports` map structure; extend to cover `./{gateway}/{browser|server}` and `./{framework}` entries.
- `../razorpay-universal/tsconfig.json`, `vitest.config.ts` — copy as-is.

## Working norms

- **TDD where it pays off.** Use `superpowers:test-driven-development` for adapter logic (server hash/signature, normalized response shapes, error mapping). Skip TDD for thin pass-through code.
- **Verification before completion.** Use `superpowers:verification-before-completion` before claiming any task done — typecheck + tests + (where applicable) actual modal opening in jsdom must pass.
- **No live gateway calls in CI.** All adapter tests mock `fetch` / window globals. A separate `MANUAL_SMOKE_TEST.md` should document how to run real sandbox transactions.
- **Single maintainer.** Keep scope tight. Resist scope creep — anything not in the design spec's §17 (out of scope) needs a new design pass.
- **Tree-shakability is a feature.** `sideEffects: false` in `package.json`. Each gateway entry is a separate chunk.
- **SSR safety is a feature.** Match `razorpay-universal`'s patterns: guard every `window`/`document` access; React adapter does no work outside `useEffect`; Angular uses `PLATFORM_ID`.

## Things to NOT do (decided against)

- ❌ Don't use a single unified adapter that introspects `typeof window` — bundlers can't reliably strip server code, secret keys leak.
- ❌ Don't use runtime gateway selection by string (`createPayClient({ gateway: 'razorpay' })`) — all gateways end up bundled.
- ❌ Don't add subscriptions in v1. Mandate models differ deeply across gateways; needs its own spec.
- ❌ Don't add refunds, webhooks, EMI, UPI Intent, Stripe Elements, mobile SDKs in v1 — out of scope.
- ❌ Don't pretend gateways are identical. Surface capability flags. `UnsupportedModeError` is a feature.

## Useful commands (once scaffolding lands)

```bash
# from /Users/rupamshil/dev/plugins/pay-universal/
npm run typecheck       # tsc --noEmit
npm run test            # vitest run
npm run test:watch      # vitest
npm run build           # rollup -c
npm run clean           # rm -rf dist
```

## Where to put new memories

If you learn something durable about this project (a user preference, a feedback rule, an external resource), save it to your memory store under the standard memory types (user/feedback/project/reference). Do **not** put session-ephemeral notes here. This file is for invariant project guidance.
