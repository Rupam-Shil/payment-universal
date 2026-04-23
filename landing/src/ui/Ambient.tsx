import { useEffect, useState } from 'react';

/**
 * A soft radial spotlight that tracks the cursor. Gives the near-black bg
 * a subtle sense of depth without the stale "purple blob gradient" look.
 */
export function Ambient(): JSX.Element {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.28 });

  useEffect(() => {
    let raf = 0;
    let target = pos;
    const onMove = (e: MouseEvent): void => {
      target = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      if (!raf) {
        raf = window.requestAnimationFrame(() => {
          setPos(target);
          raf = 0;
        });
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: `radial-gradient(800px circle at ${pos.x * 100}% ${
          pos.y * 100
        }%, rgba(208, 245, 0, 0.07), transparent 55%)`,
      }}
    />
  );
}
