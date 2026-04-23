import { useInView } from '../hooks/useInView';

interface SectionLabelProps {
  index: string;
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
}

export function SectionLabel({
  index,
  eyebrow,
  title,
  body,
}: SectionLabelProps): JSX.Element {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`flex flex-col gap-6 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-baseline gap-5 sm:gap-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-subtle whitespace-nowrap">
          §{index}
        </span>
        <div className="flex flex-col gap-3">
          {eyebrow && (
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-lime">
              {eyebrow}
            </span>
          )}
          <h2 className="font-serif text-[44px] italic leading-[1.02] tracking-tightest text-fg sm:text-[58px] lg:text-[64px]">
            {title}.
          </h2>
        </div>
      </div>
      {body && (
        <p className="ml-0 max-w-[62ch] font-mono text-[13px] leading-relaxed text-fg/80 sm:ml-[72px]">
          {body}
        </p>
      )}
    </div>
  );
}
