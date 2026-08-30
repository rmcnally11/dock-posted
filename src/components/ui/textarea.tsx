import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-[color:var(--line)] bg-white px-3 py-2 text-base text-[color:var(--cream)] shadow-sm placeholder:text-[color:var(--cream)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sea)]/50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
