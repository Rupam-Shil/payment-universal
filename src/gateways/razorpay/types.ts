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
