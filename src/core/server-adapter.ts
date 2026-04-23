import type {
  Capabilities,
  GatewayName,
  NormalizedOrder,
  OrderRequest,
  VerificationResult,
} from './types';

export interface ServerAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  createOrder(req: OrderRequest): Promise<NormalizedOrder>;
  /** Accepts the raw payload passed back from the browser; returns normalized verification result. */
  verifyPayment(payload: unknown): Promise<VerificationResult>;
}
