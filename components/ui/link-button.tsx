"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

export function LinkButton({
  href,
  className,
  variant = "default",
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
