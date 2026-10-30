import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const buttonVariants = cva(
  "inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-[background-color,color,border-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--solid)] text-[var(--on-solid)] hover:bg-[var(--solid-hover)] disabled:bg-[var(--hover-strong)] disabled:text-[var(--ink-3)] disabled:opacity-100",
        ghost: "text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)]",
        outline: "border border-[var(--line-2)] text-[var(--ink)] hover:bg-[var(--hover)]",
        destructive:
          "border border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-[var(--danger-bg-hover)]",
      },
      size: { default: "", icon: "w-9 shrink-0 px-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={twMerge(clsx(buttonVariants({ variant, size }), className))}
      {...props}
    />
  );
}
export { Button, buttonVariants };
