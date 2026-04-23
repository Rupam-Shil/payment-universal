import { CheckoutLoadError } from './errors';
import type { GatewayName, LoadOptions } from './types';

export const DEFAULT_LOAD_TIMEOUT_MS = 10_000;

export interface ScriptLoaderConfig {
  gateway: GatewayName;
  defaultUrl: string;
  /** Returns true once the gateway's SDK is available on `window`. */
  isReady: () => boolean;
}

export interface ScriptLoader {
  readonly gateway: GatewayName;
  load(options?: LoadOptions): Promise<void>;
  isReady(): boolean;
  /** Test helper: clear cached in-flight promise. */
  reset(): void;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function validateScriptUrl(url: string, gateway: GatewayName): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CheckoutLoadError(`Invalid scriptUrl: "${url}" is not a valid URL.`, {
      code: 'INVALID_SCRIPT_URL',
      gateway,
    });
  }
  if (parsed.protocol !== 'https:') {
    throw new CheckoutLoadError(
      `Invalid scriptUrl: only https:// URLs are allowed (got "${parsed.protocol}").`,
      { code: 'INVALID_SCRIPT_URL', gateway },
    );
  }
}

export function createScriptLoader(config: ScriptLoaderConfig): ScriptLoader {
  let inFlight: Promise<void> | null = null;
  let inFlightUrl: string | null = null;

  const loader: ScriptLoader = {
    gateway: config.gateway,
    isReady: () => (isBrowser() ? config.isReady() : false),
    reset(): void {
      inFlight = null;
      inFlightUrl = null;
    },
    load(options: LoadOptions = {}): Promise<void> {
      const scriptUrl = options.scriptUrl ?? config.defaultUrl;
      const timeout = options.timeout ?? DEFAULT_LOAD_TIMEOUT_MS;

      if (!isBrowser()) {
        return Promise.reject(
          new CheckoutLoadError(
            `${config.gateway} script cannot be loaded in a non-browser environment.`,
            { code: 'SSR_LOAD_BLOCKED', gateway: config.gateway },
          ),
        );
      }

      try {
        validateScriptUrl(scriptUrl, config.gateway);
      } catch (err) {
        return Promise.reject(err);
      }

      if (config.isReady()) return Promise.resolve();

      if (inFlight && inFlightUrl === scriptUrl) return inFlight;

      inFlightUrl = scriptUrl;
      inFlight = new Promise<void>((resolve, reject) => {
        const escapedUrl =
          typeof CSS !== 'undefined' && CSS.escape
            ? CSS.escape(scriptUrl)
            : scriptUrl.replace(/["\\]/g, '\\$&');
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${escapedUrl}"]`,
        );

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const cleanup = (): void => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };

        const handleLoad = (): void => {
          cleanup();
          if (config.isReady()) {
            resolve();
          } else {
            inFlight = null;
            reject(
              new CheckoutLoadError(
                `${config.gateway} script loaded but SDK is not available on window.`,
                { code: 'SDK_MISSING_AFTER_LOAD', gateway: config.gateway },
              ),
            );
          }
        };

        const handleError = (err: unknown): void => {
          cleanup();
          inFlight = null;
          reject(
            new CheckoutLoadError(
              `Failed to load ${config.gateway} script from ${scriptUrl}`,
              { code: 'SCRIPT_LOAD_FAILED', gateway: config.gateway, cause: err },
            ),
          );
        };

        timeoutId = setTimeout(() => {
          inFlight = null;
          reject(
            new CheckoutLoadError(
              `Timed out after ${timeout}ms loading ${config.gateway} script from ${scriptUrl}`,
              { code: 'SCRIPT_LOAD_TIMEOUT', gateway: config.gateway },
            ),
          );
        }, timeout);

        if (existing) {
          existing.addEventListener('load', handleLoad, { once: true });
          existing.addEventListener('error', handleError, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        script.dataset.paymentUniversal = config.gateway;
        script.addEventListener('load', handleLoad, { once: true });
        script.addEventListener('error', handleError, { once: true });
        document.head.appendChild(script);
      });

      return inFlight;
    },
  };

  return loader;
}
