"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ETHANOLS, PRODUCTS, type Dock, type Ethanol, type Product } from "@/lib/types";

export function ReportForm({ docks, initialDockId }: { docks: Dock[]; initialDockId?: string }) {
  const router = useRouter();
  const [dockId, setDockId] = useState(initialDockId ?? docks[0]?.id ?? "");
  const [product, setProduct] = useState<Product>("90");
  const [ethanol, setEthanol] = useState<Ethanol>("E0");
  const [price, setPrice] = useState("");
  const [seenAt, setSeenAt] = useState(todayInput());
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => docks.find((dock) => dock.id === dockId) ?? null,
    [docks, dockId],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const pricePerGallon = Number(price);
    if (!dockId) {
      setError("Pick a marina.");
      return;
    }
    if (!Number.isFinite(pricePerGallon) || pricePerGallon <= 0) {
      setError("Enter the price you saw on the pump, per gallon.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dockId,
          product,
          ethanol: product === "diesel" ? "unknown" : ethanol,
          pricePerGallon,
          seenAt,
          note: note.trim() || null,
          company,
        }),
      });
      const payload = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        setError(payload.error ?? "Could not save that report.");
        return;
      }
      router.push(`/?reported=${dockId}`);
      router.refresh();
    } catch {
      setError("Network error. Try again from a better signal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Marina">
        <select
          className="h-11 w-full rounded-md border border-harbor/15 bg-white px-3 text-base text-harbor md:text-sm"
          value={dockId}
          onChange={(event) => setDockId(event.target.value)}
          required
        >
          {docks.map((dock) => (
            <option key={dock.id} value={dock.id}>
              {dock.name} — {dock.city}, {dock.state}
            </option>
          ))}
        </select>
        {selected?.phone ? (
          <p className="mt-1 text-xs text-harbor/55">Listed phone {selected.phone}</p>
        ) : null}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product">
          <select
            className="h-11 w-full rounded-md border border-harbor/15 bg-white px-3 text-base md:text-sm"
            value={product}
            onChange={(event) => setProduct(event.target.value as Product)}
          >
            {PRODUCTS.map((item) => (
              <option key={item} value={item}>
                {item === "diesel" ? "Diesel" : `${item} octane`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ethanol">
          <select
            className="h-11 w-full rounded-md border border-harbor/15 bg-white px-3 text-base md:text-sm"
            value={ethanol}
            onChange={(event) => setEthanol(event.target.value as Ethanol)}
            disabled={product === "diesel"}
          >
            {ETHANOLS.map((item) => (
              <option key={item} value={item}>
                {item === "E0" ? "E0 / ethanol-free" : item}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price per gallon">
          <Input
            inputMode="decimal"
            placeholder="5.790"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </Field>
        <Field label="When you saw it">
          <Input
            type="date"
            value={seenAt}
            onChange={(event) => setSeenAt(event.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Note (optional)">
        <Textarea
          maxLength={400}
          placeholder="Pump label said Rec-90. Attendant confirmed tax included."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      {error ? (
        <p className="rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : "Post this price"}
      </Button>
      <p className="text-xs text-harbor/50">
        No account. Do not invent a number. If the dock said Call, leave it off the form.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
