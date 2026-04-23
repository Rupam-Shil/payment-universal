import { useEffect, useRef, useState } from 'react';

type GatewayKey = 'razorpay' | 'cashfree' | 'payu' | 'juspay' | 'stripe';

interface GatewayMeta {
  key: GatewayKey;
  label: string;
  fn: string;
  args: string;
  modal: boolean;
  redirect: boolean;
  scriptHost: string;
}

const GATEWAYS: GatewayMeta[] = [
  {
    key: 'razorpay',
    label: 'Razorpay',
    fn: 'razorpayBrowser',
    args: "keyId: 'rzp_test_...'",
    modal: true,
    redirect: true,
    scriptHost: 'checkout.razorpay.com',
  },
  {
    key: 'cashfree',
    label: 'Cashfree',
    fn: 'cashfreeBrowser',
    args: "appId: 'CF_APP_...', mode: 'production'",
    modal: true,
    redirect: true,
    scriptHost: 'sdk.cashfree.com',
  },
  {
    key: 'payu',
    label: 'PayU',
    fn: 'payuBrowser',
    args: '',
    modal: false,
    redirect: true,
    scriptHost: 'server-generated',
  },
  {
    key: 'juspay',
    label: 'Juspay',
    fn: 'juspayBrowser',
    args: '',
    modal: false,
    redirect: true,
    scriptHost: 'server-generated',
  },
  {
    key: 'stripe',
    label: 'Stripe',
    fn: 'stripeBrowser',
    args: "publishableKey: 'pk_test_...'",
    modal: false,
    redirect: true,
    scriptHost: 'js.stripe.com',
  },
];

const ROTATE_MS = 4000;

export function App(): JSX.Element {
  return (
    <>
      <div className="grain" aria-hidden />
      <main className="relative min-h-screen">
        <Header />
        <Hero />
        <Matrix />
        <SwitchDiff />
        <QuickStart />
        <Footer />
      </main>
    </>
  );
}

function Header(): JSX.Element {
  return (
    <header className="mx-auto flex max-w-[1320px] items-center justify-between px-6 pt-8 sm:px-10 lg:px-14">
      <div className="flex items-center gap-3">
        <Logo />
        <span className="text-sm font-medium tracking-tight text-fg">
          payment-universal
        </span>
        <span className="hidden text-[11px] font-light text-subtle md:inline">
          v0.1.0
        </span>
      </div>
      <nav className="flex items-center gap-6 text-[12px] uppercase tracking-[0.18em] text-muted">
        <a
          className="transition-colors hover:text-fg"
          href="#matrix"
        >
          Gateways
        </a>
        <a
          className="transition-colors hover:text-fg"
          href="#switch"
        >
          Switch
        </a>
        <a
          className="transition-colors hover:text-fg"
          href="#start"
        >
          Start
        </a>
        <a
          className="text-fg transition-colors hover:text-lime"
          href="https://github.com/Rupam-Shil/payment-universal"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}

function Logo(): JSX.Element {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="6" fill="#0a0b0e" stroke="#1a1c20" />
      <path
        d="M8 10 L8 22 M8 10 L14 10 A4 4 0 0 1 14 18 L8 18"
        stroke="#d0f500"
        strokeWidth="2.5"
        strokeLinecap="square"
        fill="none"
      />
      <circle cx="23" cy="21" r="2.2" fill="#d0f500" />
    </svg>
  );
}

function Hero(): JSX.Element {
  return (
    <section className="relative mx-auto max-w-[1320px] px-6 pb-20 pt-16 sm:px-10 lg:px-14 lg:pt-24">
      <div className="grid-bg absolute inset-0 -z-10" aria-hidden />
      <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <Tag>Framework-agnostic · Multi-gateway · MIT</Tag>

          <h1 className="mt-8 font-serif text-[64px] leading-[0.95] tracking-tightest text-fg sm:text-[84px] lg:text-[104px]">
            <span className="animate-slide-up italic">swap</span>{' '}
            <span
              className="animate-slide-up inline-block"
              style={{ animationDelay: '80ms' }}
            >
              one
            </span>{' '}
            <span
              className="animate-slide-up inline-block italic text-lime accent-glow"
              style={{ animationDelay: '160ms' }}
            >
              import.
            </span>
            <br />
            <span
              className="animate-slide-up inline-block font-mono text-[40px] font-light tracking-tight text-muted sm:text-[52px] lg:text-[60px]"
              style={{ animationDelay: '260ms' }}
            >
              five gateways.
            </span>
          </h1>

          <p
            className="animate-fade-in mt-10 max-w-[52ch] font-mono text-[14px] leading-relaxed text-fg/80"
            style={{ animationDelay: '500ms' }}
          >
            A TypeScript payment SDK built for merchants who change their minds.
            Razorpay, Cashfree, PayU, Juspay, and Stripe sit behind one uniform
            API. Switch providers by editing two lines — the framework hook,
            the order shape, the verify endpoint all stay identical.
          </p>

          <div
            className="animate-fade-in mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: '640ms' }}
          >
            <CopyCommand command="npm install payment-universal" />
            <a
              href="https://github.com/Rupam-Shil/payment-universal"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-[13px] text-fg transition-colors hover:border-fg/40 hover:text-lime"
            >
              <span>View source</span>
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-8 border-t border-line pt-8 font-mono text-[12px]">
            <Stat n="5" label="gateways" />
            <Stat n="4" label="frameworks" />
            <Stat n="61" label="tests, 0 flake" />
          </dl>
        </div>

        <div className="lg:col-span-6">
          <CodeSwitcher />
        </div>
      </div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="inline-flex items-center gap-3 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
      <span className="h-1.5 w-1.5 bg-lime" aria-hidden />
      {children}
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }): JSX.Element {
  return (
    <div>
      <dt className="font-serif text-[34px] italic leading-none text-fg">
        {n}
      </dt>
      <dd className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted">
        {label}
      </dd>
    </div>
  );
}

function CopyCommand({ command }: { command: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  const onCopy = (): void => {
    navigator.clipboard?.writeText(command).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      },
      () => {
        /* clipboard may be blocked in insecure contexts — silently ignore */
      },
    );
  };

  return (
    <button
      onClick={onCopy}
      className="group relative inline-flex items-center gap-3 bg-lime px-5 py-3 font-mono text-[13px] font-medium text-bg transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_0_-3px_#d0f500]"
    >
      <span className="text-bg/60">$</span>
      <span>{command}</span>
      <span
        className={`min-w-[46px] text-right text-[11px] uppercase tracking-[0.2em] transition-opacity ${
          copied ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'
        }`}
      >
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}

function CodeSwitcher(): JSX.Element {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const gw = GATEWAYS[idx];
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % GATEWAYS.length);
    }, ROTATE_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="animate-fade-in relative"
      style={{ animationDelay: '360ms' }}
    >
      {/* terminal chrome */}
      <div className="flex items-center justify-between border border-line bg-code px-4 py-3 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ember" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffb000]" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="ml-4 text-subtle">
            ~/acme/components/PayButton.tsx
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted">
          {paused ? 'paused' : 'live'}
        </span>
      </div>

      {/* gateway tabs */}
      <div
        role="tablist"
        aria-label="Active gateway"
        className="flex overflow-x-auto border-x border-line bg-code"
      >
        {GATEWAYS.map((g, i) => {
          const active = i === idx;
          return (
            <button
              key={g.key}
              role="tab"
              aria-selected={active}
              onClick={() => setIdx(i)}
              className={`relative flex-1 min-w-[96px] px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active
                  ? 'text-lime'
                  : 'text-subtle hover:text-fg'
              }`}
            >
              <span>{g.label}</span>
              {active && (
                <span
                  className={`rotate-bar absolute inset-x-0 bottom-0 h-[2px] bg-lime ${
                    paused ? 'paused' : ''
                  }`}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* code pane */}
      <pre className="relative overflow-x-auto border border-line bg-code px-6 py-7 font-mono text-[13.5px] leading-[1.7] text-fg/90">
        <code>
          <Line>
            <Kw>import</Kw> <Br>{'{'}</Br> <Id>useCheckout</Id> <Br>{'}'}</Br>{' '}
            <Kw>from</Kw> <Str>'payment-universal/react'</Str>;
          </Line>
          <Line
            key={`import-${gw.key}`}
            className="morph-enter text-lime accent-glow"
          >
            <Kw>import</Kw> <Br>{'{'}</Br> <span>{gw.fn}</span> <Br>{'}'}</Br>{' '}
            <Kw>from</Kw>{' '}
            <Str>{`'payment-universal/${gw.key}/browser'`}</Str>;
          </Line>
          <Line />
          <Line
            key={`decl-${gw.key}`}
            className="morph-enter"
          >
            <Kw>const</Kw> <Id>adapter</Id> = <span className="text-lime">{gw.fn}</span>(
            <Br>{'{'}</Br>{' '}
            {gw.args ? <span className="text-fg">{gw.args}</span> : <Sub>/* no args */</Sub>}{' '}
            <Br>{'}'}</Br>);
          </Line>
          <Line />
          <Line>
            <Kw>export function</Kw> <Fn>PayButton</Fn>() <Br>{'{'}</Br>
          </Line>
          <Line indent={2}>
            <Kw>const</Kw> <Br>{'{'}</Br> <Id>open</Id>, <Id>isReady</Id> <Br>{'}'}</Br> = <Fn>useCheckout</Fn>(
            <Id>adapter</Id>);
          </Line>
          <Line indent={2}>
            <Kw>return</Kw>{' '}
            <Tk>{'<'}</Tk>
            <El>button</El>{' '}
            <At>onClick</At>={'{'}
            <Id>pay</Id>
            {'}'}
            <Tk>{'>'}</Tk>Pay<Tk>{'</'}</Tk>
            <El>button</El>
            <Tk>{'>'}</Tk>;
          </Line>
          <Line>
            <Br>{'}'}</Br>
          </Line>
        </code>
      </pre>

      {/* footnote */}
      <div className="flex items-center justify-between border border-t-0 border-line bg-code px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
        <span>
          {idx + 1} / {GATEWAYS.length} · everything else stays the same
        </span>
        <span className="hidden sm:inline">hover to pause</span>
      </div>
    </div>
  );
}

/* ------- tiny syntax colorizers (monospaced, no external lib) ------- */
const Kw = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-[#ff92c0]">{children}</span>
);
const Str = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-[#e8e28b]">{children}</span>
);
const Id = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-fg">{children}</span>
);
const Fn = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-[#7fc8ff]">{children}</span>
);
const Br = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-muted">{children}</span>
);
const Sub = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="italic text-subtle">{children}</span>
);
const Tk = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-muted">{children}</span>
);
const El = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-[#c3f26b]">{children}</span>
);
const At = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <span className="text-[#7fc8ff]">{children}</span>
);

function Line({
  children,
  indent = 0,
  className = '',
}: {
  children?: React.ReactNode;
  indent?: number;
  className?: string;
}): JSX.Element {
  return (
    <div className={className}>
      {indent > 0 && <span>{'  '.repeat(indent)}</span>}
      {children ?? ' '}
    </div>
  );
}

/* ================= Capability matrix ================= */
function Matrix(): JSX.Element {
  return (
    <section
      id="matrix"
      className="mx-auto max-w-[1320px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel index="02" title="How each gateway behaves" />
      <p className="mt-4 max-w-[64ch] font-mono text-[13px] leading-relaxed text-fg/80">
        Gateways differ. Pretending they don't is a bug. Instead,{' '}
        <span className="text-fg">capability flags</span> are surfaced on every
        browser adapter, and calling <InlineCode>openCheckout</InlineCode> in
        an unsupported mode throws{' '}
        <InlineCode className="text-lime">UnsupportedModeError</InlineCode>{' '}
        synchronously — so bugs fail at the call site, not mid-transaction.
      </p>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse font-mono text-[13px]">
          <thead>
            <tr className="border-y border-line text-left text-[11px] uppercase tracking-[0.22em] text-muted">
              <th className="py-4 pr-6 font-light">Gateway</th>
              <th className="py-4 pr-6 font-light">Modal</th>
              <th className="py-4 pr-6 font-light">Redirect</th>
              <th className="py-4 pr-6 font-light">Script host</th>
              <th className="py-4 font-light">v1</th>
            </tr>
          </thead>
          <tbody>
            {GATEWAYS.map((g) => (
              <tr
                key={g.key}
                className="group border-b border-line transition-colors hover:bg-[#0f1014]"
              >
                <td className="py-5 pr-6 text-fg">
                  <span className="font-serif text-[24px] italic tracking-tightest">
                    {g.label}
                  </span>
                </td>
                <td className="py-5 pr-6">
                  {g.modal ? <Check /> : <Dash label="modal unsupported" />}
                </td>
                <td className="py-5 pr-6">
                  {g.redirect ? <Check /> : <Dash label="redirect unsupported" />}
                </td>
                <td className="py-5 pr-6 text-subtle">{g.scriptHost}</td>
                <td className="py-5 text-[11px] uppercase tracking-[0.2em] text-lime">
                  shipped
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        <span className="text-lime">✓</span> supported &nbsp;·&nbsp;{' '}
        <span className="text-subtle">—</span> throws at call site &nbsp;·&nbsp;
        webhooks / subscriptions / refunds → v2
      </p>
    </section>
  );
}

function Check(): JSX.Element {
  return (
    <span
      aria-label="supported"
      className="inline-flex h-7 w-7 items-center justify-center border border-lime/40 bg-lime/10 text-lime"
    >
      ✓
    </span>
  );
}

function Dash({ label }: { label: string }): JSX.Element {
  return (
    <span
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center border border-line text-subtle"
    >
      —
    </span>
  );
}

function InlineCode({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code className={`border border-line bg-code px-1.5 py-0.5 text-[12px] ${className}`}>
      {children}
    </code>
  );
}

function SectionLabel({
  index,
  title,
}: {
  index: string;
  title: string;
}): JSX.Element {
  return (
    <div className="flex items-baseline gap-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        §{index}
      </span>
      <h2 className="font-serif text-[44px] italic leading-[1.02] tracking-tightest text-fg sm:text-[56px]">
        {title}.
      </h2>
    </div>
  );
}

/* ================= Switch diff ================= */
function SwitchDiff(): JSX.Element {
  return (
    <section
      id="switch"
      className="mx-auto max-w-[1320px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel index="03" title="Switching gateways, literally" />

      <p className="mt-4 max-w-[64ch] font-mono text-[13px] leading-relaxed text-fg/80">
        The real promise. Your merchant wants to try Cashfree for a month, then
        roll back to Razorpay. This is the whole diff.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <DiffPane
          title="before · razorpay"
          lines={[
            {
              kind: 'plain',
              text: "import { useCheckout } from 'payment-universal/react';",
            },
            {
              kind: 'remove',
              text: "import { razorpayBrowser } from 'payment-universal/razorpay/browser';",
            },
            { kind: 'plain', text: '' },
            {
              kind: 'remove',
              text: "const adapter = razorpayBrowser({ keyId: process.env.NEXT_PUBLIC_RZP_KEY! });",
            },
            { kind: 'plain', text: '' },
            {
              kind: 'plain',
              text: 'const { open, isReady } = useCheckout(adapter);',
            },
          ]}
        />

        <div className="flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center border border-line text-[22px] text-lime lg:rotate-0">
            ⟶
          </div>
        </div>

        <DiffPane
          title="after · cashfree"
          lines={[
            {
              kind: 'plain',
              text: "import { useCheckout } from 'payment-universal/react';",
            },
            {
              kind: 'add',
              text: "import { cashfreeBrowser } from 'payment-universal/cashfree/browser';",
            },
            { kind: 'plain', text: '' },
            {
              kind: 'add',
              text: "const adapter = cashfreeBrowser({ appId: process.env.NEXT_PUBLIC_CF_APP!, mode: 'production' });",
            },
            { kind: 'plain', text: '' },
            {
              kind: 'plain',
              text: 'const { open, isReady } = useCheckout(adapter);',
            },
          ]}
        />
      </div>

      <p className="mt-12 max-w-[72ch] font-mono text-[12px] leading-relaxed text-muted">
        Two lines in the client. Two lines in the server. The{' '}
        <InlineCode>openCheckout</InlineCode> call, the{' '}
        <InlineCode>NormalizedOrder</InlineCode> shape, the verify endpoint, and
        the framework binding are all{' '}
        <span className="text-fg">unchanged</span>.
      </p>
    </section>
  );
}

type DiffLine = { kind: 'plain' | 'add' | 'remove'; text: string };

function DiffPane({
  title,
  lines,
}: {
  title: string;
  lines: DiffLine[];
}): JSX.Element {
  return (
    <div>
      <div className="border border-line bg-code px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        {title}
      </div>
      <pre className="overflow-x-auto border border-t-0 border-line bg-code px-4 py-5 font-mono text-[12.5px] leading-[1.7]">
        <code>
          {lines.map((ln, i) => {
            const prefix =
              ln.kind === 'add' ? '+ ' : ln.kind === 'remove' ? '- ' : '  ';
            const color =
              ln.kind === 'add'
                ? 'text-lime bg-lime/[0.07]'
                : ln.kind === 'remove'
                  ? 'text-ember bg-ember/[0.06]'
                  : 'text-fg/80';
            return (
              <div
                key={i}
                className={`-mx-4 whitespace-pre px-4 ${color}`}
              >
                <span className="text-subtle">{prefix}</span>
                {ln.text || ' '}
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

/* ================= Quick start ================= */
function QuickStart(): JSX.Element {
  return (
    <section
      id="start"
      className="mx-auto max-w-[1320px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel index="04" title="A minimum useful integration" />

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <Step
          n="01"
          title="Install"
          body={
            <pre className="mt-5 overflow-x-auto border border-line bg-code p-5 font-mono text-[12.5px] text-fg/90">
              <code>
                <span className="text-subtle">$</span> npm i payment-universal
                {'\n'}
                <span className="text-subtle">$</span> npm i
                @cashfreepayments/cashfree-js{'\n'}
                <span className="text-subtle">$</span> npm i @stripe/stripe-js
                <span className="text-subtle"> # optional peers</span>
              </code>
            </pre>
          }
        />

        <Step
          n="02"
          title="Client"
          body={
            <pre className="mt-5 overflow-x-auto border border-line bg-code p-5 font-mono text-[12.5px] leading-[1.7]">
              <code>
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span> useCheckout{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">'payment-universal/react'</span>
                ;{'\n'}
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span>{' '}
                <span className="text-lime">razorpayBrowser</span>{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">
                  'payment-universal/razorpay/browser'
                </span>
                ;{'\n\n'}
                <span className="text-[#ff92c0]">const</span> adapter ={' '}
                <span className="text-lime">razorpayBrowser</span>({'{'} keyId{' '}
                <span className="text-muted">:</span>{' '}
                <span className="text-[#e8e28b]">process.env.NEXT_PUBLIC_KEY</span>
                ! {'}'});{'\n'}
                <span className="text-[#ff92c0]">const</span> {'{'} open {'}'} ={' '}
                <span className="text-[#7fc8ff]">useCheckout</span>(adapter);
              </code>
            </pre>
          }
        />

        <Step
          n="03"
          title="Server"
          body={
            <pre className="mt-5 overflow-x-auto border border-line bg-code p-5 font-mono text-[12.5px] leading-[1.7]">
              <code>
                <span className="text-[#ff92c0]">import</span>{' '}
                <span className="text-muted">{'{'}</span>{' '}
                <span className="text-lime">razorpayServer</span>{' '}
                <span className="text-muted">{'}'}</span>{' '}
                <span className="text-[#ff92c0]">from</span>{' '}
                <span className="text-[#e8e28b]">
                  'payment-universal/razorpay/server'
                </span>
                ;{'\n\n'}
                <span className="text-[#ff92c0]">const</span> server ={' '}
                <span className="text-lime">razorpayServer</span>({'{'}{' '}
                keyId, keySecret {'}'});{'\n'}
                <span className="text-[#ff92c0]">const</span> order ={' '}
                <span className="text-[#ff92c0]">await</span>{' '}
                server.<span className="text-[#7fc8ff]">createOrder</span>(
                {'{'} amount<span className="text-muted">:</span> 49900,
                currency<span className="text-muted">:</span>{' '}
                <span className="text-[#e8e28b]">'INR'</span> {'}'});
              </code>
            </pre>
          }
        />
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <div className="flex items-baseline gap-4 border-b border-line pb-3">
        <span className="font-serif text-[28px] italic text-lime">{n}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {title}
        </span>
      </div>
      {body}
    </div>
  );
}

/* ================= Footer ================= */
function Footer(): JSX.Element {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-mono text-[12px] text-fg">
            payment-universal
          </span>
          <span className="font-mono text-[11px] text-subtle">
            v0.1.0 · MIT
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          <a
            className="transition-colors hover:text-lime"
            href="https://github.com/Rupam-Shil/payment-universal"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="transition-colors hover:text-lime"
            href="https://www.npmjs.com/package/payment-universal"
            target="_blank"
            rel="noreferrer"
          >
            npm ↗
          </a>
          <a
            className="transition-colors hover:text-lime"
            href="https://github.com/Rupam-Shil/payment-universal/blob/main/README.md"
            target="_blank"
            rel="noreferrer"
          >
            Docs ↗
          </a>
          <span className="text-subtle">built by Rupam Shil</span>
        </nav>
      </div>
    </footer>
  );
}
