"use client";

import { useEffect, useRef, useState } from "react";
import { xProfileUrl } from "@/lib/x-handle";

const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

type TimelineStatus = "pending" | "ready" | "empty";

type Twttr = {
  widgets?: {
    load: (el?: HTMLElement) => Promise<unknown> | void;
  };
};

export function XTimeline({ handle }: { handle: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<TimelineStatus>("pending");
  const profile = xProfileUrl(handle);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let settleTimer = 0;

    const fail = () => {
      if (!cancelled) setStatus("empty");
    };

    const watchdog = window.setTimeout(fail, 8000);

    const markFromIframe = () => {
      const iframe = host.querySelector("iframe");
      if (!iframe || cancelled) return;
      window.clearTimeout(watchdog);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (cancelled) return;
        if (iframe.offsetHeight > 220) setStatus("ready");
        else fail();
      }, 1200);
    };

    const observer = new MutationObserver(markFromIframe);
    observer.observe(host, { childList: true, subtree: true });

    const start = () => {
      const twttr = (window as Window & { twttr?: Twttr }).twttr;
      try {
        void twttr?.widgets?.load(host);
      } catch {
        fail();
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGETS_SRC}"]`);
    if (existing) {
      if ((window as Window & { twttr?: Twttr }).twttr) start();
      else existing.addEventListener("load", start);
      existing.addEventListener("error", fail);
    } else {
      const script = document.createElement("script");
      script.src = WIDGETS_SRC;
      script.async = true;
      script.onload = start;
      script.onerror = fail;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      window.clearTimeout(settleTimer);
      observer.disconnect();
    };
  }, [handle]);

  return (
    <section id="on-x" data-testid="on-x" className="mt-12 max-w-xl">
      <h2 className="font-heading text-2xl text-[color:var(--navy)]">On X</h2>
      {status !== "ready" ? (
        <p
          data-testid="on-x-fallback"
          className="mt-3 text-sm leading-6 text-[color:var(--ink)]/70"
        >
          Nothing on X yet.{" "}
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href={profile}
          >
            {profile}
          </a>
        </p>
      ) : null}
      <div
        ref={hostRef}
        className={status === "empty" ? "hidden" : "mt-4 min-h-0"}
        aria-hidden={status !== "ready"}
      >
        <a
          className="twitter-timeline"
          data-dnt="true"
          href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}
        >
          Posts from {handle}
        </a>
      </div>
    </section>
  );
}
