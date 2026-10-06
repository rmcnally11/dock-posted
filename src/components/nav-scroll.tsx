"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavScroll({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLElement>(null);
  const [more, setMore] = useState(true);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      setMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative min-w-0 flex-1">
      <nav
        ref={scroller}
        aria-label="Dock Posted"
        data-testid="site-nav"
        className={cn(
          "flex items-center gap-x-0.5 overflow-x-auto",
          more ? "justify-start pr-6" : "justify-start md:justify-end",
        )}
      >
        {children}
      </nav>
      {more ? (
        <span
          aria-hidden
          data-testid="nav-scroll-hint"
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-[color:var(--cream)] from-40% to-transparent pl-3 pr-0.5 text-sm text-[color:var(--ink)]/55"
        >
          ›
        </span>
      ) : null}
    </div>
  );
}
