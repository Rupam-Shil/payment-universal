import { SectionLabel } from '../ui/SectionLabel';
import { useInView } from '../hooks/useInView';

interface Feature {
  ix: string;
  title: string;
  body: string;
  code?: string;
}

const FEATURES: Feature[] = [
  {
    ix: '01',
    title: 'Two-tier by bundler, not by convention',
    body: 'Server adapters live at `*/server` entries with the "node" export condition. Browser bundlers refuse to resolve them. Secret keys cannot leak into client code — it is impossible, not merely unlikely.',
    code: "import { razorpayServer } from 'payment-universal/razorpay/server';\n// ↑ throws at build time if imported from a client file",
  },
  {
    ix: '02',
    title: 'Framework hooks are gateway-agnostic',
    body: 'useCheckout, the Vue composable, the Angular service, the Vanilla client — all consume the BrowserAdapter interface. Swap gateways by changing which factory you pass in. The surface stays identical.',
    code: 'const { open, isReady } = useCheckout(adapter);\n// same call for all 5 gateways',
  },
  {
    ix: '03',
    title: 'Honest capability flags',
    body: 'PayU, Juspay, and Stripe do not ship drop-in modals. We do not pretend otherwise. Calling openCheckout({ mode: "modal" }) on an adapter that does not support it throws UnsupportedModeError synchronously — before any network call.',
    code: "adapter.capabilities // { modal: false, redirect: true, ... }",
  },
  {
    ix: '04',
    title: 'Tree-shakable subpath exports',
    body: 'Each gateway and framework is a separate entry with `sideEffects: false`. Importing razorpayBrowser ships exactly that. No registry, no dispatcher, no dead code — just ESM modules doing their job.',
    code: "// only Razorpay's browser adapter ends up in your bundle\nimport { razorpayBrowser } from 'payment-universal/razorpay/browser';",
  },
];

export function Features(): JSX.Element {
  return (
    <section
      id="features"
      className="mx-auto max-w-[1340px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel
        index="01"
        eyebrow="Principles"
        title="Four decisions that survived contact with reality"
        body={
          <>
            Not a feature list — a design contract. These are the invariants
            that hold across every gateway, every framework, and every release.
          </>
        }
      />

      <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.ix} feature={f} stagger={i * 90} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  stagger,
}: {
  feature: Feature;
  stagger: number;
}): JSX.Element {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${stagger}ms` }}
      className={`group relative flex flex-col gap-6 bg-bg p-8 transition-all duration-700 sm:p-10 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-subtle">
          §{feature.ix}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-lime">
          invariant
        </span>
      </div>
      <h3 className="font-serif text-[28px] italic leading-[1.08] tracking-tight text-fg sm:text-[32px]">
        {feature.title}
      </h3>
      <p className="font-mono text-[12.5px] leading-relaxed text-fg/75">
        {feature.body}
      </p>
      {feature.code && (
        <pre className="mt-auto overflow-x-auto border border-line bg-code px-4 py-3 font-mono text-[11.5px] leading-[1.55] text-fg/85">
          <code>{feature.code}</code>
        </pre>
      )}
      {/* hover accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-lime transition-transform duration-500 group-hover:scale-x-100"
      />
    </div>
  );
}
