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
