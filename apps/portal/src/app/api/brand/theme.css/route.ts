import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  const { brand } = await getPlatformSettings();
  const [primary, secondary, soft] = brand.colors;
  const css = `:root,html[data-theme="light"]{--kimono-sakura:${primary}!important;--kimono-vermillion:${primary}!important;--kimono-plum:${secondary}!important;--kimono-sakura-pale:${soft}!important;--ak-accent:${primary}!important;--pf-global--primary-color--100:${secondary}!important;--pf-v5-global--primary-color--100:${secondary}!important}`;
  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
