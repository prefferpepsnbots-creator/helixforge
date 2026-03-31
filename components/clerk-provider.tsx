"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function HelixProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}

