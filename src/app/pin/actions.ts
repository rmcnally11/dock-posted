"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writeCallToAirtable, writePinToAirtable } from "@/lib/airtable-desk";
import {
  dockWaterLabel,
  emailsMatch,
  livePinForDock,
  parsePinInput,
  PIN_PRICE_LABEL,
  pinPitch,
  weekOfIso,
} from "@/lib/income";
import { notifyEmail, sendMail } from "@/lib/notify";
import { createCheckoutSession } from "@/lib/pay";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import {
  addDeskCalls,
  addPinClaim,
  attachIncomeAirtable,
  readDocks,
  readIncomeStore,
} from "@/lib/store";

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

  const income = await readIncomeStore();
  const live = livePinForDock(income.pins, parsed.value.dockId);
  if (live && !emailsMatch(live.email, parsed.value.email)) {
    const [call] = await addDeskCalls([
      {
        dockId: dock.id,
        dockName: dock.name,
        phone: dock.phone,
        water: dockWaterLabel(dock),
        weekOf: weekOfIso(),
        status: "queued",
        note: `Pin challenge. ${parsed.value.contactName} · ${parsed.value.email} · ${parsed.value.phone}. Live pin ${live.email}.`,
      },
    ]);
    if (call) {
      const airtableId = await writeCallToAirtable(call);
      if (airtableId) await attachIncomeAirtable("call", call.id, airtableId);
    }
    await sendMail({
      to: notifyEmail(),
      subject: `Pin challenge · ${dock.name}`,
      text: [
        `${dock.name} already has a live pin.`,
        `Live: ${live.contactName} · ${live.email}`,
        `Challenge: ${parsed.value.contactName} · ${parsed.value.email} · ${parsed.value.phone}`,
        "Call the published dock number. Not the number they typed.",
      ].join("\n"),
    });
    redirect("/pin?error=That%20dock%20already%20has%20a%20pin.%20We%20sent%20the%20challenge%20to%20the%20desk.");
  }
  if (live && live.status === "paid") {
    redirect(`/pin/thanks?id=${encodeURIComponent(live.id)}&paid=1`);
  }

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    redirect("/pin?error=Too%20many%20filings%20from%20this%20network.");
  }

  const pin = live ?? (await addPinClaim(parsed.value, dock.name));
  if (!live) {
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
        "Use this email when you post as I run this dock.",
        `https://dock-posted.vercel.app/docks/${dock.id}`,
      ].join("\n"),
    });
  }

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
