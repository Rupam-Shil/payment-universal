import { GATEWAYS } from '../lib/gateways';
import { SectionLabel } from '../ui/SectionLabel';
import { useInView } from '../hooks/useInView';

export function Matrix(): JSX.Element {
  return (
    <section
      id="matrix"
      className="mx-auto max-w-[1340px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel
        index="02"
        eyebrow="Capability matrix"
        title="How each gateway actually behaves"
        body={
          <>
            Gateways differ. Pretending they don&apos;t is a bug. Every adapter
            reports its <code className="text-fg">capabilities</code> at runtime,
            and asking for a mode the gateway can&apos;t serve throws{' '}
            <code className="text-lime">UnsupportedModeError</code> before the
            call leaves your code.
          </>
        }
      />

      <div className="mt-16 overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse font-mono text-[13px]">
          <thead>
            <tr className="border-y border-line text-left text-[10.5px] uppercase tracking-[0.26em] text-muted">
              <th className="py-4 pr-6 font-light">Gateway</th>
              <th className="py-4 pr-6 font-light">Modal</th>
              <th className="py-4 pr-6 font-light">Redirect</th>
              <th className="py-4 pr-6 font-light">Script host</th>
              <th className="py-4 pr-6 font-light">Verification</th>
              <th className="py-4 font-light">v1</th>
            </tr>
          </thead>
          <tbody>
            {GATEWAYS.map((g, i) => (
              <Row
                key={g.key}
                label={g.label}
                modal={g.modal}
                redirect={g.redirect}
                scriptHost={g.scriptHost}
                note={g.note}
                stagger={i * 60}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-8 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted">
        <Legend color="lime" symbol="✓" label="supported" />
        <Legend color="subtle" symbol="—" label="throws at call site" />
        <span className="text-subtle">webhooks · subscriptions · refunds → v2</span>
      </div>
    </section>
  );
}

function Row({
  label,
  modal,
  redirect,
  scriptHost,
  note,
  stagger,
}: {
  label: string;
  modal: boolean;
  redirect: boolean;
  scriptHost: string;
  note: string;
  stagger: number;
}): JSX.Element {
  const [ref, inView] = useInView<HTMLTableRowElement>();
  return (
    <tr
      ref={ref}
      style={{ transitionDelay: `${stagger}ms` }}
      className={`group border-b border-line transition-all duration-500 hover:bg-[#0f1014] ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <td className="py-5 pr-6 text-fg">
        <span className="font-serif text-[26px] italic tracking-tightest">
          {label}
        </span>
      </td>
      <td className="py-5 pr-6">
        {modal ? <Check /> : <Dash label="modal unsupported" />}
      </td>
      <td className="py-5 pr-6">
        {redirect ? <Check /> : <Dash label="redirect unsupported" />}
      </td>
      <td className="py-5 pr-6 text-subtle">{scriptHost}</td>
      <td className="py-5 pr-6 text-fg/75 text-[12px]">{note}</td>
      <td className="py-5 text-[10.5px] uppercase tracking-[0.2em] text-lime">
        shipped
      </td>
    </tr>
  );
}

function Check(): JSX.Element {
  return (
    <span
      aria-label="supported"
      className="inline-flex h-7 w-7 items-center justify-center border border-lime/40 bg-lime/10 text-lime transition-colors group-hover:border-lime/80"
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

function Legend({
  color,
  symbol,
  label,
}: {
  color: 'lime' | 'subtle';
  symbol: string;
  label: string;
}): JSX.Element {
  const classes = color === 'lime' ? 'text-lime' : 'text-subtle';
  return (
    <span className="flex items-center gap-2">
      <span className={classes}>{symbol}</span>
      <span>{label}</span>
    </span>
  );
}
