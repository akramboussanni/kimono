# Making a Kimono app

A first-party app — one Kimono writes, rather than one it hosts — is **one
registry entry and one page**. Everything visible is derived from the entry, so
two apps cannot end up looking unrelated and nobody draws artwork by hand.

## 1. Declare it

Add an entry to `apps/portal/src/lib/kimono-apps.ts`:

```ts
{
  id: "kimono-photos",
  name: "Kimono Photos",
  shortName: "Photos",
  description: "Every picture your household keeps.",
  path: "/photos",
  accent: "#4a6ea8",
  glyph: "image",
  requires: "mesh",   // omit when everyone gets it
}
```

Five fields decide the whole identity:

| Field | What it drives |
| --- | --- |
| `id` | seeds the bloom, so the app always grows the same flower |
| `shortName` | the word after the Kimono wordmark in the lockup |
| `accent` | the bloom, the app's name, anything the app marks |
| `glyph` | the mark at the centre of the bloom |
| `path` | where it lives, and where the launcher tile goes |

`accent` is a single colour. `accentRamp()` derives the petal tint, body, depth
and a legible contrast from it by pinning lightness rather than scaling it — a
pale accent and a dark one produce blooms with the same read.

Glyphs live in `packages/ui/src/glyphs.tsx`. Add one there if none fit; draw it
on the bloom's 100×100 field centred on (50, 50), with round even strokes,
because it is read at 20&nbsp;px.

## 2. Build the page

```tsx
import { Compartment, Note, Row, Rows } from "@kimono/ui";
import { identityOf, ownApp } from "@/lib/kimono-apps";

export default async function PhotosPage() {
  const identity = identityOf(ownApp("kimono-photos"));
  return <AppShell user={session.user} app={identity}>
    <div className="page admin-page">
      <header className="app-intro"><p>Every picture your household keeps.</p></header>
      <Compartment label="Albums">
        <Rows>{albums.map((album) => <Row key={album.id} title={album.name}>{album.count} photos</Row>)}</Rows>
      </Compartment>
    </div>
  </AppShell>;
}
```

Passing `app` makes the shell **wear the app**: its lockup replaces the Kimono
mark, the Portal's rooms step aside for one door back, and the accent is
published as `--k-app-accent` for the whole page. The page does not repeat the
identity — the chrome already said it.

## 3. Build the body from the system

Only these, and nothing hand-rolled:

- `Compartment` — a labelled region. Compartments carry no fill; depth is edges.
- `Rows` / `Row` — a hairline-divided list. One row, one thing, at most one action.
- `Note` — a muted aside. It states; it does not list.
- `Mono` — an address or a number, unadorned.
- `Command` — something to copy. Keeps its frame, because you act on it.
- `Steps` / `Step` — a sequence, when the order is the information.
- `Field` / `Form` / `FormActions` — a labelled control and its seals.
- `Seal` / `StatedSeal` / `Door` / `Joint` — the three primitives.

If a need fits none of them it is text and a seal, not a new object. That rule
is what stopped the cards drifting: every page that wrote its own row markup got
a slightly different card.

See [`design-system.md`](design-system.md) for the contract these implement.
