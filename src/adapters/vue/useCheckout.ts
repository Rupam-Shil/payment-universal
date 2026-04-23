import { onBeforeUnmount, ref, type Ref } from 'vue';
import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export interface UseCheckoutReturn {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: Ref<boolean>;
  isReady: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useCheckout(
  adapter: BrowserAdapter,
  loadOptions: LoadOptions = {},
): UseCheckoutReturn {
  const isLoading = ref<boolean>(true);
  const isReady = ref<boolean>(false);
  const error = ref<Error | null>(null);
  let mounted = true;

  if (typeof window === 'undefined') {
    isLoading.value = false;
  } else {
    adapter
      .load(loadOptions)
      .then(() => {
        if (!mounted) return;
        isReady.value = true;
        isLoading.value = false;
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        error.value = err instanceof Error ? err : new Error(String(err));
        isReady.value = false;
        isLoading.value = false;
      });
  }

  const close = (): void => {
    try {
      adapter.close();
    } catch {
      /* no-op */
    }
  };

  onBeforeUnmount(() => {
    mounted = false;
    close();
  });

  const open = (options: CheckoutOptions): Promise<PaymentResult> =>
    adapter.openCheckout(options);

  return { open, close, isLoading, isReady, error };
}
