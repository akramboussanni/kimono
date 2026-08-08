"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SakuraMon } from "@kimono/ui";

const blossoms = [
  { x: 357, y: 118, scale: 1.05, delay: "240ms" },
  { x: 257, y: 236, scale: .76, delay: "410ms" },
  { x: 416, y: 333, scale: .9, delay: "520ms" },
  { x: 304, y: 482, scale: .64, delay: "650ms" },
  { x: 427, y: 626, scale: .78, delay: "740ms" },
  { x: 316, y: 784, scale: .58, delay: "820ms" },
  { x: 396, y: 936, scale: .68, delay: "900ms" },
];

function TreeBlossom({ x, y, scale, delay }: (typeof blossoms)[number]) {
  return (
    <g className="tree-blossom" style={{ "--bloom-delay": delay } as CSSProperties} transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((rotation) => (
        <path key={rotation} className="tree-petal" transform={`rotate(${rotation})`} d="M0 -5 C-10 -14 -9 -31 1 -43 C11 -31 12 -14 0 -5Z" />
      ))}
      <circle className="tree-pollen" r="7" />
      <circle className="tree-heart" r="2.6" />
    </g>
  );
}

export function SakuraProgressTree() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)));
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    function move(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth - .5) * 7;
      const y = (event.clientY / window.innerHeight - .5) * 7;
      document.documentElement.style.setProperty("--sakura-shift-x", `${x.toFixed(2)}px`);
      document.documentElement.style.setProperty("--sakura-shift-y", `${y.toFixed(2)}px`);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <svg className="sakura-house-tree" viewBox="0 0 520 1100" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
        <path className="tree-limb tree-limb-shadow" d="M492 -35 C482 124 389 172 414 306 C439 441 347 493 395 638 C432 749 345 845 370 1127" />
        <path className="tree-limb" d="M492 -35 C482 124 389 172 414 306 C439 441 347 493 395 638 C432 749 345 845 370 1127" />
        <path className="tree-limb-light" d="M481 -31 C473 126 382 171 406 305 C430 438 340 492 388 636" />
        <g className="tree-twigs">
          <path d="M449 109 C389 91 356 104 319 137 C287 165 246 167 205 151" />
          <path d="M410 278 C354 251 302 230 243 239 C209 244 181 262 151 289" />
          <path d="M409 399 C457 375 478 349 499 315" />
          <path d="M375 522 C327 497 281 484 237 499 C207 509 184 529 153 542" />
          <path d="M397 648 C451 621 480 592 507 550" />
          <path d="M371 781 C327 754 283 745 241 758 C212 767 186 790 161 815" />
          <path d="M370 925 C421 899 456 865 485 826" />
        </g>
        <g className="tree-leaves">
          <path d="M338 119 C310 94 279 100 262 126 C287 137 313 137 338 119Z" />
          <path d="M273 238 C250 208 218 209 196 232 C218 248 245 250 273 238Z" />
          <path d="M439 376 C465 350 490 358 501 383 C480 394 458 392 439 376Z" />
          <path d="M287 489 C264 461 231 464 213 490 C236 503 260 503 287 489Z" />
          <path d="M431 620 C457 592 485 600 497 626 C474 639 453 636 431 620Z" />
          <path d="M283 753 C259 727 228 731 211 757 C232 769 258 768 283 753Z" />
        </g>
        <g className="tree-blossoms">{blossoms.map((blossom) => <TreeBlossom key={`${blossom.x}-${blossom.y}`} {...blossom} />)}</g>
      </svg>
      <aside className="sakura-scroll" aria-hidden="true">
        <span className="sakura-scroll-label">scroll · 咲く</span>
        <span className="sakura-scroll-line" />
        <span className="sakura-scroll-bloom" style={{ top: `calc(${progress * 100}% - ${progress * 38}px + 4px)` }}><SakuraMon /></span>
      </aside>
    </>
  );
}
