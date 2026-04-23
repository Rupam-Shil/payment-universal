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
