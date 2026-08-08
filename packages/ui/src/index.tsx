import { useId, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type SVGProps } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type BloomIdentityInput = {
  id: string;
  colors: readonly [`#${string}`, `#${string}`, `#${string}`];
};

export type BloomIdentity = {
  seed: number;
  rotation: number;
  centre: string;
  centreShadow: string;
  textureSeed: number;
  textureScale: number;
  petals: Array<{
    start: string;
    middle: string;
    end: string;
    rotation: number;
    scale: number;
    opacity: number;
  }>;
};

/**
 * Wraps an app-supplied palette in Kimono's bloom shell. The app owns its
 * colors and centre artwork; this function owns consistent petal rendering.
 */
export function createBloomIdentity(input: BloomIdentityInput): BloomIdentity {
  const seed = hashString(`${input.id}:${input.colors.join(":")}`);
  const random = mulberry32(seed);
  const rotation = -5 + random() * 10;
  const petals = Array.from({ length: 5 }, (_, index) => {
    const reversed = index % 2 === 1;
    return {
      start: reversed ? input.colors[2] : input.colors[0],
      middle: reversed ? input.colors[0] : input.colors[2],
      end: input.colors[1],
      rotation: index * 72 + (random() - .5) * 2.8,
      scale: .965 + random() * .055,
      opacity: .94 + random() * .06,
    };
  });

  return {
    seed,
    rotation,
    centre: "#282522",
    centreShadow: "#171513",
    textureSeed: 1 + seed % 97,
    textureScale: .42 + random() * .32,
    petals,
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

export function BloomMark({ identity: input, children, ...props }: SVGProps<SVGSVGElement> & { identity: BloomIdentityInput; children: ReactNode }) {
  const unique = useId().replaceAll(":", "");
  const identity = createBloomIdentity(input);
  const textureId = `bloom-texture-${unique}`;
  const centreClipId = `bloom-centre-clip-${unique}`;

  return <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
    <defs>
      {identity.petals.map((petal, index) => <linearGradient key={index} id={`bloom-gradient-${unique}-${index}`} x1="20" y1="12" x2="78" y2="90" gradientUnits="userSpaceOnUse"><stop stopColor={petal.start}/><stop offset=".5" stopColor={petal.middle}/><stop offset="1" stopColor={petal.end}/></linearGradient>)}
      <filter id={textureId} x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".03 .075" numOctaves="2" seed={identity.textureSeed} result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale={identity.textureScale}/></filter>
      <clipPath id={centreClipId}><circle cx="50" cy="50" r="19"/></clipPath>
    </defs>
    <g filter={`url(#${textureId})`} className="app-bloom-petals" transform={`rotate(${identity.rotation} 50 50)`}>
      {identity.petals.map((petal, index) => <path key={index} d="M50 46 C37 38 32 21 41 10 C45 5 50 3 50 3 C55 5 58 8 61 12 C68 23 62 38 50 46Z" transform={`rotate(${petal.rotation} 50 50) translate(50 50) scale(${petal.scale}) translate(-50 -50)`} fill={`url(#bloom-gradient-${unique}-${index})`} opacity={petal.opacity}/>)}
      {identity.petals.map((petal, index) => <path key={`h${index}`} className="app-bloom-vein" d="M50 41 C49 29 49 18 50 8" transform={`rotate(${petal.rotation} 50 50)`}/>)}
    </g>
    <circle className="app-bloom-centre-shadow" cx="50" cy="50" r="23" style={{ fill: identity.centreShadow }}/>
    <circle className="app-bloom-centre" cx="50" cy="50" r="20" style={{ fill: identity.centre }}/>
    <g className="app-bloom-glyph" clipPath={`url(#${centreClipId})`}>{children}</g>
  </svg>;
}

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx("button", className)} {...props} />;
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("surface", className)} {...props} />;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function StatusDot({ status }: { status: "online" | "degraded" | "offline" | "setup" }) {
  return <span className={cx("status-dot", `status-${status}`)} aria-label={status} title={status} />;
}

/** Reusable Kimono sakura mon. The five petals share one geometry and the
 * centre uses a folded collar motif, so it stays recognisable from favicon to hero. */
export function SakuraMon({ className = "" }: { className?: string }) {
  const inkId = `sakura-ink-${useId().replaceAll(":", "")}`;
  const petals = [0, 72, 144, 216, 288];

  return (
    <svg className={cx("sakura-mon", className)} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <defs>
        <filter id={inkId} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".035 .09" numOctaves="2" seed="17" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale=".7" />
        </filter>
      </defs>
      <g filter={`url(#${inkId})`}>
        {petals.map((rotation) => (
          <g key={rotation} transform={`rotate(${rotation} 50 50)`}>
            <path className="sakura-mon-petal-shadow" d="M50 47 C36 39 31 21 41 10 C45 5 50 3 50 3 C50 3 56 5 60 10 C70 21 64 39 50 47Z" />
            <path className="sakura-mon-petal" d="M50 45 C39 38 34 23 42 13 C45 9 48 7 50 6 C52 7 55 9 58 13 C66 23 61 38 50 45Z" />
            <path className="sakura-mon-vein" d="M50 41 C48 30 49 19 50 10" />
          </g>
        ))}
      </g>
      <circle className="sakura-mon-centre" cx="50" cy="50" r="12" />
      <path className="sakura-mon-collar" d="M42 45 L50 52 L58 45 L55 59 L50 64 L45 59Z" />
      <circle className="sakura-mon-dot" cx="50" cy="50" r="2.5" />
    </svg>
  );
}

export function KimonoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cx("kimono-mark", compact && "kimono-mark-compact")} aria-label="Kimono">
      <span className="kimono-mark-symbol" aria-hidden="true"><SakuraMon /></span>
      {!compact ? <span className="kimono-mark-word">Kimono</span> : null}
    </span>
  );
}
