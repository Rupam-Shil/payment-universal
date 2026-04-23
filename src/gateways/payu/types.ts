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
