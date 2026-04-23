# Changelog

## 0.1.0 — 2026-04-24

- Initial implementation (pre-release).
- Five gateways: Razorpay, Cashfree, PayU, Juspay, Stripe — browser + server adapters.
- Four framework adapters: React (`useCheckout`), Vue 3 (`useCheckout`), Angular (`CheckoutService` + `CheckoutModule`), Vanilla (`PaymentClient`).
- One-time payments only. Subscriptions, refunds, webhooks are out of scope for v1.
- Capability flags: modal/redirect per gateway; synchronous `UnsupportedModeError` from `openCheckout`.
