"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Zap className="h-5 w-5 text-primary" />
            <span>HelixForge</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#protocols" className="hover:text-foreground transition-colors">
              Protocols
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign In
            </Link>
            <Link href="/checkout?plan=coaching" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              Start Your Protocol
            </Link>
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8 text-base">
                <Link href="#how-it-works" onClick={() => setOpen(false)}>How It Works</Link>
                <Link href="#protocols" onClick={() => setOpen(false)}>Protocols</Link>
                <Link href="#pricing" onClick={() => setOpen(false)}>Pricing</Link>
                <Link href="#faq" onClick={() => setOpen(false)}>FAQ</Link>
                <hr className="my-2" />
                <Link href="/sign-in" onClick={() => setOpen(false)}>Sign In</Link>
                <Link
                  href="/checkout?plan=coaching"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Start Your Protocol
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
