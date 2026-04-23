import { useEffect, useRef, useState } from 'react';
import { GATEWAYS } from '../lib/gateways';
import { Accent, Br, Id, Kw, Line, Str, Tk, El, At, Sub } from '../ui/Code';

const ROTATE_MS = 4200;

export function CodeSwitcher(): JSX.Element {
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
      {/* corner brackets for editorial framing */}
      <span className="absolute -left-3 -top-3 h-5 w-5 border-l border-t border-lime/50" aria-hidden />
      <span className="absolute -right-3 -top-3 h-5 w-5 border-r border-t border-lime/50" aria-hidden />
      <span className="absolute -bottom-3 -left-3 h-5 w-5 border-b border-l border-lime/50" aria-hidden />
      <span className="absolute -bottom-3 -right-3 h-5 w-5 border-b border-r border-lime/50" aria-hidden />

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
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                paused ? 'bg-muted' : 'bg-lime animate-pulse-dot'
              }`}
            />
            {paused ? 'paused' : 'live'}
          </span>
        </div>
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
              onClick={() => {
                setIdx(i);
                setPaused(true);
                window.setTimeout(() => setPaused(false), 900);
              }}
              className={`relative flex-1 min-w-[84px] px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                active ? 'text-lime' : 'text-subtle hover:text-fg'
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
          <Line key={`import-${gw.key}`} className="morph-enter">
            <Kw>import</Kw> <Br>{'{'}</Br> <Accent>{gw.fn}</Accent>{' '}
            <Br>{'}'}</Br> <Kw>from</Kw>{' '}
            <Str>{`'payment-universal/${gw.key}/browser'`}</Str>;
          </Line>
          <Line />
          <Line key={`decl-${gw.key}`} className="morph-enter">
            <Kw>const</Kw> <Id>adapter</Id> = <Accent>{gw.fn}</Accent>(
            <Br>{'{'}</Br>{' '}
            {gw.browserArgs ? (
              <span className="text-fg">{gw.browserArgs}</span>
            ) : (
              <Sub>/* no args */</Sub>
            )}{' '}
            <Br>{'}'}</Br>);
          </Line>
          <Line />
          <Line>
            <Kw>export function</Kw> <span className="text-[#7fc8ff]">PayButton</span>() <Br>{'{'}</Br>
          </Line>
          <Line indent={2}>
            <Kw>const</Kw> <Br>{'{'}</Br> <Id>open</Id>, <Id>isReady</Id>{' '}
            <Br>{'}'}</Br> = <span className="text-[#7fc8ff]">useCheckout</span>(<Id>adapter</Id>);
          </Line>
          <Line indent={2}>
            <Kw>return</Kw> <Tk>{'<'}</Tk>
            <El>button</El> <At>onClick</At>={'{'}
            <Id>pay</Id>
            {'}'}
            <Tk>{'>'}</Tk>Pay
            <Tk>{'</'}</Tk>
            <El>button</El>
            <Tk>{'>'}</Tk>;
          </Line>
          <Line>
            <Br>{'}'}</Br>
          </Line>
        </code>
        {/* scan line effect triggered on swap via key */}
        <span
          key={`scan-${gw.key}`}
          aria-hidden
          className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/60 to-transparent"
        />
      </pre>

      {/* footnote */}
      <div className="flex items-center justify-between border border-t-0 border-line bg-code px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted">
        <span>
          {String(idx + 1).padStart(2, '0')} / {String(GATEWAYS.length).padStart(2, '0')} · everything else stays the same
        </span>
        <span className="hidden sm:inline text-subtle">hover to pause</span>
      </div>
    </div>
  );
}
