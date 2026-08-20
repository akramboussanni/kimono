"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { cx } from "./cx";

export type CrossingKind = "hanafubuki" | "shoji" | "kakejiku";

const CROSSING = {
  hanafubuki: { total: 1900, covered: 620 },
  shoji: { total: 900, covered: 340 },
  kakejiku: { total: 820, covered: 380 },
} as const satisfies Record<CrossingKind, { total: number; covered: number }>;

const PETAL = "M49 96 C30 89 13 70 14 48 C15 29 25 12 35 7 C41 4 45 15 51 28 C58 14 64 5 70 9 C80 16 88 34 87 53 C86 74 67 90 49 96 Z";
const FOLD = "M49 96 C34 88 22 73 19 57 C28 70 38 82 49 96 Z";

const CrossingContext = createContext<(kind: CrossingKind, swap: () => void) => void>(() => {});

/** Call a crossing. The swap runs at the moment the screen is fully covered. */
export function useCrossing() {
  return useContext(CrossingContext);
}

type Petal = { key: number; cls: string; style: Record<string, string> };

function makePetals(): Petal[] {
  return Array.from({ length: 64 }, (_, i) => {
    const spin = (Math.random() < .5 ? -1 : 1) * (420 + Math.random() * 520);
    const tone = Math.random();
    return {
      key: i,
      cls: tone < .3 ? "k-deep" : tone < .56 ? "k-faint" : "",
      style: {
        top: `${(Math.random() * 96).toFixed(1)}%`,
        left: `${(Math.random() * 96).toFixed(1)}%`,
        "--sz": `${(18 + Math.random() * 26).toFixed(0)}px`,
        "--y0": `${(Math.random() * 40 - 20).toFixed(0)}vh`,
        "--dx": `${(Math.random() * 64 - 22).toFixed(0)}px`,
        "--dy": `${(Math.random() * 52 - 26).toFixed(0)}px`,
        "--y3": `${(Math.random() * 50 - 25).toFixed(0)}vh`,
        "--r1": `${(spin * .3).toFixed(0)}deg`,
        "--r2": `${(spin * .42).toFixed(0)}deg`,
        "--r3": `${(spin * .53).toFixed(0)}deg`,
        "--r4": `${spin.toFixed(0)}deg`,
        "--f1": (.55 + Math.random() * .45).toFixed(2),
        "--f2": ((Math.random() < .55 ? -1 : 1) * (.45 + Math.random() * .5)).toFixed(2),
        "--f3": (.6 + Math.random() * .4).toFixed(2),
        animationDelay: `${(Math.random() * 150).toFixed(0)}ms`,
      },
    };
  });
}

/** Wrap the app once. Renders the crossing layer above all chrome. */
export function CrossingProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<CrossingKind | null>(null);
  const [petals, setPetals] = useState<Petal[]>([]);
  const busy = useRef(false);

  const cross = useCallback((next: CrossingKind, swap: () => void) => {
    if (busy.current) return;
    busy.current = true;
    if (next === "hanafubuki") setPetals(makePetals());
    setKind(next);
    const { total, covered } = CROSSING[next];
    setTimeout(swap, covered);
    setTimeout(() => { setKind(null); setPetals([]); busy.current = false; }, total);
  }, []);

  const layer = useMemo(() => {
    if (!kind) return null;
    return <div className="k-crossing" data-kind={kind} aria-hidden="true">
      {kind === "hanafubuki" ? <>
        <span className="k-haze" />
        {petals.map((p) => <svg key={p.key} className={cx("k-petal", p.cls)} viewBox="0 0 100 100" style={p.style as never}>
          <path d={PETAL} fill="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
          <path d={FOLD} style={{ fill: "var(--k-fold)" }} opacity=".55" />
        </svg>)}
      </> : null}
      {kind === "shoji" ? <><span className="k-screen k-l" /><span className="k-screen k-r" /></> : null}
      {kind === "kakejiku" ? <><span className="k-blind" /><span className="k-rod" /></> : null}
    </div>;
  }, [kind, petals]);

  return <CrossingContext.Provider value={cross}>{children}{layer}</CrossingContext.Provider>;
}
