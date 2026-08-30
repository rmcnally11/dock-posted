"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseOwnerPlanInput, parseYardLeftoverInput } from "@/lib/haul-out";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import { addNamedStormPlan, postYardLeftover } from "@/lib/store";

function failOwner(message: string): never {
  redirect(`/haul-out?error=${encodeURIComponent(message)}`);
}

function failYard(message: string): never {
  redirect(`/haul-out?yardError=${encodeURIComponent(message)}#yard-post`);
}

export async function submitNamedStormPlan(formData: FormData): Promise<void> {
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot) {
    redirect("/haul-out");
  }

  const parsed = parseOwnerPlanInput({
    ownerName: String(formData.get("ownerName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    homeDock: String(formData.get("homeDock") ?? ""),
    length: String(formData.get("length") ?? ""),
    beam: String(formData.get("beam") ?? ""),
    insuranceCarrier: String(formData.get("insuranceCarrier") ?? ""),
    berth: String(formData.get("berth") ?? ""),
  });

  if (!parsed.ok) failOwner(parsed.error);

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) failOwner("Too many filings from this network.");

  const plan = await addNamedStormPlan(parsed.value);
  redirect(`/haul-out/plan/${plan.id}`);
}

export async function submitYardLeftover(formData: FormData): Promise<void> {
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot) {
    redirect("/haul-out");
  }

  const parsed = parseYardLeftoverInput({
    name: String(formData.get("yardName") ?? ""),
    indoorLeftover: String(formData.get("indoorLeftover") ?? ""),
    lotLeftover: String(formData.get("lotLeftover") ?? ""),
    maxLength: String(formData.get("maxLength") ?? ""),
    phone: String(formData.get("yardPhone") ?? ""),
  });

  if (!parsed.ok) failYard(parsed.error);

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) failYard("Too many posts from this network.");

  await postYardLeftover(parsed.value);
  redirect("/haul-out?posted=1#yard-board");
}
