import { useState } from 'react';
import { CodeSwitcher } from './CodeSwitcher';
import { InstallTabs } from '../ui/InstallTabs';
import { CopyButton } from '../ui/CopyButton';
import { AI_CONTEXT } from '../lib/aiContext';

export function Hero(): JSX.Element {
  return (
    <section className="relative mx-auto max-w-[1340px] px-6 pb-24 pt-14 sm:px-10 lg:px-14 lg:pt-20">
      <div className="grid-bg absolute inset-0 -z-10" aria-hidden />

      <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12 lg:gap-12">
        {/* ==================== LEFT ==================== */}
        <div className="lg:col-span-6">
          <Tag>Multi-gateway · TypeScript · MIT · pre-release</Tag>

          <h1 className="mt-7 font-serif text-[60px] leading-[0.94] tracking-tightest text-fg sm:text-[80px] lg:text-[96px]">
            <span className="animate-slide-up block italic">swap one import.</span>
            <span
              className="animate-slide-up mt-2 inline-block font-mono text-[32px] font-light tracking-tight text-muted sm:text-[44px] lg:text-[50px]"
              style={{ animationDelay: '120ms' }}
            >
              <span className="text-lime accent-glow">five</span> gateways.
            </span>
          </h1>

          <p
            className="animate-fade-in mt-9 max-w-[54ch] font-mono text-[13.5px] leading-relaxed text-fg/80"
            style={{ animationDelay: '420ms' }}
          >
            A TypeScript payment SDK for merchants who change their minds.
            Razorpay, Cashfree, PayU, Juspay, and Stripe sit behind one API.
            Switch providers by editing two lines — the framework hook, the
            order shape, the verify endpoint all stay identical.
          </p>

          {/* ACTIONS ROW — install + AI copy */}
          <div
            className="animate-fade-in mt-8 flex flex-col gap-3"
            style={{ animationDelay: '560ms' }}
          >
            <InstallTabs packageName="payment-universal" variant="hero" />
            <div className="flex flex-wrap items-center gap-3">
              <CopyAIButton />
              <a
                href="https://github.com/Rupam-Shil/payment-universal"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 border border-line bg-bg px-4 py-3 font-mono text-[12px] text-fg transition-colors hover:border-fg/40 hover:text-lime"
              >
                <GithubMark />
                <span>github</span>
                <span className="transition-transform group-hover:translate-x-0.5">↗</span>
              </a>
              <a
                href="https://www.npmjs.com/package/payment-universal"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 border border-line bg-bg px-4 py-3 font-mono text-[12px] text-fg transition-colors hover:border-fg/40 hover:text-lime"
              >
                <NpmMark />
                <span>npm</span>
                <span className="transition-transform group-hover:translate-x-0.5">↗</span>
              </a>
            </div>
          </div>

          {/* STATS */}
          <dl className="mt-14 grid max-w-[500px] grid-cols-4 gap-4 border-t border-line pt-8 font-mono text-[11px]">
            <Stat n="5" label="gateways" />
            <Stat n="4" label="frameworks" />
            <Stat n="61" label="tests" />
            <Stat n="0" label="runtime deps" />
          </dl>
        </div>

        {/* ==================== RIGHT ==================== */}
        <div className="lg:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
              ↻ same-api · different adapter
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-subtle">
              auto-rotate · 4.2s
            </span>
          </div>
          <CodeSwitcher />
          <p className="mt-4 ml-1 font-mono text-[11px] leading-relaxed text-subtle">
            Only the <span className="text-fg">import</span> and{' '}
            <span className="text-fg">adapter factory</span> lines change. Every
            gateway surfaces the same <code className="text-fg">useCheckout</code>{' '}
            + <code className="text-fg">open()</code> contract.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Tag({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="inline-flex items-center gap-3 border-b border-line pb-2 font-mono text-[10.5px] uppercase tracking-[0.3em] text-muted">
      <span className="h-1.5 w-1.5 bg-lime" aria-hidden />
      {children}
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }): JSX.Element {
  return (
    <div>
      <dt className="font-serif text-[34px] italic leading-none text-fg">{n}</dt>
      <dd className="mt-2 text-[9.5px] uppercase tracking-[0.24em] text-muted">
        {label}
      </dd>
    </div>
  );
}

function CopyAIButton(): JSX.Element {
  const [flashed, setFlashed] = useState(false);
  return (
    <CopyButton
      text={AI_CONTEXT}
      onCopy={() => {
        setFlashed(true);
        window.setTimeout(() => setFlashed(false), 1800);
      }}
      className={`group relative inline-flex items-center gap-3 border px-5 py-3 font-mono text-[12px] transition-all ${
        flashed
          ? 'border-lime bg-lime text-bg'
          : 'border-fg/30 bg-bg text-fg hover:border-lime hover:text-lime'
      }`}
    >
      <SparkIcon flashed={flashed} />
      <span className="uppercase tracking-[0.22em]">
        {flashed ? 'copied for ai' : 'copy for ai'}
      </span>
      <span
        className={`rounded border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.26em] transition-colors ${
          flashed ? 'border-bg/30 text-bg/80' : 'border-line text-subtle group-hover:border-lime/40 group-hover:text-lime/80'
        }`}
      >
        ~8kb · md
      </span>
    </CopyButton>
  );
}

function SparkIcon({ flashed }: { flashed: boolean }): JSX.Element {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      aria-hidden
      className={`transition-transform ${flashed ? 'scale-110' : ''}`}
    >
      <path
        d="M8 1 L9.5 6.5 L15 8 L9.5 9.5 L8 15 L6.5 9.5 L1 8 L6.5 6.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GithubMark(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2.01-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.11-.75.4-1.26.74-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.12 3.06.74.81 1.19 1.83 1.19 3.09 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.11 0 1.52-.01 2.74-.01 3.11 0 .31.21.68.8.56 4.57-1.51 7.85-5.82 7.85-10.9C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function NpmMark(): JSX.Element {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2 3 L2 21 L6 21 L6 9 L11 9 L11 21 L14 21 L14 3 Z M14 3 L22 3 L22 21 L18 21 L18 9 L15 9 L15 3 Z" />
    </svg>
  );
}
