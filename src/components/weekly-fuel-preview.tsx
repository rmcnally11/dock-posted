import { WeeklyFuelFrame } from "@/components/weekly-fuel-frame";
import { loginWeeklyFuelPreview } from "@/app/review/fuel/actions";
import {
  WEEKLY_FUEL_PREVIEW_GATE,
  WEEKLY_FUEL_PREVIEW_NOTE,
  WEEKLY_FUEL_PREVIEW_TITLE,
  type WeeklyFuelMail,
  type WeeklyFuelPreviewLink,
} from "@/lib/weekly-fuel";
import type { HomeAreaId } from "@/lib/posted";
import { cn } from "@/lib/utils";

export function WeeklyFuelPreview(
  props:
    | { authed: false; slug: HomeAreaId; error?: string }
    | { authed: true; mail: WeeklyFuelMail; links: WeeklyFuelPreviewLink[] },
) {
  if (!props.authed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16">
        <h1 className="font-heading text-2xl text-[color:var(--navy)]">{WEEKLY_FUEL_PREVIEW_TITLE}</h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/70">{WEEKLY_FUEL_PREVIEW_GATE}</p>
        <form action={loginWeeklyFuelPreview} className="mt-8 space-y-4" autoComplete="off" data-testid="weekly-fuel-login">
          {props.error ? <p className="text-sm text-[#8a2c12]">{props.error}</p> : null}
          <input type="hidden" name="slug" value={props.slug} />
          <label className="block text-sm">
            <span className="text-black/60">Password</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="mt-1 h-11 w-full border border-black/20 bg-white px-3 text-base md:text-sm"
            />
          </label>
          <button type="submit" className="h-11 border border-black bg-black px-4 text-sm text-white">
            Continue
          </button>
        </form>
      </main>
    );
  }

  const { mail, links } = props;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8" data-testid="weekly-fuel-preview">
      <h1 className="font-heading text-2xl text-[color:var(--navy)]">{WEEKLY_FUEL_PREVIEW_TITLE}</h1>
      <p className="mt-2 text-sm text-[color:var(--ink)]/70" data-testid="weekly-fuel-note">
        {WEEKLY_FUEL_PREVIEW_NOTE}
      </p>
      <p className="mt-4 text-sm" data-testid="weekly-fuel-subject">
        <span className="text-[color:var(--ink)]/55">Subject. </span>
        {mail.subject}
      </p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Areas">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            aria-current={link.current ? "page" : undefined}
            data-testid={`weekly-fuel-nav-${link.id}`}
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-3 text-sm",
              link.current
                ? "border-[color:var(--navy)] bg-[color:var(--navy)] text-[color:var(--cream)]"
                : "border-[color:var(--line)] bg-white text-[color:var(--navy)]",
            )}
          >
            {link.title}
          </a>
        ))}
      </nav>
      <WeeklyFuelFrame html={mail.html} title={mail.subject} />
      <details className="mt-4" data-testid="weekly-fuel-text">
        <summary className="cursor-pointer text-sm text-[color:var(--ink)]/70">Plain text</summary>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-[color:var(--navy)]">{mail.text}</pre>
      </details>
    </main>
  );
}
