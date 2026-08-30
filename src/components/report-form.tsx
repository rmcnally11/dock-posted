"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CORRIDORS, ETHANOLS, PRODUCTS, type CorridorId, type Dock, type Ethanol, type Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReportForm({ docks, initialDockId }: { docks: Dock[]; initialDockId?: string }) {
  const router = useRouter();
  const startingDock =
    docks.find((dock) => dock.id === initialDockId)?.id ?? docks[0]?.id ?? "";
  const [dockId, setDockId] = useState(startingDock);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    <form onSubmit={onSubmit} autoComplete="off" noValidate className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-harbor/80">Marina</legend>
        {(Object.keys(CORRIDORS) as CorridorId[]).map((corridor) => (
          <div key={corridor} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-harbor/45">
              {CORRIDORS[corridor].label}
            </p>
            <div className="space-y-1">
              {docks
                .filter((dock) => dock.corridor === corridor)
                .map((dock) => (
                  <label
                    key={dock.id}
                    data-testid={`marina-${dock.id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                      dockId === dock.id
                        ? "border-wake bg-sand"
                        : "border-harbor/10 bg-white hover:border-harbor/25",
                    )}
                  >
                    <input
                      type="radio"
                      name="marina"
                      value={dock.id}
                      checked={dockId === dock.id}
                      onChange={() => setDockId(dock.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium text-harbor">{dock.name}</span>
                      <span className="block text-xs text-harbor/55">
                        {dock.city}, {dock.state}
                        {dock.phone ? ` · ${dock.phone}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
        {selected ? (
          <p data-testid="reporting-for" className="text-xs text-harbor/55">
            Reporting for {selected.name}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product">Product</Label>
          <select
            id="product"
            name="product"
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ethanol">Ethanol</Label>
          <select
            id="ethanol"
            name="ethanol"
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price per gallon</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="5.790"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seenAt">When you saw it</Label>
          <Input
            id="seenAt"
            name="seenAt"
            type="date"
            value={seenAt}
            onChange={(event) => setSeenAt(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          required={false}
          maxLength={400}
          placeholder="Pump label said Rec-90. Attendant confirmed tax included."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          name="website_url"
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

function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
