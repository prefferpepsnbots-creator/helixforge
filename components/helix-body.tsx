"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function HelixBody({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted && <Toaster richColors position="bottom-right" />}
    </>
  );
}
