import { NgModule, type ModuleWithProviders } from '@angular/core';
import {
  CheckoutService,
  PAYMENT_ADAPTER,
  PAYMENT_LOAD_OPTIONS,
} from './checkout.service';
import type { BrowserAdapter, LoadOptions } from '../../core';

@NgModule({ providers: [CheckoutService] })
export class CheckoutModule {
  public static forRoot(
    adapter: BrowserAdapter,
    loadOptions: LoadOptions = {},
  ): ModuleWithProviders<CheckoutModule> {
    return {
      ngModule: CheckoutModule,
      providers: [
        CheckoutService,
        { provide: PAYMENT_ADAPTER, useValue: adapter },
        { provide: PAYMENT_LOAD_OPTIONS, useValue: loadOptions },
      ],
    };
  }
}
