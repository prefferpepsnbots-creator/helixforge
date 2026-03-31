import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Suspense
        fallback={
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        }
      >
        <SignIn />
      </Suspense>
    </div>
  );
}
