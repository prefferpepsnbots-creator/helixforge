import Link from "next/link";
import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t py-12 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <span>HelixForge Wellness</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Empowering individuals to optimize peptide therapies through hyper-personalized,
              DNA-driven protocols. Education and planning only — we never sell, compound, or
              prescribe peptides.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link href="#protocols" className="hover:text-foreground transition-colors">Protocols</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-foreground transition-colors">Medical Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HelixForge Wellness. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Medical Disclaimer:</strong> HelixForge does not sell, compound, or prescribe
            peptides. All protocols require consultation with a licensed physician.
          </p>
        </div>
      </div>
    </footer>
  );
}
