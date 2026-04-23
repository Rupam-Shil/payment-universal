import { useState } from 'react';
import { GATEWAYS, type GatewayKey, GATEWAY_MAP } from '../lib/gateways';
import { SectionLabel } from '../ui/SectionLabel';

type Pair = { from: GatewayKey; to: GatewayKey };

const SHORTCUTS: Pair[] = [
  { from: 'razorpay', to: 'cashfree' },
  { from: 'cashfree', to: 'stripe' },
  { from: 'razorpay', to: 'payu' },
  { from: 'stripe', to: 'juspay' },
];

export function SwitchDiff(): JSX.Element {
  const [pair, setPair] = useState<Pair>({ from: 'razorpay', to: 'cashfree' });
  const from = GATEWAY_MAP[pair.from];
  const to = GATEWAY_MAP[pair.to];

  return (
    <section
      id="switch"
      className="mx-auto max-w-[1340px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel
        index="03"
        eyebrow="The real promise"
        title="Switching gateways, literally"
        body={
          <>
            Four lines of diff across two files. That&apos;s the entire change
            when you move from one provider to another. Pick any pair below
            and see what actually changes.
          </>
        }
      />

      {/* Gateway pair selector */}
      <div className="mt-14 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.26em] text-muted">
            migrate
          </span>
          <GatewayPicker
            value={pair.from}
            onChange={(from) => setPair((p) => ({ ...p, from }))}
            label="from"
            exclude={pair.to}
          />
          <Arrow />
          <GatewayPicker
            value={pair.to}
            onChange={(to) => setPair((p) => ({ ...p, to }))}
            label="to"
            exclude={pair.from}
          />
          <div className="ml-auto hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle sm:flex">
            <span>shortcuts:</span>
            {SHORTCUTS.map((sc) => (
              <button
                key={`${sc.from}-${sc.to}`}
                onClick={() => setPair(sc)}
                className="border border-line px-2 py-1 transition-colors hover:border-lime hover:text-lime"
              >
                {sc.from} → {sc.to}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: unified diff + sidebar */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-14">
        {/* Unified diff */}
        <div>
          <DiffBlock
            title="client / PayButton.tsx"
            baseFromAdapter={from.fn}
            baseToAdapter={to.fn}
            fromArgs={from.browserArgs || '/* no config */'}
            toArgs={to.browserArgs || '/* no config */'}
            fromKey={from.key}
            toKey={to.key}
            side="client"
          />
          <div className="mt-8">
            <DiffBlock
              title="server / api/checkout/route.ts"
              baseFromAdapter={from.fn.replace('Browser', 'Server')}
              baseToAdapter={to.fn.replace('Browser', 'Server')}
              fromArgs={from.serverArgs}
              toArgs={to.serverArgs}
              fromKey={from.key}
              toKey={to.key}
              side="server"
            />
          </div>
        </div>

        {/* Sidebar — what changes / stays */}
        <aside className="flex flex-col gap-6">
          <StatCard label="Lines changed" value="4" sub="2 client · 2 server" tone="lime" />
          <StatCard label="Lines that stay" value="every other one" sub="hooks, order shape, verify endpoint, handlers" tone="fg" />

          <div className="border border-line bg-code p-5">
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
              What doesn&apos;t change
            </div>
            <ul className="space-y-2.5 font-mono text-[11.5px] text-fg/80">
              {[
                'useCheckout(adapter) call shape',
                'CheckoutOptions shape (order, mode, prefill)',
                'PaymentResult → /api/verify flow',
                'server.createOrder(OrderRequest) signature',
                'server.verifyPayment(payload) signature',
                'Error handling (PaymentError subclasses)',
              ].map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span className="mt-[3px] h-1.5 w-1.5 shrink-0 bg-lime" aria-hidden />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>

          {!GATEWAY_MAP[pair.to].modal && GATEWAY_MAP[pair.from].modal && (
            <div className="border border-ember/40 bg-ember/5 p-5">
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-ember">
                Capability change
              </div>
              <p className="font-mono text-[11.5px] leading-relaxed text-fg/85">
                <span className="text-fg">{to.label}</span> has no drop-in modal
                in v1. If your UI called <code className="text-fg">open(&#123; mode: &apos;modal&apos; &#125;)</code>,
                update it to{' '}
                <code className="text-fg">mode: &apos;redirect&apos;</code> with a{' '}
                <code className="text-fg">returnUrl</code>, or branch on{' '}
                <code className="text-fg">adapter.capabilities.modal</code>.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function GatewayPicker({
  value,
  onChange,
  label,
  exclude,
}: {
  value: GatewayKey;
  onChange: (g: GatewayKey) => void;
  label: string;
  exclude?: GatewayKey;
}): JSX.Element {
  return (
    <label className="group relative inline-flex items-center gap-2 border border-line bg-code px-3 py-2 font-mono text-[11.5px] transition-colors focus-within:border-lime hover:border-fg/40">
      <span className="text-[9.5px] uppercase tracking-[0.26em] text-subtle">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as GatewayKey)}
        className="appearance-none bg-transparent pr-4 font-mono text-[12px] uppercase tracking-[0.2em] text-lime outline-none"
      >
        {GATEWAYS.map((g) => (
          <option key={g.key} value={g.key} disabled={g.key === exclude} className="bg-bg text-fg">
            {g.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-subtle">▾</span>
    </label>
  );
}

function Arrow(): JSX.Element {
  return (
    <span
      aria-hidden
      className="inline-flex items-center font-mono text-[18px] text-lime"
    >
      →
    </span>
  );
}

interface DiffBlockProps {
  title: string;
  baseFromAdapter: string;
  baseToAdapter: string;
  fromArgs: string;
  toArgs: string;
  fromKey: GatewayKey;
  toKey: GatewayKey;
  side: 'client' | 'server';
}

function DiffBlock({
  title,
  baseFromAdapter,
  baseToAdapter,
  fromArgs,
  toArgs,
  fromKey,
  toKey,
  side,
}: DiffBlockProps): JSX.Element {
  const importPath = side === 'client' ? 'browser' : 'server';
  const frameworkLine =
    side === 'client'
      ? "import { useCheckout } from 'payment-universal/react';"
      : "// single server adapter, same contract across gateways";
  const tailLine =
    side === 'client'
      ? 'const { open, isReady } = useCheckout(adapter);'
      : "const order = await server.createOrder({ amount, currency: 'INR' });";

  const lines: { kind: 'plain' | 'add' | 'remove'; text: string }[] = [
    { kind: 'plain', text: frameworkLine },
    {
      kind: 'remove',
      text: `import { ${baseFromAdapter} } from 'payment-universal/${fromKey}/${importPath}';`,
    },
    {
      kind: 'add',
      text: `import { ${baseToAdapter} } from 'payment-universal/${toKey}/${importPath}';`,
    },
    { kind: 'plain', text: '' },
    {
      kind: 'remove',
      text:
        side === 'client'
          ? `const adapter = ${baseFromAdapter}({ ${fromArgs} });`
          : `const server = ${baseFromAdapter}({ ${fromArgs} });`,
    },
    {
      kind: 'add',
      text:
        side === 'client'
          ? `const adapter = ${baseToAdapter}({ ${toArgs} });`
          : `const server = ${baseToAdapter}({ ${toArgs} });`,
    },
    { kind: 'plain', text: '' },
    { kind: 'plain', text: tailLine },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border border-line bg-code px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        <span>{title}</span>
        <span className="text-subtle">
          2 lines changed · 0 deleted elsewhere
        </span>
      </div>
      <pre className="overflow-x-auto border border-t-0 border-line bg-code py-4 font-mono text-[12.5px] leading-[1.85]">
        <code>
          {lines.map((ln, i) => {
            const prefix =
              ln.kind === 'add' ? '+' : ln.kind === 'remove' ? '-' : ' ';
            const row =
              ln.kind === 'add'
                ? 'bg-lime/[0.08] text-lime'
                : ln.kind === 'remove'
                  ? 'bg-ember/[0.07] text-ember'
                  : 'text-fg/80';
            return (
              <div
                key={i}
                className={`flex whitespace-pre px-4 ${row}`}
              >
                <span className="mr-3 w-6 shrink-0 text-right font-mono text-[10.5px] leading-[1.85] text-subtle">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mr-3 shrink-0 text-subtle">{prefix}</span>
                <span className="flex-1">{ln.text || ' '}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'lime' | 'fg';
}): JSX.Element {
  const valueClass = tone === 'lime' ? 'text-lime' : 'text-fg';
  return (
    <div className="border border-line bg-code p-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
        {label}
      </div>
      <div
        className={`mt-2 font-serif text-[42px] italic leading-none tracking-tightest ${valueClass}`}
      >
        {value}
      </div>
      <div className="mt-3 font-mono text-[11px] text-fg/70">{sub}</div>
    </div>
  );
}
