import { useState } from 'react';
import { AI_CONTEXT } from '../lib/aiContext';
import { SectionLabel } from '../ui/SectionLabel';
import { CopyButton } from '../ui/CopyButton';

const PREVIEW_LINES = [
  '# payment-universal — AI coding context',
  '',
  '> You are assisting a developer who is using `payment-universal`, a',
  '> framework-agnostic TypeScript payment SDK. This file is the single',
  '> source of truth for code generation, refactoring, and debugging.',
  '',
  '## Mental model (read this before generating any code)',
  '',
  '1. Two-tier split. Every gateway ships a browser adapter and a server',
  '   adapter at separate subpath exports. Server entries use the "node"',
  '   export condition so browser bundlers physically refuse to import',
  '   them. Secret keys never reach the client bundle.',
  '',
  '2. Framework hooks are gateway-agnostic. useCheckout(adapter) does not',
  '   know which gateway it wraps.',
  '',
  '...',
];

const lineCount = AI_CONTEXT.split('\n').length;
const byteCount = new Blob([AI_CONTEXT]).size;
const tokenCountRough = Math.round(AI_CONTEXT.length / 4);

export function AIContextSection(): JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <section
      id="ai"
      className="mx-auto max-w-[1340px] border-t border-line px-6 py-24 sm:px-10 lg:px-14"
    >
      <SectionLabel
        index="05"
        eyebrow="Agent-ready"
        title="Context, packed for your AI"
        body={
          <>
            One click copies a self-contained markdown primer — capability
            matrix, every exported type, all gateway configs, error classes,
            framework signatures, and a dozen canonical patterns. Paste it
            into Cursor, Claude Code, Copilot, or ChatGPT. Your agent stops
            guessing.
          </>
        }
      />

      <div
        className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left — the copy CTA + facts */}
        <div className="flex flex-col gap-8">
          <div className="border border-line bg-code p-6 sm:p-8">
            <div className="flex items-baseline justify-between font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
              <span>payment-universal.md</span>
              <span className="text-subtle">self-contained · no external links</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-6 border-t border-line pt-6 font-mono text-[11px]">
              <Fact label="lines" value={String(lineCount)} />
              <Fact label="size" value={`${(byteCount / 1024).toFixed(1)} kb`} />
              <Fact label="~ tokens" value={tokenCountRough.toLocaleString()} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CopyButton
                text={AI_CONTEXT}
                label="copy context"
                copiedLabel="copied · paste in your agent"
                className="group inline-flex items-center gap-3 bg-lime px-5 py-3 font-mono text-[12px] font-medium uppercase tracking-[0.22em] text-bg transition-transform hover:-translate-y-0.5"
              >
                <SparkIcon />
                <span className="copy-label-default">copy primer</span>
                <span className="copy-label-copied hidden">
                  copied · paste in your agent
                </span>
              </CopyButton>
              <span className="font-mono text-[11px] text-muted">
                works with cursor, claude code, copilot, chatgpt
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            {[
              'complete type definitions',
              'every gateway config signature',
              'all 4 framework adapter shapes',
              'canonical patterns (5 examples)',
              'error class hierarchy',
              'security rules',
            ].map((it) => (
              <li
                key={it}
                className="flex items-start gap-2 border border-line bg-code px-3 py-2 text-fg/80"
              >
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 bg-lime" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — preview */}
        <div className="relative">
          <div className="absolute inset-x-0 -top-3 z-10 flex justify-between px-2 font-mono text-[10.5px] uppercase tracking-[0.26em]">
            <span className="bg-bg px-2 text-muted">preview</span>
            <span className="bg-bg px-2 text-subtle">
              {hovered ? 'full text copies on click' : 'scroll to see more'}
            </span>
          </div>
          <pre className="relative max-h-[460px] overflow-hidden border border-line bg-code px-6 py-6 font-mono text-[12px] leading-[1.75] text-fg/75">
            <code>
              {PREVIEW_LINES.map((ln, i) => (
                <div
                  key={i}
                  className={
                    ln.startsWith('#')
                      ? 'text-fg'
                      : ln.startsWith('>')
                        ? 'italic text-[#e8e28b]'
                        : ''
                  }
                >
                  <span className="mr-3 inline-block w-6 text-right text-subtle">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {ln || ' '}
                </div>
              ))}
            </code>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent"
              aria-hidden
            />
          </pre>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-[0.26em] text-subtle">
        {label}
      </div>
      <div className="mt-1 font-serif text-[28px] italic leading-none text-fg">
        {value}
      </div>
    </div>
  );
}

function SparkIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M8 1 L9.5 6.5 L15 8 L9.5 9.5 L8 15 L6.5 9.5 L1 8 L6.5 6.5 Z" />
    </svg>
  );
}
