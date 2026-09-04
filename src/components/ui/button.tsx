import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,opacity,background-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary: "bg-ink text-accent-fg",
        soft: "bg-paper text-ink shadow-[var(--shadow-card)]",
        ghost: "bg-transparent text-ink",
        danger: "bg-transparent text-clay",
      },
      size: {
        md: "h-12 px-5 text-sm rounded-full",
        sm: "h-10 px-4 text-sm rounded-full",
        icon: "size-11 rounded-full",
        tile: "h-auto rounded-2xl p-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
