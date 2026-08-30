import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--diesel)]/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--navy)] text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90",
        secondary:
          "bg-[color:var(--diesel)] text-white hover:bg-[color:var(--diesel)]/90",
        outline:
          "border border-[color:var(--line)] bg-white text-[color:var(--navy)] hover:bg-[color:var(--fog)]",
        ghost: "text-[color:var(--navy)] hover:bg-[color:var(--navy)]/6",
        rust: "bg-[color:var(--signal)] text-white hover:bg-[color:var(--signal)]/90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
