import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { markPinPaidInAirtable, markWatchPaidInAirtable } from "@/lib/airtable-desk";
import { checkoutCustomerEmail, parseCheckoutRef } from "@/lib/pay";
import { markPinPaid, markWatchPaid } from "@/lib/store";
import { sendPinPaidThankYou, sendWatchPaidThankYou } from "@/lib/thank-you";

export const dynamic = "force-dynamic";

function verifyStripe(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const raw = await request.text();
  if (secret) {
    const ok = verifyStripe(raw, request.headers.get("stripe-signature"), secret);
    if (!ok) return NextResponse.json({ ok: false }, { status: 400 });
  } else if (process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "webhook secret missing" }, { status: 400 });
  }

  let payload: {
    type?: string;
    data?: {
      object?: {
        client_reference_id?: string;
        customer_email?: string | null;
        customer_details?: { email?: string | null } | null;
        metadata?: { kind?: string; recordId?: string };
      };
    };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (payload.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const object = payload.data?.object;
  const parsed =
    parseCheckoutRef(object?.client_reference_id) ??
    (object?.metadata?.kind && object.metadata.recordId
      ? { kind: object.metadata.kind as "pin" | "watch", recordId: object.metadata.recordId }
      : null);
  if (!parsed) return NextResponse.json({ ok: true, ignored: true });

  const sessionEmail = checkoutCustomerEmail(object);

  if (parsed.kind === "pin") {
    const marked = await markPinPaid(parsed.recordId);
    if (marked?.pin.airtableId) {
      await markPinPaidInAirtable(marked.pin.airtableId, marked.pin.paidAt ?? new Date().toISOString());
    }
    if (marked?.newlyPaid) await sendPinPaidThankYou(marked.pin, sessionEmail);
  } else {
    const marked = await markWatchPaid(parsed.recordId);
    if (marked?.watch.airtableId) await markWatchPaidInAirtable(marked.watch.airtableId);
    if (marked?.newlyPaid) await sendWatchPaidThankYou(marked.watch, sessionEmail);
  }

  return NextResponse.json({ ok: true });
}
