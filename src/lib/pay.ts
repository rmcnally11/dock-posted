import { PIN_SEASON_DOLLARS, WATCH_YEAR_DOLLARS } from "./income";

export type PayKind = "pin" | "watch";

/** Catalog lookup / Price ID. Set `STRIPE_PRICE_PIN` to use it. */
export const STRIPE_PIN_LOOKUP_KEY = "dock_posted_pin_season";
export const STRIPE_PIN_PRICE_ID = "price_1UAg3MGW7cXXvgqvz72XMgTu";

/** Catalog lookup / Price ID. Set `STRIPE_PRICE_WATCH` to use it. */
export const STRIPE_WATCH_LOOKUP_KEY = "dock_posted_watch_year";
export const STRIPE_WATCH_PRICE_ID = "price_1UAg63GW7cXXvgqvvlOgWIa4";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function catalogPriceId(kind: PayKind): string | null {
  const raw = kind === "pin" ? process.env.STRIPE_PRICE_PIN : process.env.STRIPE_PRICE_WATCH;
  return raw?.trim() || null;
}

export function applyCheckoutLineItem(
  body: URLSearchParams,
  kind: PayKind,
  name: string,
): "price" | "price_data" {
  body.set("line_items[0][quantity]", "1");
  const priceId = catalogPriceId(kind);
  if (priceId) {
    body.set("line_items[0][price]", priceId);
    return "price";
  }
  const dollars = kind === "pin" ? PIN_SEASON_DOLLARS : WATCH_YEAR_DOLLARS;
  const label = kind === "pin" ? "Dock Posted pin · one season" : "Dock Posted run watch · one year";
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(dollars * 100));
  body.set("line_items[0][price_data][product_data][name]", label);
  body.set("line_items[0][price_data][product_data][description]", name);
  return "price_data";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://dock-posted.vercel.app").replace(/\/$/, "");
}

export async function createCheckoutSession(input: {
  kind: PayKind;
  recordId: string;
  email: string;
  name: string;
  successPath?: string;
  cancelPath?: string;
}): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;

  const success =
    input.successPath ??
    (input.kind === "pin"
      ? `/pin/thanks?id=${encodeURIComponent(input.recordId)}&paid=1`
      : `/run?watched=1&paid=1`);
  const cancel =
    input.cancelPath ??
    (input.kind === "pin"
      ? `/pin/thanks?id=${encodeURIComponent(input.recordId)}`
      : `/run?watched=1`);
  const successUrl = `${siteUrl()}${success.startsWith("/") ? success : `/${success}`}`;
  const cancelUrl = `${siteUrl()}${cancel.startsWith("/") ? cancel : `/${cancel}`}`;

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", successUrl);
  body.set("cancel_url", cancelUrl);
  body.set("customer_email", input.email);
  body.set("client_reference_id", `${input.kind}:${input.recordId}`);
  body.set("metadata[kind]", input.kind);
  body.set("metadata[recordId]", input.recordId);
  body.set("managed_payments[enabled]", "false");
  applyCheckoutLineItem(body, input.kind, input.name);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    console.warn("Checkout session failed", res.status, await res.text());
    return null;
  }
  const session = (await res.json()) as { url?: string };
  return session.url ?? null;
}

export function parseCheckoutRef(ref: string | null | undefined): { kind: PayKind; recordId: string } | null {
  if (!ref) return null;
  const [kind, recordId] = ref.split(":");
  if ((kind !== "pin" && kind !== "watch") || !recordId) return null;
  return { kind, recordId };
}

export function checkoutCustomerEmail(session: {
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
} | null | undefined): string | null {
  const email = session?.customer_email?.trim() || session?.customer_details?.email?.trim() || "";
  return email || null;
}
