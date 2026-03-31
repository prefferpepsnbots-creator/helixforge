"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Dna,
  Brain,
  Dumbbell,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/protocol", label: "My Protocol", icon: Dna },
  { href: "/dashboard/training", label: "Training Plan", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Nutrition", icon: Brain },
  { href: "/dashboard/coaching", label: "AI Coaching", icon: Brain },
];

function SignOutBtn({ className = "" }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/" })}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className}`}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign Out
    </button>
  );
}

function SidebarNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b shrink-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Zap className="h-5 w-5 text-primary" />
          <span>HelixForge</span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <Badge variant="secondary" className="text-xs mt-0.5">
              Active Protocol
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <SignOutBtn />
      </div>
    </aside>
  );
}

function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 lg:hidden flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-auto">
        <Zap className="h-5 w-5 text-primary" />
        <span>HelixForge</span>
      </Link>

      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0" />}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <div className="flex items-center gap-3 pt-4 pb-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{userName}</p>
              <Badge variant="secondary" className="text-xs mt-0.5">Active Protocol</Badge>
            </div>
          </div>
          <Separator className="my-3" />
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <Separator className="my-3" />
          <nav className="space-y-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <SignOutBtn className="!justify-start" />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function DashboardShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNav userName={userName} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileNav userName={userName} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
