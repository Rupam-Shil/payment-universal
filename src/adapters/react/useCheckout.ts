import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BrowserAdapter,
  CheckoutOptions,
  LoadOptions,
  PaymentResult,
} from '../../core';

export interface UseCheckoutReturn {
  open: (options: CheckoutOptions) => Promise<PaymentResult>;
  close: () => void;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
}

export function useCheckout(
  adapter: BrowserAdapter,
  loadOptions: LoadOptions = {},
): UseCheckoutReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef<boolean>(true);

  const { timeout, scriptUrl } = loadOptions;

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    setIsLoading(true);
    setError(null);

    adapter
      .load({ timeout, scriptUrl })
      .then(() => {
        if (!mountedRef.current) return;
        setIsReady(true);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsReady(false);
        setIsLoading(false);
      });

    return () => {
      mountedRef.current = false;
      try {
        adapter.close();
      } catch {
        /* no-op */
      }
    };
  }, [adapter, timeout, scriptUrl]);

  const close = useCallback(() => {
    try {
      adapter.close();
    } catch {
      /* no-op */
    }
  }, [adapter]);

  const open = useCallback(
    (options: CheckoutOptions): Promise<PaymentResult> => adapter.openCheckout(options),
    [adapter],
  );

  return { open, close, isLoading, isReady, error };
}
