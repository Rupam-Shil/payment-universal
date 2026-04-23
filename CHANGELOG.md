# Changelog

## 0.1.1 — 2026-04-24

- fix(pkg): remove `MANUAL_SMOKE_TEST.md` from the published tarball — it's an internal dev-only guide. 0.1.0 has been deprecated; install 0.1.1+.
- fix(stripe): allow `successUrl` / `cancelUrl` overrides in `StripeServerConfig` (previously hardcoded to `example.test`).

## 0.1.0 — 2026-04-24 (deprecated)

- Initial implementation (pre-release).
- Five gateways: Razorpay, Cashfree, PayU, Juspay, Stripe — browser + server adapters.
- Four framework adapters: React (`useCheckout`), Vue 3 (`useCheckout`), Angular (`CheckoutService` + `CheckoutModule`), Vanilla (`PaymentClient`).
- One-time payments only. Subscriptions, refunds, webhooks are out of scope for v1.
- Capability flags: modal/redirect per gateway; synchronous `UnsupportedModeError` from `openCheckout`.
