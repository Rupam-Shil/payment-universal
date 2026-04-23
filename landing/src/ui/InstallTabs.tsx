import { useState } from 'react';
import { CopyButton } from './CopyButton';

type PM = 'npm' | 'pnpm' | 'yarn' | 'bun';

const COMMAND_BUILDERS: Record<PM, (pkg: string) => string> = {
  npm: (pkg) => `npm install ${pkg}`,
  pnpm: (pkg) => `pnpm add ${pkg}`,
  yarn: (pkg) => `yarn add ${pkg}`,
  bun: (pkg) => `bun add ${pkg}`,
};

const ORDER: PM[] = ['npm', 'pnpm', 'yarn', 'bun'];

interface InstallTabsProps {
  packageName?: string;
  /** Compact = smaller, for in-step placement. */
  variant?: 'hero' | 'compact';
  className?: string;
}

export function InstallTabs({
  packageName = 'payment-universal',
  variant = 'hero',
  className = '',
}: InstallTabsProps): JSX.Element {
  const [pm, setPm] = useState<PM>('npm');
  const command = COMMAND_BUILDERS[pm](packageName);

  const isHero = variant === 'hero';

  return (
    <div
      className={`group relative border border-line bg-code font-mono ${
        isHero ? 'text-[13px]' : 'text-[12px]'
      } ${className}`}
    >
      {/* tab row */}
      <div className="flex items-center justify-between border-b border-line">
        <div role="tablist" aria-label="Package manager" className="flex">
          {ORDER.map((key) => {
            const active = pm === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setPm(key)}
                className={`px-3 py-2 text-[10.5px] uppercase tracking-[0.22em] transition-colors ${
                  active
                    ? 'text-lime'
                    : 'text-subtle hover:text-fg'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
        <CopyButton
          text={command}
          className="flex h-full items-center gap-2 border-l border-line px-4 py-2 text-[10.5px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-lime"
        />
      </div>

      {/* command line */}
      <div className={`flex items-center gap-3 ${isHero ? 'px-5 py-4' : 'px-4 py-3'}`}>
        <span className="text-subtle">$</span>
        <span className="overflow-x-auto whitespace-nowrap text-fg">{command}</span>
      </div>
    </div>
  );
}
