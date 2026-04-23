import { isPlatformBrowser } from '@angular/common';
import {
  Inject,
  Injectable,
  InjectionToken,
  Optional,
  PLATFORM_ID,
} from '@angular/core';
import {
  PaymentError,
  type BrowserAdapter,
  type CheckoutOptions,
  type LoadOptions,
  type PaymentResult,
} from '../../core';

export const PAYMENT_ADAPTER = new InjectionToken<BrowserAdapter>('PAYMENT_ADAPTER');
export const PAYMENT_LOAD_OPTIONS = new InjectionToken<LoadOptions>('PAYMENT_LOAD_OPTIONS');

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly adapter: BrowserAdapter;
  private readonly defaultLoadOptions: LoadOptions;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    @Inject(PAYMENT_ADAPTER) adapter: BrowserAdapter,
    @Optional() @Inject(PAYMENT_LOAD_OPTIONS) loadOptions: LoadOptions | null,
  ) {
    this.adapter = adapter;
    this.defaultLoadOptions = loadOptions ?? {};
  }

  public load(options?: LoadOptions): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    return this.adapter.load({ ...this.defaultLoadOptions, ...options });
  }

  public isReady(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this.adapter.isReady();
  }

  public close(): void {
    try {
      this.adapter.close();
    } catch {
      /* no-op */
    }
  }

  public open(options: CheckoutOptions): Promise<PaymentResult> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(
        new PaymentError('Checkout cannot be opened on the server.', {
          code: 'SSR_OPEN_BLOCKED',
          gateway: this.adapter.gateway,
        }),
      );
    }
    return this.adapter.openCheckout(options);
  }
}
