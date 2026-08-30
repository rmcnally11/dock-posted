import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base text-[color:var(--cream)] shadow-sm placeholder:text-[color:var(--cream)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sea)]/50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
