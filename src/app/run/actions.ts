"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { writeWatchToAirtable, writeWatchToFieldBrief } from "@/lib/airtable-desk";
import { parseWatchInput, runWatchHref, WATCH_PRICE_LABEL, waterLabel } from "@/lib/income";
import { notifyEmail, sendMail } from "@/lib/notify";
import { createCheckoutSession } from "@/lib/pay";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import { addWaterWatch, attachIncomeAirtable } from "@/lib/store";

export async function submitWaterWatch(formData: FormData): Promise<void> {
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot) {
    redirect("/run");
  }

  const parsed = parseWatchInput({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    corridor: String(formData.get("corridor") ?? ""),
    region: String(formData.get("region") ?? ""),
    gallons: String(formData.get("gallons") ?? ""),
  });

  if (!parsed.ok) {
    redirect(`/run?error=${encodeURIComponent(parsed.error)}`);
  }

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    redirect("/run?error=Too%20many%20watches%20from%20this%20network.");
  }

  const watch = await addWaterWatch(parsed.value);
  const airtableId = await writeWatchToAirtable(watch);
  if (airtableId) await attachIncomeAirtable("watch", watch.id, airtableId);
  await writeWatchToFieldBrief(watch);

  const water = waterLabel(watch.corridor, watch.region);
  await sendMail({
    to: notifyEmail(),
    subject: `Run watch · ${water}`,
    text: `${watch.name} · ${watch.email}\n${water}\n${WATCH_PRICE_LABEL}`,
  });
  await sendMail({
    to: watch.email,
    subject: `Dock Posted · ${water}`,
    text: [
      `Watch filed for ${water}.`,
      WATCH_PRICE_LABEL,
      "When a dock on that water posts, we write you. Not a text.",
      "A blank stays Call.",
    ].join("\n"),
  });

  const checkout = await createCheckoutSession({
    kind: "watch",
    recordId: watch.id,
    email: watch.email,
    name: water,
    successPath: runWatchHref({
      corridor: watch.corridor,
      region: watch.region,
      gallons: watch.gallons,
      watched: true,
      paid: true,
    }),
    cancelPath: runWatchHref({
      corridor: watch.corridor,
      region: watch.region,
      gallons: watch.gallons,
      watched: true,
    }),
  });
  if (checkout) {
    redirect(checkout as never);
  }

  redirect(
    runWatchHref({
      corridor: watch.corridor,
      region: watch.region,
      gallons: watch.gallons,
      watched: true,
    }) as never,
  );
}
