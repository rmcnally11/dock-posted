"use client";

import { useRef } from "react";

export function WeeklyFuelFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      data-testid="weekly-fuel-frame"
      className="mt-6 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--cream)]"
      style={{ height: 880 }}
      onLoad={() => {
        const frame = ref.current;
        const doc = frame?.contentDocument?.documentElement;
        const body = frame?.contentDocument?.body;
        if (!frame || !doc || !body) return;
        frame.style.height = `${Math.max(doc.scrollHeight, body.scrollHeight)}px`;
      }}
    />
  );
}
