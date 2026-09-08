import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";

export function PageLoader() {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 900);
    const t2 = setTimeout(() => setShow(false), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl bg-primary/30 animate-voice-pulse" />
          <div className="relative h-16 w-16 rounded-2xl bg-card border flex items-center justify-center shadow-elevated p-3">
            <Image src={logo} alt="AreaHustle Logo" className="h-8 w-auto object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/80"
              style={{
                animation: "voice-pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 160}ms`,
              }}
            />
          ))}
        </div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">AreaHustle</div>
      </div>
    </div>
  );
}
