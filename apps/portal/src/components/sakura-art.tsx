import Image from "next/image";
import { useId, type CSSProperties } from "react";

const PETAL_PATH = "M0-4 C-11-11-15-27-8-39 C-5-44-2-46 0-42 C2-46 5-44 8-39 C15-27 11-11 0-4Z";
const PETAL_WASH_PATH = "M0-6 C-7-14-9-27-4-36 C-2-39-1-40 0-37 C1-40 2-39 4-36 C9-27 7-14 0-6Z";

export function SakuraHeroArt() {
  const petalGradientPrefix = `falling-petal-${useId().replaceAll(":", "")}`;
  const petals = [
    { left: "67%", delay: "-2s", duration: "22s", size: 14, drift: "46px", sway: "-18px", depth: "near" },
    { left: "77%", delay: "-7s", duration: "27s", size: 10, drift: "-38px", sway: "22px", depth: "far" },
    { left: "87%", delay: "-4s", duration: "24s", size: 16, drift: "54px", sway: "-26px", depth: "near" },
    { left: "58%", delay: "-9s", duration: "30s", size: 9, drift: "28px", sway: "16px", depth: "far" },
    { left: "95%", delay: "-11s", duration: "28s", size: 12, drift: "-44px", sway: "25px", depth: "mid" },
    { left: "49%", delay: "-5s", duration: "31s", size: 8, drift: "38px", sway: "-20px", depth: "far" },
    { left: "82%", delay: "-13s", duration: "32s", size: 7, drift: "20px", sway: "30px", depth: "far" },
    { left: "72%", delay: "-10s", duration: "25s", size: 11, drift: "-24px", sway: "-14px", depth: "mid" },
  ];

  return (
    <div className="hero-sakura-art" aria-hidden="true">
      <Image className="sakura-branch-image" src="/art/sakura-branch-v2.png" alt="" fill sizes="(max-width: 680px) 100vw, 70vw" priority />
      <div className="falling-petals">
        {petals.map((petal, index) => {
          const gradientId = `${petalGradientPrefix}-${index}`;
          return <span key={index} data-depth={petal.depth} style={{ left: petal.left, width: petal.size, height: petal.size * 1.5, animationDelay: petal.delay, animationDuration: petal.duration, "--petal-drift": petal.drift, "--petal-sway": petal.sway } as CSSProperties}>
            <svg viewBox="-13 -47 26 48"><defs><linearGradient id={gradientId} x1="-8" y1="-40" x2="8" y2="-5" gradientUnits="userSpaceOnUse"><stop stopColor="#f8e1e0"/><stop offset=".48" stopColor="#e7b0b4"/><stop offset="1" stopColor="#c97882"/></linearGradient></defs><path className="falling-petal-shadow" d={PETAL_PATH}/><path className="falling-petal-body" d={PETAL_PATH} fill={`url(#${gradientId})`}/><path className="falling-petal-glint" d={PETAL_WASH_PATH}/><path className="falling-petal-vein" d="M0-6 C-1-17 0-29 0-40"/></svg>
          </span>;
        })}
      </div>
    </div>
  );
}
