"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writePinToAirtable } from "@/lib/airtable-desk";
import { parsePinInput, PIN_PRICE_LABEL, pinPitch } from "@/lib/income";
import { notifyEmail, sendMail } from "@/lib/notify";
import { createCheckoutSession } from "@/lib/pay";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import { addPinClaim, attachIncomeAirtable, readDocks } from "@/lib/store";

export async function submitPinClaim(formData: FormData): Promise<void> {
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot) {
    redirect("/pin");
  }

  const parsed = parsePinInput({
    dockId: String(formData.get("dockId") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.ok) {
    redirect(`/pin?error=${encodeURIComponent(parsed.error)}`);
  }

  const docks = await readDocks();
  const dock = docks.find((row) => row.id === parsed.value.dockId);
  if (!dock) {
    redirect("/pin?error=Pick%20the%20dock.");
  }

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    redirect("/pin?error=Too%20many%20filings%20from%20this%20network.");
  }

  const pin = await addPinClaim(parsed.value, dock.name);
  const airtableId = await writePinToAirtable(pin);
  if (airtableId) await attachIncomeAirtable("pin", pin.id, airtableId);

  const pitch = pinPitch(dock.name);
  await sendMail({
    to: notifyEmail(),
    subject: `Pin filed · ${dock.name}`,
    text: [
      `${dock.name}. ${PIN_PRICE_LABEL}.`,
      `${pin.contactName} · ${pin.phone} · ${pin.email}`,
      pin.role,
      pin.note ?? "",
      "",
      pitch,
      `https://dock-posted.vercel.app/pin/thanks?id=${pin.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  await sendMail({
    to: pin.email,
    subject: `Dock Posted · ${dock.name}`,
    text: [
      `You filed the pin for ${dock.name}.`,
      PIN_PRICE_LABEL,
      "You write the number. We don’t invent a price. We don’t sell a gallon.",
      "Truck day, or when you change the board.",
      `https://dock-posted.vercel.app/docks/${dock.id}`,
    ].join("\n"),
  });

  const checkout = await createCheckoutSession({
    kind: "pin",
    recordId: pin.id,
    email: pin.email,
    name: dock.name,
  });
  if (checkout) {
    redirect(checkout as never);
  }

  redirect(`/pin/thanks?id=${pin.id}`);
}
