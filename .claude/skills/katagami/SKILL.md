---
name: katagami
description: Run the Katagami design-language workflow — build a consistent, distinctive visual vocabulary one element class at a time (buttons, then links, inputs, containers, nav), via specimen sheets the user picks from, before crafting any real page. Use when the user wants a signature theme, says the UI feels generic or "AI", asks to design buttons/links/components as a system, or asks to continue/resume design work. Not for one-off styling of a single screen.
---

# Katagami

型紙 — the carved stencil a dyer cuts once, then presses onto every bolt of cloth
so the whole garment carries one pattern. That is the point of this workflow: a
vocabulary is cut *before* pages are made, so consistency is structural rather
than remembered.

## The rule this exists to enforce

**The signature is a mechanic, not a pattern.** It reads something real — how the
user is moving, or what the system is actually doing — and responds. A repeating
motif in the corners is wallpaper no matter how well drawn.

The reference case: a Persona theme where Makoto Yuki walks along the bottom of
the page as you scroll, and breaks into a run when you scroll fast. The idea is
not "put a character on the page". It is that the page has a living thing in it
whose behaviour is driven by your behaviour.

Test every proposal with two questions:

1. **What does it read?** Scroll velocity, cursor approach speed, dwell time,
   which app is used most, what the server is actually doing right now, the
   date. If the answer is "nothing", it is decoration.
2. **What does it tell you that you did not already know?** If the answer is
   "nothing", it is decoration that moves.

Never reuse a mechanic from a previous project. The vines-as-underline device
from the portfolio is that project's answer, not a template. Each app earns its
own.

## State lives in `design/`

    design/
      README.md         current stage, what is decided, what is next
      motifs.md         the vocabulary: devices, their jobs, what is banned
      queue.md          element classes in order, with status
      specimens/        one HTML sheet per round (NN-element.html)
      decisions/        one ADR per accepted element class

Read `design/README.md` first, always. It says where we are. If `design/` does
not exist, you are at Stage 0 — create it from the templates in this repo.

## Stages

**0 — Motif brief.** The user names the world and the candidate devices; you
research what the codebase already uses so nothing is reinvented. Record in
`motifs.md`: each device, the structural job it could take, and its cost. Do not
proceed until at least one device has a job.

**1 — Specimen sheet.** One element class only. Build a standalone HTML page in
`design/specimens/` showing real, interactive specimens grouped by motif family.
Publish it as an Artifact so the user can click through it. Every specimen states
three things, visibly on the sheet:

  - the motif it comes from
  - the web convention it challenges
  - its cost — accessibility, performance, or build complexity

A specimen with no named convention is decoration; do not include it. Show each
specimen in every state it will really have (rest, hover, focus-visible, active,
disabled, loading) — a specimen that only looks good at rest is not a specimen.

**2 — Verdict.** The user marks each: keep / adjust / kill. Adjustments produce a
revised sheet at the same path — same Artifact URL, so the history stays in one
place. Kills go into `motifs.md` under "Ruled out", with the reason, and are
never proposed again.

**3 — Cut the stencil.** The accepted specimen becomes real tokens and CSS in the
app. Write `design/decisions/NNNN-<element>.md` in the repo's ADR format
(Status, Date, Context, Decision, Consequences) recording what was chosen, what
was rejected, and why. Update `queue.md`.

**4 — Proof page.** Once several element classes are cut, rebuild **one** real
page using only accepted vocabulary. This is the gate. Anything the page needs
that does not exist yet becomes the next Stage 1 sheet — do not improvise it
inline. A vocabulary that cannot carry a real page is not finished.

**5 — Roll out.** Remaining pages, one at a time, each composed deliberately. Any
new element sends you back to Stage 1.

## Standing rules

- **One element class in flight at a time.** Buttons are not done until they are
  cut; do not start inputs early.
- **Look at it.** Screenshot every sheet and every page before claiming it works.
  Never judge a design from source alone.
- **Never re-propose a kill.** Check `motifs.md` before every sheet.
- **The user's words win.** Their vocabulary, their spelling, their metaphors.
- **Cost is stated, not hidden.** If a specimen breaks keyboard access or needs
  JavaScript to be legible, say so on the sheet, next to it.
- **Restraint is part of the language.** One loud device surrounded by quiet ones
  reads as designed; five loud devices read as a demo.

## Quality floor for anything shipped

Responsive to mobile, visible `:focus-visible`, `prefers-reduced-motion`
respected, text contrast at least 4.5:1 (3:1 for large or bold ≥24px), hit
targets ≥44px, and no color-only state encoding.
