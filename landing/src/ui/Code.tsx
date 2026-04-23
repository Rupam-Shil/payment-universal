import { type ReactNode } from 'react';

/* Tiny hand-rolled syntax colorizer primitives.
   Kept intentionally small: pulling in prism/shiki for a landing page is overkill. */

export const Kw = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-[#ff92c0]">{children}</span>
);
export const Str = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-[#e8e28b]">{children}</span>
);
export const Id = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-fg">{children}</span>
);
export const Fn = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-[#7fc8ff]">{children}</span>
);
export const Br = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-muted">{children}</span>
);
export const Sub = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="italic text-subtle">{children}</span>
);
export const Tk = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-muted">{children}</span>
);
export const El = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-[#c3f26b]">{children}</span>
);
export const At = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-[#7fc8ff]">{children}</span>
);
export const Accent = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-lime accent-glow">{children}</span>
);

export function Line({
  children,
  indent = 0,
  className = '',
}: {
  children?: ReactNode;
  indent?: number;
  className?: string;
}): JSX.Element {
  return (
    <div className={className}>
      {indent > 0 && <span>{'  '.repeat(indent)}</span>}
      {children ?? ' '}
    </div>
  );
}
