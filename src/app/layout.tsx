import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RJMLABS.CO.UK - AgentOS | Mission Control",
  description: "RJMLABS.CO.UK Agent Operating System — Enterprise-grade AI agent management with searchable memory vault, model routing, swarm orchestration, and production surfaces.",
  keywords: ["RJMLABS", "AgentOS", "AI Agents", "Mission Control", "Dashboard", "Multi-Agent", "VPS Management", "RJMLABS.CO.UK"],
  authors: [{ name: "RJMLABS.CO.UK" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "RJMLABS.CO.UK - AgentOS | Mission Control",
    description: "Enterprise-grade AI agent management platform by RJMLABS.CO.UK",
    url: "https://rjmlabs.co.uk",
    siteName: "RJMLABS AgentOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RJMLABS.CO.UK - AgentOS | Mission Control",
    description: "Enterprise-grade AI agent management platform by RJMLABS.CO.UK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
