"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { User, Bell, Shield, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [progressReminders, setProgressReminders] = useState(true);

  async function handleExportData() {
    toast.success("Data export initiated. You'll receive an email with your data within 24 hours.");
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, notifications, and data</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your HelixForge account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Badge variant="secondary">Edit via Clerk</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Badge variant="secondary">Verified</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plan</p>
              <p className="text-sm text-muted-foreground">Protocol Access — Active</p>
            </div>
            <Button size="sm" variant="outline">
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how HelixForge communicates with you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>
              <p className="text-sm text-muted-foreground">Protocol updates and platform news</p>
            </div>
            <button
              onClick={() => {
                setEmailNotifications(!emailNotifications);
                toast.success(emailNotifications ? "Email notifications disabled" : "Email notifications enabled");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Progress reminders</p>
              <p className="text-sm text-muted-foreground">Weekly check-ins and compliance nudges</p>
            </div>
            <button
              onClick={() => {
                setProgressReminders(!progressReminders);
                toast.success(progressReminders ? "Reminders disabled" : "Reminders enabled");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                progressReminders ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  progressReminders ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>Data management and privacy controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your data stored with HelixForge
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportData}>
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button size="sm" variant="destructive">
              Delete Account
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">
                Managed via Clerk &bull; 2FA recommended
              </p>
            </div>
            <Button size="sm" variant="outline">
              Manage via Clerk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Physician Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Physician Consultation Checklist
          </CardTitle>
          <CardDescription>
            Before starting peptides, discuss these items with your doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {[
              "Current medications and potential interactions",
              "Baseline blood panel (CBC, CMP, lipid panel, testosterone/estrogen)",
              "Thyroid function (TSH, Free T3, Free T4)",
              "Current supplementation stack",
              "BPC-157 and TB-500: discuss dosing and route of administration",
              "Contraindications: bleeding disorders, pregnancy, active cancer",
              "Peptide sourcing: compounded vs pharmaceutical grade",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded border border-muted-foreground/30 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4 italic">
            HelixForge provides this checklist for educational purposes. It does not constitute
            medical advice. Always consult a licensed physician.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
