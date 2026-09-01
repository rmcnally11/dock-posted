import { PIN_SEASON_DOLLARS, WATCH_YEAR_DOLLARS } from "./income";

export type PayKind = "pin" | "watch";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
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

  const dollars = input.kind === "pin" ? PIN_SEASON_DOLLARS : WATCH_YEAR_DOLLARS;
  const label = input.kind === "pin" ? "Dock Posted pin · one season" : "Dock Posted run watch · one year";
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
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(dollars * 100));
  body.set("line_items[0][price_data][product_data][name]", label);
  body.set("line_items[0][price_data][product_data][description]", input.name);

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
