import { useEffect, useState } from 'react';

export function Header(): JSX.Element {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-sm transition-colors ${
        scrolled ? 'bg-bg/85 border-b border-line' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1340px] items-center justify-between px-6 py-5 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-mono text-[13px] font-medium text-fg">
            payment-universal
          </span>
          <span className="hidden border border-line px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.26em] text-muted md:inline">
            v0.1 · pre-release
          </span>
        </div>
        <nav className="flex items-center gap-5 text-[11px] uppercase tracking-[0.22em] text-muted">
          <a className="hidden transition-colors hover:text-fg md:inline" href="#features">
            Principles
          </a>
          <a className="hidden transition-colors hover:text-fg md:inline" href="#matrix">
            Matrix
          </a>
          <a className="hidden transition-colors hover:text-fg md:inline" href="#switch">
            Switch
          </a>
          <a className="hidden transition-colors hover:text-fg md:inline" href="#ai">
            AI context
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
      </div>
    </header>
  );
}

function Logo(): JSX.Element {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
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
