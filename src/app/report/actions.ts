"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { addPriceReport } from "@/lib/store";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";
import { ETHANOLS, PRODUCTS, type Ethanol, type Product } from "@/lib/types";

export async function submitPriceReport(formData: FormData): Promise<void> {
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot) {
    redirect("/");
  }

  const dockId = String(formData.get("marina") ?? "").trim();
  const product = String(formData.get("product") ?? "") as Product;
  const ethanolRaw = String(formData.get("ethanol") ?? "") as Ethanol;
  const pricePerGallon = Number(formData.get("price"));
  const seenAt = String(formData.get("seenAt") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!dockId) {
    redirect("/report?error=Pick%20the%20dock.");
  }
  if (!PRODUCTS.includes(product)) {
    redirect(`/report?error=Pick%20the%20hose.&dock=${encodeURIComponent(dockId)}`);
  }
  if (!Number.isFinite(pricePerGallon) || pricePerGallon <= 0 || pricePerGallon > 20) {
    redirect(
      `/report?error=The%20number%20on%20the%20pump%2C%20per%20gallon.&dock=${encodeURIComponent(dockId)}`,
    );
  }
  if (!seenAt) {
    redirect(`/report?error=When%20did%20you%20see%20it%3F&dock=${encodeURIComponent(dockId)}`);
  }

  const ethanol: Ethanol =
    product === "diesel" ? "unknown" : ETHANOLS.includes(ethanolRaw) ? ethanolRaw : "unknown";

  const slot = takeReportSlot(clientKey(await headers()));
  if (!slot.ok) {
    redirect(
      `/report?error=Too%20many%20reports%20from%20this%20network.&dock=${encodeURIComponent(dockId)}`,
    );
  }

  try {
    await addPriceReport({
      dockId,
      product,
      ethanol,
      pricePerGallon,
      seenAt,
      note: note || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save report";
    redirect(`/report?error=${encodeURIComponent(message)}&dock=${encodeURIComponent(dockId)}`);
  }

  redirect(`/?reported=${dockId}`);
}
