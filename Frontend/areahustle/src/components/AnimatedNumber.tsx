import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  duration = 1200,
  format = (n?: number) => (n || 0).toLocaleString("en-NG"),
  className,
}: {
  value?: number;
  duration?: number;
  format?: (n?: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value || 0);
  useEffect(() => {
    const from = display;
    const to = value || 0;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className={className}>{format(display)}</span>;
}
