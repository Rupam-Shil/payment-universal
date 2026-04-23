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
