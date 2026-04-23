import type {
  Capabilities,
  CheckoutOptions,
  GatewayName,
  LoadOptions,
  PaymentResult,
} from './types';

export interface BrowserAdapter {
  readonly gateway: GatewayName;
  readonly capabilities: Capabilities;
  load(options?: LoadOptions): Promise<void>;
  isReady(): boolean;
  openCheckout(options: CheckoutOptions): Promise<PaymentResult>;
  close(): void;
}
