import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:opacity-50 min-h-11 px-3",
  {
    variants: {
      variant: {
        default: "bg-[#486d9b] text-white hover:bg-[#385b87]",
        ghost: "hover:bg-slate-100 text-slate-700",
        outline: "border border-slate-200 bg-white hover:bg-slate-50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: { default: "", icon: "w-11 shrink-0 px-0" },
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
