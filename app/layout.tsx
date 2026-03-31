import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HelixProvider } from "@/components/clerk-provider";
import { HelixBody } from "@/components/helix-body";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HelixForge Wellness — DNA-Driven Peptide Optimization",
  description:
    "AI-powered, DNA-driven 90-day peptide optimization protocols. Personalized genetic blueprints, evidence-based training, and precision nutrition — orchestrated by Paperclip AI.",
  keywords: ["peptide optimization", "DNA health", "genetic protocol", "personalized wellness", "peptides"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}>
        <HelixProvider>
          <HelixBody>{children}</HelixBody>
        </HelixProvider>
      </body>
    </html>
  );
}
