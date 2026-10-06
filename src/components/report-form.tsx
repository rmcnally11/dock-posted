"use client";

import { useState, type ChangeEvent } from "react";
import { submitPriceReport } from "@/app/report/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prepareReportPhoto } from "@/lib/resize-photo";
import { reportGrades } from "@/lib/price-report";
import { STATE_CODES, type Dock, type StateCode } from "@/lib/types";

export interface ReportDockChoice {
  id: string;
  name: string;
  city: string;
  state: StateCode;
  phone: string | null;
  quotes: Dock["quotes"];
}

export function ReportForm({
  docks,
  initialDockId,
  initialWho,
  today,
}: {
  docks: ReportDockChoice[];
  initialDockId?: string;
  initialWho?: string;
  today: string;
}) {
  const startingDock = docks.find((dock) => dock.id === initialDockId)?.id ?? docks[0]?.id ?? "";
  const owner = initialWho === "marina";
  const [dockId, setDockId] = useState(startingDock);
  const selected = docks.find((dock) => dock.id === dockId) ?? null;
  const grades = selected ? reportGrades(selected) : [];
  const [gradeKey, setGradeKey] = useState(grades[0]?.key ?? "");
  const [photoNote, setPhotoNote] = useState("");
  const [preparing, setPreparing] = useState(false);
  const grouped = STATE_CODES.map((state) => ({
    state,
    docks: docks.filter((dock) => dock.state === state),
  })).filter((group) => group.docks.length > 0);

  function chooseDock(nextId: string) {
    setDockId(nextId);
    const next = docks.find((dock) => dock.id === nextId);
    const nextGrades = next ? reportGrades(next) : [];
    setGradeKey(nextGrades[0]?.key ?? "");
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    setPhotoNote("");
    if (!file) return;
    setPreparing(true);
    try {
      const prepared = await prepareReportPhoto(file);
      if ("error" in prepared) {
        input.value = "";
        setPhotoNote(prepared.error);
        return;
      }
      if (prepared.file !== file) {
        const transfer = new DataTransfer();
        transfer.items.add(prepared.file);
        input.files = transfer.files;
      }
      const kb = Math.max(1, Math.round(prepared.file.size / 1024));
      setPhotoNote(`Photo ready, ${kb} KB.`);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <form action={submitPriceReport} autoComplete="off" className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--ink)]/80">Marina</legend>
        <Label htmlFor="marina" className="sr-only">
          Marina
        </Label>
        <select
          id="marina"
          name="marina"
          value={dockId}
          onChange={(event) => chooseDock(event.target.value)}
          className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
        >
          {grouped.map((group) => (
            <optgroup key={group.state} label={stateLabel(group.state)}>
              {group.docks.map((dock) => (
                <option key={dock.id} value={dock.id} data-testid={`marina-${dock.id}`}>
                  {dock.name} · {dock.city}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selected ? (
          <p data-testid="reporting-for" className="text-xs text-[color:var(--ink)]/55">
            {selected.name}, {selected.city} {selected.state}
            {selected.phone ? ` · ${selected.phone}` : ""}
          </p>
        ) : null}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="grade">Hose</Label>
        {grades.length === 0 ? (
          <p className="text-sm text-[color:var(--ink)]/70">This dock has no hose on file.</p>
        ) : (
          <select
            id="grade"
            name="grade"
            value={gradeKey}
            onChange={(event) => setGradeKey(event.target.value)}
            data-testid="report-grade"
            className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
          >
            {grades.map((grade) => (
              <option key={grade.key} value={grade.key}>
                {grade.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price per gallon</Label>
          <Input id="price" name="price" inputMode="decimal" placeholder="5.790" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seenAt">The day you saw it</Label>
          <Input id="seenAt" name="seenAt" type="date" defaultValue={today} max={today} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photo">Photo of the pump or the board</Label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
          capture="environment"
          onChange={onPhoto}
          className="block w-full text-sm text-[color:var(--ink)] file:mr-3 file:min-h-11 file:rounded-md file:border file:border-[color:var(--line)] file:bg-white file:px-3 file:text-sm"
        />
        <p className="text-xs text-[color:var(--ink)]/50">
          Optional. Camera on your phone. Jpg, png, or heic.
        </p>
        {photoNote ? <p className="text-xs text-[color:var(--ink)]/70">{photoNote}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          required={false}
          maxLength={400}
          placeholder="Rec-90 on the hose. Tax in."
        />
      </div>

      <details className="space-y-3" {...(owner ? { open: true } : {})}>
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-[color:var(--ink)]/80">
          I run this dock
        </summary>
        <fieldset className="space-y-2 pt-2">
          <legend className="sr-only">Who posts</legend>
          <label className="flex min-h-11 items-center gap-3 text-base">
            <input type="radio" name="who" value="boater" defaultChecked={!owner} className="h-5 w-5" />
            I fueled here
          </label>
          <label className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="radio"
              name="who"
              value="marina"
              defaultChecked={owner}
              data-testid="who-marina"
              className="h-5 w-5"
            />
            I run this dock
          </label>
          <p className="text-xs text-[color:var(--ink)]/50">
            Truck day, or when you change the board. Not every morning.
          </p>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="hours">Hours</Label>
          <Input id="hours" name="hours" placeholder="Daily 7am–6pm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pay">Pay</Label>
            <select
              id="pay"
              name="pay"
              defaultValue=""
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            >
              <option value="">Ask the dock</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="both">Cash or card</option>
            </select>
          </div>
          <div className="space-y-2 pt-6 text-sm">
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" name="closed" value="1" className="h-5 w-5" />
              Closed
            </label>
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" name="dieselOnly" value="1" className="h-5 w-5" />
              Diesel only
            </label>
          </div>
        </div>
      </details>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" data-testid="post-price" disabled={preparing} className="w-full sm:w-auto">
        Send it
      </Button>
      <p className="text-xs text-[color:var(--ink)]/50">
        The number on the pump. If they did not put a number up, leave it blank.
      </p>
    </form>
  );
}

function stateLabel(state: StateCode): string {
  return state;
}
