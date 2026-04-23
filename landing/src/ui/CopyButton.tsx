import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  children?: React.ReactNode;
  onCopy?: () => void;
  /** Timeout in ms before reverting the "copied" state. */
  resetMs?: number;
}

export function CopyButton({
  text,
  label = 'copy',
  copiedLabel = 'copied',
  className = '',
  children,
  onCopy,
  resetMs = 1600,
}: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handle = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      window.setTimeout(() => setCopied(false), resetMs);
    } catch {
      /* Clipboard may be blocked in insecure contexts — silently ignore. */
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={copied ? copiedLabel : label}
      className={className}
    >
      {children ?? (
        <span className="text-[11px] uppercase tracking-[0.22em]">
          {copied ? copiedLabel : label}
        </span>
      )}
    </button>
  );
}
