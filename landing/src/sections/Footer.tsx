export function Footer(): JSX.Element {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1340px] px-6 py-16 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-10 border-b border-line pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Logo />
              <span className="font-serif text-[28px] italic tracking-tightest text-fg">
                payment-universal
              </span>
            </div>
            <p className="mt-5 max-w-[40ch] font-mono text-[11.5px] leading-relaxed text-fg/70">
              A framework-agnostic TypeScript payment SDK for Razorpay,
              Cashfree, PayU, Juspay, and Stripe. Built with the{' '}
              <a
                className="underline decoration-subtle decoration-dotted underline-offset-4 hover:text-lime"
                href="https://github.com/Rupam-Shil/razorpay-universal"
                target="_blank"
                rel="noreferrer"
              >
                razorpay-universal
              </a>{' '}
              playbook.
            </p>
          </div>

          <FooterGroup
            label="Package"
            links={[
              { href: 'https://www.npmjs.com/package/payment-universal', text: 'npm' },
              { href: 'https://github.com/Rupam-Shil/payment-universal', text: 'GitHub' },
              { href: 'https://bundlephobia.com/package/payment-universal', text: 'Bundlephobia' },
              { href: 'https://github.com/Rupam-Shil/payment-universal/blob/main/CHANGELOG.md', text: 'Changelog' },
            ]}
          />

          <FooterGroup
            label="Docs"
            links={[
              { href: 'https://github.com/Rupam-Shil/payment-universal/blob/main/README.md', text: 'README' },
              { href: '#matrix', text: 'Capabilities' },
              { href: '#switch', text: 'Switch guide' },
              { href: '#start', text: 'Quick start' },
              { href: '#ai', text: 'AI context' },
            ]}
          />

          <FooterGroup
            label="Author"
            links={[
              { href: 'https://github.com/Rupam-Shil', text: 'Rupam Shil' },
              { href: 'https://github.com/Rupam-Shil/razorpay-universal', text: 'razorpay-universal' },
              { href: 'https://github.com/Rupam-Shil/payment-universal/issues', text: 'Report issue' },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <span>© 2026 Rupam Shil</span>
            <span>·</span>
            <span>MIT license</span>
            <span>·</span>
            <span>no tracking · no cookies</span>
          </div>
          <div>
            <span className="text-muted">built in India · typed in TypeScript</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  label,
  links,
}: {
  label: string;
  links: { href: string; text: string }[];
}): JSX.Element {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted">
        {label}
      </div>
      <ul className="mt-4 space-y-2 font-mono text-[12px]">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target={l.href.startsWith('#') ? undefined : '_blank'}
              rel={l.href.startsWith('#') ? undefined : 'noreferrer'}
              className="text-fg/85 transition-colors hover:text-lime"
            >
              {l.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Logo(): JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
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
