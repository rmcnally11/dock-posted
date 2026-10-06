"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import { saveReportPhoto } from "@/lib/persist";
import {
  inspectPhoto,
  photoContentType,
  photoExtension,
  planAlertIntake,
  planReportIntake,
} from "@/lib/price-report";
import { commitPriceAlert, commitQueuedReport, readDocks } from "@/lib/store";

function reportError(message: string, dockId: string): never {
  const dock = dockId ? `&dock=${encodeURIComponent(dockId)}` : "";
  redirect(`/report?error=${encodeURIComponent(message)}${dock}`);
}

export async function submitPriceReport(formData: FormData): Promise<void> {
  const dockId = String(formData.get("marina") ?? "").trim();
  const docks = await readDocks();
  const dock = docks.find((row) => row.id === dockId) ?? null;
  const plan = planReportIntake(
    {
      websiteUrl: String(formData.get("website_url") ?? ""),
      dockId,
      grade: String(formData.get("grade") ?? ""),
      price: String(formData.get("price") ?? ""),
      seenAt: String(formData.get("seenAt") ?? ""),
      note: String(formData.get("note") ?? ""),
      who: String(formData.get("who") ?? ""),
      hours: String(formData.get("hours") ?? ""),
      pay: String(formData.get("pay") ?? ""),
      closed: formData.get("closed") === "1",
      dieselOnly: formData.get("dieselOnly") === "1",
    },
    dock,
  );

  if (plan.kind === "drop") {
    redirect("/");
  }
  if (plan.kind === "reject") {
    reportError(plan.error, dockId);
  }

  const photoValue = formData.get("photo");
  let photoBytes: Uint8Array | null = null;
  let photoKind: ReturnType<typeof inspectPhoto> | null = null;
  if (photoValue instanceof File && photoValue.size > 0) {
    photoBytes = new Uint8Array(await photoValue.arrayBuffer());
    photoKind = inspectPhoto(photoBytes);
    if (!photoKind.ok) reportError(photoKind.error, dockId);
  }

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    reportError("Too many reports from this network.", dockId);
  }

  const id = randomUUID();
  let photoPath: string | null = null;
  if (photoBytes && photoKind && photoKind.ok) {
    photoPath = await saveReportPhoto(
      id,
      photoBytes,
      photoExtension(photoKind.kind),
      photoContentType(photoKind.kind),
    );
  }

  try {
    await commitQueuedReport(plan, { id, photoPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save report";
    reportError(message, dockId);
  }

  // A saved price used to redirect(`/?reported=${dockId}#board`).
  // It waits for a look now. The boater stays on this page.
  redirect(`/report?dock=${encodeURIComponent(dockId)}&sent=1`);
}

export async function submitPriceAlert(formData: FormData): Promise<void> {
  const dockId = String(formData.get("dock") ?? "").trim();
  const docks = await readDocks();
  const dock = docks.find((row) => row.id === dockId) ?? null;
  const plan = planAlertIntake(
    {
      websiteUrl: String(formData.get("website_url") ?? ""),
      dockId,
      email: String(formData.get("email") ?? ""),
      consent: formData.get("consent") === "yes",
    },
    dock,
  );

  if (plan.kind === "drop") {
    redirect("/");
  }
  if (plan.kind === "reject") {
    redirect(
      `/report?dock=${encodeURIComponent(dockId)}&sent=1&alertError=${encodeURIComponent(plan.error)}`,
    );
  }

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    redirect(
      `/report?dock=${encodeURIComponent(dockId)}&sent=1&alertError=${encodeURIComponent("Too many notes from this network.")}`,
    );
  }

  try {
    await commitPriceAlert(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that";
    redirect(
      `/report?dock=${encodeURIComponent(dockId)}&sent=1&alertError=${encodeURIComponent(message)}`,
    );
  }

  redirect(`/report?dock=${encodeURIComponent(dockId)}&sent=1&alert=1`);
}
