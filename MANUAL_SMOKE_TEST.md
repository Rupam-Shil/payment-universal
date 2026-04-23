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
