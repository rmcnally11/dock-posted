import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-harbor/15 bg-white px-3 text-base text-harbor shadow-sm placeholder:text-harbor/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wake/50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
