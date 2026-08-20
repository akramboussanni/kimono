/* The Kimono blossom. One definition, used by every sheet and every control.
   Three petal variants, not one shape repeated — a real drift shows petals at
   different angles and curls, and a single mirrored silhouette is the thing that
   reads as clip-art. Each carries a fold: the curled edge catching light, in the
   paper tone. That fold is what makes it a drawn petal rather than a flat vector. */
window.Sakura = (() => {
  const P = {
    /* face-on, leaning right, deep notch */
    a: { body: "M49 96 C30 89 13 70 14 48 C15 29 25 12 35 7 C41 4 45 15 51 28 C58 14 64 5 70 9 C80 16 88 34 87 53 C86 74 67 90 49 96 Z",
         fold: "M49 96 C34 88 22 73 19 57 C28 70 38 82 49 96 Z",
         vein: "M49 89 C47 71 47 51 50 33", sw: 3.2 },
    /* twisted, one lobe rolling away from you */
    b: { body: "M52 96 C36 86 26 66 30 46 C33 28 42 12 51 7 C56 12 58 22 57 33 C62 22 68 15 73 18 C81 24 85 42 81 59 C76 77 64 89 52 96 Z",
         fold: "M52 96 C44 82 40 63 43 47 C47 65 50 80 52 96 Z",
         vein: "M52 89 C49 72 48 53 51 36", sw: 3 },
    /* edge-on, nearly folded shut */
    c: { body: "M50 95 C42 80 38 58 42 38 C45 22 50 11 55 7 C58 15 61 28 62 42 C64 62 58 82 50 95 Z",
         fold: "M50 95 C46 79 45 59 47 41 C51 60 52 78 50 95 Z",
         vein: "M50 88 C48 72 48 56 50 40", sw: 2.8 },
  };

  const petal = (k) => {
    const p = P[k];
    return `<path d="${p.body}" fill="currentColor" stroke-width="${p.sw}" stroke-linejoin="round"/>` +
           `<path d="${p.fold}" style="fill:var(--petal-fold)" opacity=".55"/>` +
           `<path d="${p.vein}" fill="none" stroke-width="2.2" stroke-linecap="round" opacity=".3"/>`;
  };

  const leaf = (deg) =>
    `<g transform="rotate(${deg},50,50)"><g transform="translate(27,3) scale(.46)">` +
    `<path d="${P.a.body}" fill="currentColor" stroke-width="6.4" stroke-linejoin="round"/>` +
    `<path d="${P.a.fold}" style="fill:var(--petal-fold)" opacity=".45"/></g></g>`;

  const bloomInner =
    [0, 72, 144, 216, 288].map(leaf).join("") +
    `<circle cx="50" cy="50" r="8" fill="currentColor" stroke-width="4"/>` +
    `<circle cx="50" cy="50" r="3.4" style="fill:var(--petal-fold)" stroke="none"/>`;

  /* An app's identity is its bloom on a stem. A noren and a chōchin both carry the
     shop's crest, so the sprig is what gets printed on them. */
  const sprig =
    `<path d="M11 94 C28 85 44 73 54 58" fill="none" style="stroke:var(--stem)" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M27 81 C17 73 18 59 30 55 C40 60 38 75 27 81 Z" style="fill:var(--stem)"/>` +
    `<path d="M30 78 C29 70 29 63 30 57" fill="none" style="stroke:var(--petal-fold)" stroke-width="1.8" opacity=".5" stroke-linecap="round"/>` +
    `<g transform="translate(60,36)"><g transform="scale(.76) translate(-50,-50)">${bloomInner}</g></g>`;

  const defs =
    `<svg class="sakura-defs" width="0" height="0" aria-hidden="true" style="position:absolute"><defs>` +
      `<symbol id="sakura-petal-a" viewBox="0 0 100 100">${petal("a")}</symbol>` +
      `<symbol id="sakura-petal-b" viewBox="0 0 100 100">${petal("b")}</symbol>` +
      `<symbol id="sakura-petal-c" viewBox="0 0 100 100">${petal("c")}</symbol>` +
      `<symbol id="sakura-petal" viewBox="0 0 100 100">${petal("a")}</symbol>` +
      `<symbol id="sakura-blossom" viewBox="0 0 100 100"><g stroke-linejoin="round">${bloomInner}</g></symbol>` +
      `<symbol id="sakura-sprig" viewBox="0 0 100 100"><g stroke-linejoin="round">${sprig}</g></symbol>` +
    `</defs></svg>`;

  const css =
    `.sakura { display:block; overflow:visible; color:var(--accent-pale); stroke:var(--accent);` +
    ` --petal-fold:var(--face); --stem:#7c5a3c; --glyph:var(--ink); }` +
    `.sakura.deep { color:color-mix(in srgb, var(--accent-pale) 62%, var(--accent)); }` +
    `.sakura.faint { color:color-mix(in srgb, var(--accent-pale) 52%, var(--face)); }`;

  function install() {
    if (document.querySelector(".sakura-defs")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    document.body.insertAdjacentHTML("afterbegin", defs);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();

  return {
    mark(kind, cls, style) {
      return '<svg class="sakura ' + (cls || "") + '" style="' + (style || "") +
             '" aria-hidden="true"><use href="#sakura-' + (kind || "petal-a") + '"/></svg>';
    },
    /* weighted so whole blossoms stay occasional */
    random(blossomChance) {
      if (Math.random() < (blossomChance === undefined ? 0.12 : blossomChance)) return "blossom";
      const r = Math.random();
      return r < 0.45 ? "petal-a" : r < 0.78 ? "petal-b" : "petal-c";
    },
    /* An app's mark is generated, not drawn: the bloom is the container and the
       app's own glyph sits in its centre. Every app gets one for free. */
    app(glyph, cls, style) {
      return '<svg class="sakura ' + (cls || "") + '" viewBox="0 0 100 100" style="' + (style || "") +
             '" aria-hidden="true"><use href="#sakura-sprig"/>' +
             '<g transform="translate(60,36) scale(.52) translate(-50,-50)" fill="none" ' +
             'style="stroke:var(--glyph)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">' +
             glyph + '</g></svg>';
    },
    glyphs: {
      notes:   '<path d="M34 24h32v52H34z"/><path d="M44 38h14M44 50h14M44 62h9"/>',
      photos:  '<path d="M24 32h52v36H24z"/><path d="M32 60l12-13 9 9 8-7 11 11"/><circle cx="63" cy="43" r="4"/>',
      recipes: '<path d="M26 48h48c0 13-11 23-24 23S26 61 26 48Z"/><path d="M40 32v7M50 28v11M60 32v7"/>',
      outline: '<path d="M30 30h40M30 44h40M40 58h30M40 72h20"/>',
    },
    tone() {
      const r = Math.random();
      return r < 0.3 ? "deep" : r < 0.56 ? "faint" : "";
    },
  };
})();
