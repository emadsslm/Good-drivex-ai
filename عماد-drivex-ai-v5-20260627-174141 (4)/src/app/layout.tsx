import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/drivex/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DriveX AI V5 – Universal AI Companion",
  description: "DriveX AI V5 — your intelligent AI companion. Continuous voice conversation, any topic: education, programming, design, creative writing, business and more. Plus smart driving assistance.",
  keywords: [
    "DriveX AI",
    "AI companion",
    "voice assistant",
    "continuous voice conversation",
    "AI chat",
    "driving assistant",
    "PWA",
    "navigation",
  ],
  authors: [{ name: "DriveX AI" }],
  manifest: "/manifest.json",
  applicationName: "DriveX AI"
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
