import { getAppDefinition } from "@/lib/definitions";
import { readFile } from "node:fs/promises";

/**
 * An app's glyph, exactly as it ships it.
 *
 * This route used to composite its own bloom around the glyph — with a
 * different petal path and a differently placed centre than the components
 * draw, which is why a hosted app and one of Kimono's own never matched on the
 * home screen. The bloom is now drawn in one place, by `AppBloom`; this serves
 * only the glyph that goes at its centre.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const definition = await getAppDefinition((await params).id);
  if (!definition) return new Response("Not found", { status: 404 });
  const glyph = await readFile(definition.iconPath, "utf8");
  return new Response(glyph, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
