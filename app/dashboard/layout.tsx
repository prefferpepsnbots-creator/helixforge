import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect=/dashboard");
  }

  const user = await currentUser();
  const firstName = user?.firstName ?? "Member";

  return (
    <DashboardShell userName={firstName}>
      {children}
    </DashboardShell>
  );
}
