import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export class PaymentClient {
  private readonly adapter: BrowserAdapter;
  private readonly loadOptions: LoadOptions;

  constructor(adapter: BrowserAdapter, loadOptions: LoadOptions = {}) {
    this.adapter = adapter;
    this.loadOptions = loadOptions;
  }

  public get isReady(): boolean {
    return this.adapter.isReady();
  }

  public load(): Promise<void> {
    return this.adapter.load(this.loadOptions);
  }

  public open(options: CheckoutOptions): Promise<PaymentResult> {
    return this.adapter.openCheckout(options);
  }

  public close(): void {
    try {
      this.adapter.close();
    } catch {
      /* no-op */
    }
  }
}
