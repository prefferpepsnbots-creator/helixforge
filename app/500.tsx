import { GlobalErrorClient } from "@/components/global-error-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorClient error={error} reset={reset} />;
}
